"use server";

import { randomBytes } from "node:crypto";

import { database } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ORG_DECLINED_SUBJECT,
  OrgDeclinedEmail,
} from "@joe-perks/email/templates/org-declined";
import {
  ORG_ROASTER_REVIEW_SUBJECT,
  OrgRoasterReviewEmail,
} from "@joe-perks/email/templates/org-roaster-review";
import { createElement } from "react";

import { getRoasterOrgReviewUrl } from "../_lib/roaster-org-review-url";
import { parseRoasterReviewPayload } from "../_lib/roaster-review-payload";

export type DeclineOrgResult =
  | { success: true; routedToBackup: boolean }
  | { success: false; error: string; code: string };

export async function declineOrg(token: string): Promise<DeclineOrgResult> {
  if (!token) {
    return {
      success: false,
      error: "Missing review link.",
      code: "VALIDATION_ERROR",
    };
  }

  type AfterTx =
    | {
        kind: "backup";
        applicationId: string;
        backupRequestId: string;
        roasterEmail: string;
        roasterBusinessName: string;
        orgName: string;
        contactName: string;
        description: string | null;
        token: string;
      }
    | {
        kind: "final";
        applicationId: string;
        orgName: string;
        contactName: string;
        to: string;
      };

  let after: AfterTx;

  try {
    after = await database.$transaction(async (tx) => {
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

      await tx.roasterOrgRequest.update({
        where: { id: request.id },
        data: { status: "DECLINED" },
      });

      const backup = await tx.roasterOrgRequest.findFirst({
        where: {
          applicationId: application.id,
          priority: 2,
          status: "PENDING",
        },
        include: {
          roaster: {
            include: {
              application: { select: { businessName: true } },
            },
          },
        },
      });

      if (backup) {
        const newToken = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

        await tx.magicLink.create({
          data: {
            token: newToken,
            purpose: "ROASTER_REVIEW",
            actorId: backup.roasterId,
            actorType: "ROASTER",
            payload: {
              applicationId: application.id,
              roasterId: backup.roasterId,
              orgName: application.orgName,
            } satisfies Record<string, string>,
            expiresAt,
          },
        });

        return {
          kind: "backup" as const,
          applicationId: application.id,
          backupRequestId: backup.id,
          roasterEmail: backup.roaster.email,
          roasterBusinessName: backup.roaster.application.businessName,
          orgName: application.orgName,
          contactName: application.contactName,
          description: application.description ?? null,
          token: newToken,
        };
      }

      await tx.orgApplication.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });

      return {
        kind: "final" as const,
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
        error: "Could not record decision (duplicate).",
        code: "CONFLICT",
      };
    }
    throw e;
  }

  if (after.kind === "backup") {
    const reviewUrl = getRoasterOrgReviewUrl(after.token);

    console.log("Org application routed to backup roaster", {
      application_id: after.applicationId,
      backup_request_id: after.backupRequestId,
    });

    try {
      await sendEmail({
        template: "org-roaster-review",
        subject: ORG_ROASTER_REVIEW_SUBJECT,
        to: after.roasterEmail,
        entityType: "org_application",
        entityId: after.backupRequestId,
        react: createElement(OrgRoasterReviewEmail, {
          roasterBusinessName: after.roasterBusinessName,
          orgName: after.orgName,
          contactName: after.contactName,
          description: after.description,
          reviewUrl,
        }),
      });
    } catch {
      console.error("Failed to send backup roaster review email", {
        application_id: after.applicationId,
        backup_request_id: after.backupRequestId,
      });
    }

    return { success: true, routedToBackup: true };
  }

  console.log("Org application declined (no backup)", {
    application_id: after.applicationId,
  });

  try {
    await sendEmail({
      template: "org-declined",
      subject: ORG_DECLINED_SUBJECT,
      to: after.to,
      entityType: "org_application",
      entityId: after.applicationId,
      react: createElement(OrgDeclinedEmail, {
        orgName: after.orgName,
        contactName: after.contactName,
      }),
    });
  } catch {
    console.error("Failed to send org declined email", {
      application_id: after.applicationId,
    });
  }

  return { success: true, routedToBackup: false };
}
