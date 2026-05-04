"use server";

import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  ROASTER_REJECTED_SUBJECT,
  RoasterRejectedEmail,
} from "@joe-perks/email/templates/roaster-rejected";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import { requirePlatformAdmin } from "../../../_lib/require-platform-admin";

export type RejectApplicationResult =
  | { success: true }
  | { success: false; error: string; code: string };

export async function rejectApplication(
  applicationId: string
): Promise<RejectApplicationResult> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return {
      success: false,
      error: "You are not authorized to reject roaster applications.",
      code: "UNAUTHORIZED",
    };
  }

  if (!applicationId) {
    return {
      success: false,
      error: "Missing application id.",
      code: "VALIDATION_ERROR",
    };
  }

  let payload: { businessName: string; applicantEmail: string };

  try {
    payload = await database.$transaction(async (tx) => {
      const application = await tx.roasterApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error("NOT_FOUND");
      }
      if (application.status !== "PENDING_REVIEW") {
        throw new Error("INVALID_STATE");
      }

      await tx.roasterApplication.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });

      return {
        businessName: application.businessName,
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
          error: "This application is no longer pending review.",
          code: "INVALID_STATE",
        };
      }
    }
    throw e;
  }

  console.log("Roaster application rejected", {
    application_id: applicationId,
  });

  try {
    await sendEmail({
      template: "roaster-rejected",
      subject: ROASTER_REJECTED_SUBJECT,
      to: payload.applicantEmail,
      entityType: "roaster_application",
      entityId: applicationId,
      react: createElement(RoasterRejectedEmail, {
        businessName: payload.businessName,
      }),
    });
  } catch {
    console.error("Failed to send rejection email", {
      application_id: applicationId,
    });
  }

  revalidatePath("/approvals/roasters");
  revalidatePath(`/approvals/roasters/${applicationId}`);

  return { success: true };
}
