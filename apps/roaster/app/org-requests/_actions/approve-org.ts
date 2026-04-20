"use server";

import { database, generatePendingClerkExternalAuthId } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ORG_APPROVED_SUBJECT,
  OrgApprovedEmail,
} from "@joe-perks/email/templates/org-approved";
import { createElement } from "react";

import { getOrgPortalSignInUrl } from "../_lib/org-portal-sign-in-url";
import { parseRoasterReviewPayload } from "../_lib/roaster-review-payload";

export type ApproveOrgResult =
  | { success: true }
  | { success: false; error: string; code: string };

export async function approveOrg(token: string): Promise<ApproveOrgResult> {
  if (!token) {
    return {
      success: false,
      error: "Missing review link.",
      code: "VALIDATION_ERROR",
    };
  }

  let emailPayload: {
    applicationId: string;
    orgName: string;
    contactName: string;
    to: string;
  };

  try {
    emailPayload = await database.$transaction(async (tx) => {
      const link = await tx.magicLink.findFirst({
        where: {
          token,
          purpose: "ROASTER_REVIEW",
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!link) {
        throw new Error("INVALID_TOKEN");
      }

      const payload = parseRoasterReviewPayload(link.payload);
      if (!payload) {
        throw new Error("INVALID_PAYLOAD");
      }

      if (link.actorType !== "ROASTER" || link.actorId !== payload.roasterId) {
        throw new Error("INVALID_ACTOR");
      }

      const mark = await tx.magicLink.updateMany({
        where: { id: link.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (mark.count !== 1) {
        throw new Error("RACE");
      }

      const application = await tx.orgApplication.findUnique({
        where: { id: payload.applicationId },
      });
      if (!application) {
        throw new Error("NOT_FOUND");
      }
      if (application.status !== "PENDING_ROASTER_APPROVAL") {
        throw new Error("INVALID_STATE");
      }

      const request = await tx.roasterOrgRequest.findUnique({
        where: {
          applicationId_roasterId: {
            applicationId: application.id,
            roasterId: payload.roasterId,
          },
        },
      });
      if (!request || request.status !== "PENDING") {
        throw new Error("INVALID_REQUEST");
      }

      const existingOrg = await tx.org.findUnique({
        where: { applicationId: application.id },
      });
      if (existingOrg) {
        throw new Error("ALREADY_PROCESSED");
      }

      await tx.roasterOrgRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" },
      });

      await tx.roasterOrgRequest.updateMany({
        where: {
          applicationId: application.id,
          id: { not: request.id },
          status: "PENDING",
        },
        data: { status: "DECLINED" },
      });

      await tx.orgApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED" },
      });

      const org = await tx.org.create({
        data: {
          applicationId: application.id,
          status: "ONBOARDING",
          email: application.email,
          slug: application.desiredSlug,
          stripeOnboarding: "NOT_STARTED",
        },
      });

      await tx.user.create({
        data: {
          externalAuthId: generatePendingClerkExternalAuthId(),
          email: application.email,
          role: "ORG_ADMIN",
          orgId: org.id,
        },
      });

      return {
        applicationId: application.id,
        orgName: application.orgName,
        contactName: application.contactName,
        to: application.email,
      };
    });
  } catch (e) {
    if (e instanceof Error) {
      const map: Record<string, { error: string; code: string }> = {
        INVALID_TOKEN: {
          error: "This review link is invalid or has expired.",
          code: "INVALID_TOKEN",
        },
        INVALID_PAYLOAD: {
          error: "This review link is corrupted.",
          code: "INVALID_PAYLOAD",
        },
        INVALID_ACTOR: {
          error: "This review link is invalid.",
          code: "INVALID_ACTOR",
        },
        RACE: {
          error: "This link was already used.",
          code: "ALREADY_USED",
        },
        NOT_FOUND: {
          error: "Application not found.",
          code: "NOT_FOUND",
        },
        INVALID_STATE: {
          error: "This application is no longer awaiting roaster review.",
          code: "INVALID_STATE",
        },
        INVALID_REQUEST: {
          error: "This partnership request is no longer pending.",
          code: "INVALID_REQUEST",
        },
        ALREADY_PROCESSED: {
          error: "This application has already been processed.",
          code: "ALREADY_PROCESSED",
        },
      };
      const mapped = map[e.message];
      if (mapped) {
        return { success: false, ...mapped };
      }
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error: "Could not create organization (duplicate slug or email).",
        code: "CONFLICT",
      };
    }
    throw e;
  }

  const loginUrl = getOrgPortalSignInUrl();

  console.log("Org application approved by roaster", {
    application_id: emailPayload.applicationId,
  });

  try {
    await sendEmail({
      template: "org-approved",
      subject: ORG_APPROVED_SUBJECT,
      to: emailPayload.to,
      entityType: "org_application",
      entityId: emailPayload.applicationId,
      react: createElement(OrgApprovedEmail, {
        orgName: emailPayload.orgName,
        contactName: emailPayload.contactName,
        loginUrl,
      }),
    });
  } catch {
    console.error("Failed to send org approved email", {
      application_id: emailPayload.applicationId,
    });
  }

  return { success: true };
}
