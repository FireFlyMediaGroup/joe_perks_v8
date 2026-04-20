"use server";

import { database, generatePendingClerkExternalAuthId } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ROASTER_APPROVED_SUBJECT,
  RoasterApprovedEmail,
} from "@joe-perks/email/templates/roaster-approved";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import { getRoasterPortalSignInUrl } from "../_lib/roaster-portal-sign-in-url";

export type ApproveApplicationResult =
  | { success: true }
  | { success: false; error: string; code: string };

export async function approveApplication(
  applicationId: string
): Promise<ApproveApplicationResult> {
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

      const existingRoaster = await tx.roaster.findUnique({
        where: { applicationId: application.id },
      });
      if (existingRoaster) {
        throw new Error("ALREADY_PROCESSED");
      }

      await tx.roasterApplication.update({
        where: { id: application.id },
        data: { status: "APPROVED" },
      });

      const roaster = await tx.roaster.create({
        data: {
          applicationId: application.id,
          status: "ONBOARDING",
          email: application.email,
          stripeOnboarding: "NOT_STARTED",
          fulfillerType: "ROASTER",
        },
      });

      await tx.user.create({
        data: {
          externalAuthId: generatePendingClerkExternalAuthId(),
          email: application.email,
          role: "ROASTER_ADMIN",
          roasterId: roaster.id,
        },
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
      if (e.message === "ALREADY_PROCESSED") {
        return {
          success: false,
          error: "This application has already been processed.",
          code: "ALREADY_PROCESSED",
        };
      }
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error: "Could not create records (duplicate email or conflict).",
        code: "CONFLICT",
      };
    }
    throw e;
  }

  console.log("Roaster application approved", {
    application_id: applicationId,
  });

  try {
    await sendEmail({
      template: "roaster-approved",
      subject: ROASTER_APPROVED_SUBJECT,
      to: payload.applicantEmail,
      entityType: "roaster_application",
      entityId: applicationId,
      react: createElement(RoasterApprovedEmail, {
        businessName: payload.businessName,
        loginUrl: getRoasterPortalSignInUrl(),
      }),
    });
  } catch {
    console.error("Failed to send approval email", {
      application_id: applicationId,
    });
  }

  revalidatePath("/approvals/roasters");
  revalidatePath(`/approvals/roasters/${applicationId}`);

  return { success: true };
}
