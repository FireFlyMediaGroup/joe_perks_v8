"use server";

import { sendEmail } from "@joe-perks/email/send";
import { ContactTemplate } from "@joe-perks/email/templates/contact";
import { randomUUID } from "node:crypto";
import { parseError } from "@repo/observability/error";
import { createRateLimiter, slidingWindow } from "@repo/rate-limit";
import { headers } from "next/headers";
import { env } from "@/env";

export const contact = async (
  name: string,
  email: string,
  message: string
): Promise<{
  error?: string;
}> => {
  try {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      const rateLimiter = createRateLimiter({
        limiter: slidingWindow(1, "1d"),
      });
      const head = await headers();
      const ip = head.get("x-forwarded-for");

      const { success } = await rateLimiter.limit(`contact_form_${ip}`);

      if (!success) {
        throw new Error(
          "You have reached your request limit. Please try again later."
        );
      }
    }

    if (!(env.RESEND_FROM && env.RESEND_TOKEN)) {
      throw new Error("Email is not configured.");
    }

    await sendEmail({
      to: env.RESEND_FROM,
      subject: "Contact form submission",
      replyTo: email,
      react: <ContactTemplate email={email} message={message} name={name} />,
      template: "contact",
      entityType: "contact_form",
      entityId: randomUUID(),
    });

    return {};
  } catch (error) {
    const errorMessage = parseError(error);

    return { error: errorMessage };
  }
};
