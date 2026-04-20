"use server";

import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  ORG_REJECTED_SUBJECT,
  OrgRejectedEmail,
} from "@joe-perks/email/templates/org-rejected";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

export type RejectOrgApplicationResult =
  | { success: true }
  | { success: false; error: string; code: string };

export async function rejectOrgApplication(
  applicationId: string
): Promise<RejectOrgApplicationResult> {
  if (!applicationId) {
    return {
      success: false,
      error: "Missing application id.",
      code: "VALIDATION_ERROR",
    };
  }

  let payload: { orgName: string; contactName: string; applicantEmail: string };

  try {
    payload = await database.$transaction(async (tx) => {
      const application = await tx.orgApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error("NOT_FOUND");
      }
      if (application.status !== "PENDING_PLATFORM_REVIEW") {
        throw new Error("INVALID_STATE");
      }

      await tx.orgApplication.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });

      return {
        orgName: application.orgName,
        contactName: application.contactName,
        applicantEmail: application.email,
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
    }
    throw e;
  }

  console.log("Org application rejected by platform", {
    application_id: applicationId,
  });

  try {
    await sendEmail({
      template: "org-rejected",
      subject: ORG_REJECTED_SUBJECT,
      to: payload.applicantEmail,
      entityType: "org_application",
      entityId: applicationId,
      react: createElement(OrgRejectedEmail, {
        orgName: payload.orgName,
        contactName: payload.contactName,
      }),
    });
  } catch {
    console.error("Failed to send org rejection email", {
      application_id: applicationId,
    });
  }

  revalidatePath("/approvals/orgs");
  revalidatePath(`/approvals/orgs/${applicationId}`);

  return { success: true };
}
