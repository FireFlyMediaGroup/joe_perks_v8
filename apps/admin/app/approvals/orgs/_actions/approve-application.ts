"use server";

import { randomBytes } from "node:crypto";

import { database } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ORG_ROASTER_REVIEW_SUBJECT,
  OrgRoasterReviewEmail,
} from "@joe-perks/email/templates/org-roaster-review";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import { getRoasterOrgReviewUrl } from "../_lib/roaster-org-review-url";

export type ApproveOrgApplicationResult =
  | { success: true }
  | { success: false; error: string; code: string };

export async function approveOrgApplication(
  applicationId: string
): Promise<ApproveOrgApplicationResult> {
  if (!applicationId) {
    return {
      success: false,
      error: "Missing application id.",
      code: "VALIDATION_ERROR",
    };
  }

  let result: {
    magicLinkId: string;
    roasterEmail: string;
    roasterBusinessName: string;
    orgName: string;
    contactName: string;
    description: string | null;
    token: string;
  };

  try {
    result = await database.$transaction(async (tx) => {
      const application = await tx.orgApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error("NOT_FOUND");
      }
      if (application.status !== "PENDING_PLATFORM_REVIEW") {
        throw new Error("INVALID_STATE");
      }

      const primary = await tx.roasterOrgRequest.findFirst({
        where: { applicationId: application.id, priority: 1 },
        include: {
          roaster: {
            include: {
              application: { select: { businessName: true } },
            },
          },
        },
      });

      if (!primary) {
        throw new Error("NO_PRIMARY_ROASTER");
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await tx.orgApplication.update({
        where: { id: application.id },
        data: { status: "PENDING_ROASTER_APPROVAL" },
      });

      await tx.roasterOrgRequest.update({
        where: { id: primary.id },
        data: { status: "PENDING" },
      });

      const magicLink = await tx.magicLink.create({
        data: {
          token,
          purpose: "ROASTER_REVIEW",
          actorId: primary.roasterId,
          actorType: "ROASTER",
          payload: {
            applicationId: application.id,
            roasterId: primary.roasterId,
            orgName: application.orgName,
          } satisfies Record<string, string>,
          expiresAt,
        },
      });

      return {
        magicLinkId: magicLink.id,
        token,
        roasterEmail: primary.roaster.email,
        roasterBusinessName: primary.roaster.application.businessName,
        orgName: application.orgName,
        contactName: application.contactName,
        description: application.description ?? null,
      };
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Application not found.",
          code: "NOT_FOUND",
        };
      }
      if (e.message === "INVALID_STATE") {
        return {
          success: false,
          error: "This application is no longer pending platform review.",
          code: "INVALID_STATE",
        };
      }
      if (e.message === "NO_PRIMARY_ROASTER") {
        return {
          success: false,
          error: "No primary roaster is linked to this application.",
          code: "NO_PRIMARY_ROASTER",
        };
      }
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error: "Could not create review link (duplicate).",
        code: "CONFLICT",
      };
    }
    throw e;
  }

  console.log("Org application approved for roaster review", {
    application_id: applicationId,
    magic_link_id: result.magicLinkId,
  });

  const reviewUrl = getRoasterOrgReviewUrl(result.token);

  try {
    await sendEmail({
      template: "org-roaster-review",
      subject: ORG_ROASTER_REVIEW_SUBJECT,
      to: result.roasterEmail,
      entityType: "org_application",
      entityId: applicationId,
      react: createElement(OrgRoasterReviewEmail, {
        roasterBusinessName: result.roasterBusinessName,
        orgName: result.orgName,
        contactName: result.contactName,
        description: result.description,
        reviewUrl,
      }),
    });
  } catch {
    console.error("Failed to send org roaster review email", {
      application_id: applicationId,
      magic_link_id: result.magicLinkId,
    });
  }

  revalidatePath("/approvals/orgs");
  revalidatePath(`/approvals/orgs/${applicationId}`);

  return { success: true };
}
