"use server";

import { database } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { sendEmail } from "@joe-perks/email/send";
import {
  ROASTER_APPLICATION_RECEIVED_SUBJECT,
  RoasterApplicationReceivedEmail,
} from "@joe-perks/email/templates/roaster-application-received";
import { limitRoasterApplication } from "@joe-perks/stripe";
import { headers } from "next/headers";
import { createElement } from "react";
import {
  type ApplicationFormData,
  applicationSchema,
  CURRENT_TERMS_VERSION,
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

export async function submitRoasterApplication(
  data: ApplicationFormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = getIpFromHeaders(headersList);

  const { success: allowed } = await limitRoasterApplication(ip);
  if (!allowed) {
    return {
      success: false,
      error: "Too many applications submitted. Please try again later.",
      code: "RATE_LIMITED",
    };
  }

  const parsed = applicationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form data. Please check your entries and try again.",
      code: "VALIDATION_ERROR",
    };
  }

  const {
    email,
    contactName,
    phone,
    businessName,
    website,
    description,
    city,
    state,
    coffeeInfo,
  } = parsed.data;

  let applicationId: string;
  try {
    const application = await database.roasterApplication.create({
      data: {
        status: "PENDING_REVIEW",
        email,
        contactName,
        phone: phone || null,
        businessName,
        website: website || null,
        description: description || null,
        city,
        state,
        coffeeInfo: coffeeInfo || null,
        termsAgreedAt: new Date(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
      select: { id: true },
    });
    applicationId = application.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "An application with this email address has already been submitted.",
        code: "DUPLICATE_EMAIL",
      };
    }
    throw e;
  }

  console.log("Roaster application created", {
    application_id: applicationId,
  });

  try {
    await sendEmail({
      template: "roaster-application-received",
      subject: ROASTER_APPLICATION_RECEIVED_SUBJECT,
      to: email,
      entityType: "roaster_application",
      entityId: applicationId,
      react: createElement(RoasterApplicationReceivedEmail, {
        businessName,
        email,
      }),
    });
  } catch {
    console.error("Failed to send confirmation email", {
      application_id: applicationId,
    });
  }

  return { success: true, applicationId };
}
