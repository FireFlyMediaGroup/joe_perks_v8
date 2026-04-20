"use server";

import { database } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ORG_APPLICATION_RECEIVED_SUBJECT,
  OrgApplicationReceivedEmail,
} from "@joe-perks/email/templates/org-application-received";
import { limitOrgApplication } from "@joe-perks/stripe";
import { isReservedSlug, isValidSlugFormat } from "@joe-perks/types";
import { headers } from "next/headers";
import { createElement } from "react";

import {
  CURRENT_ORG_TERMS_VERSION,
  type OrgApplicationData,
  orgApplicationSchema,
} from "../_lib/schema";

type ActionResult =
  | { success: true; applicationId: string }
  | { success: false; error: string; code: string };

function getIpFromHeaders(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headersList.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

export async function submitOrgApplication(
  data: OrgApplicationData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = getIpFromHeaders(headersList);

  const { success: allowed } = await limitOrgApplication(ip);
  if (!allowed) {
    return {
      success: false,
      error: "Too many applications submitted. Please try again later.",
      code: "RATE_LIMITED",
    };
  }

  const parsed = orgApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form data. Please check your entries and try again.",
      code: "VALIDATION_ERROR",
    };
  }

  const {
    orgName,
    contactName,
    email,
    phone,
    description,
    desiredSlug,
    primaryRoasterId,
    backupRoasterId,
    desiredOrgPct,
  } = parsed.data;

  // Re-validate slug (race condition guard)
  if (!isValidSlugFormat(desiredSlug)) {
    return {
      success: false,
      error: "The storefront URL format is invalid.",
      code: "INVALID_SLUG",
    };
  }
  if (isReservedSlug(desiredSlug)) {
    return {
      success: false,
      error: "That storefront URL is not available.",
      code: "RESERVED_SLUG",
    };
  }

  // Validate desiredOrgPct within platform bounds
  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });
  const minPct = settings.orgPctMin;
  const maxPct = settings.orgPctMax;
  if (desiredOrgPct < minPct || desiredOrgPct > maxPct) {
    return {
      success: false,
      error: `Fundraiser percentage must be between ${Math.round(minPct * 100)}% and ${Math.round(maxPct * 100)}%.`,
      code: "INVALID_PCT",
    };
  }

  // Validate primary roaster is active
  const primaryRoaster = await database.roaster.findFirst({
    where: { id: primaryRoasterId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!primaryRoaster) {
    return {
      success: false,
      error: "The selected roaster is no longer available.",
      code: "INVALID_ROASTER",
    };
  }

  let applicationId!: string;
  try {
    await database.$transaction(async (tx) => {
      const application = await tx.orgApplication.create({
        data: {
          status: "PENDING_PLATFORM_REVIEW",
          email,
          orgName,
          contactName,
          phone: phone || null,
          description: description || null,
          desiredSlug,
          desiredOrgPct,
          termsAgreedAt: new Date(),
          termsVersion: CURRENT_ORG_TERMS_VERSION,
        },
        select: { id: true },
      });
      applicationId = application.id;

      await tx.roasterOrgRequest.create({
        data: {
          applicationId: application.id,
          roasterId: primaryRoasterId,
          status: "PENDING",
          priority: 1,
        },
      });

      if (backupRoasterId && backupRoasterId !== primaryRoasterId) {
        const backupExists = await tx.roaster.findFirst({
          where: { id: backupRoasterId, status: "ACTIVE" },
          select: { id: true },
        });
        if (backupExists) {
          await tx.roasterOrgRequest.create({
            data: {
              applicationId: application.id,
              roasterId: backupRoasterId,
              status: "PENDING",
              priority: 2,
            },
          });
        }
      }
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "An application with this email address or storefront URL has already been submitted.",
        code: "DUPLICATE",
      };
    }
    throw e;
  }

  console.log("Org application created", { application_id: applicationId });

  try {
    await sendEmail({
      template: "org-application-received",
      subject: ORG_APPLICATION_RECEIVED_SUBJECT,
      to: email,
      entityType: "org_application",
      entityId: applicationId,
      react: createElement(OrgApplicationReceivedEmail, {
        orgName,
        contactName,
      }),
    });
  } catch {
    console.error("Failed to send org application email", {
      application_id: applicationId,
    });
  }

  return { success: true, applicationId };
}
