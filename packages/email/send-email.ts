import { database } from "@joe-perks/db/database";
import { Prisma } from "@joe-perks/db/generated/client";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { keys } from "./keys";

export interface SendEmailInput {
  entityId: string;
  entityType: string;
  react: ReactElement;
  replyTo?: string;
  subject: string;
  /** Dedupe key with `entityType` + `entityId` — see `EmailLog` unique constraint. */
  template: string;
  to: string;
}

function requireDbUrl(): void {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for sendEmail (EmailLog deduplication). Set it in root `.env` or `packages/db/.env`."
    );
  }
}

/**
 * Joe Perks transactional send path: Resend + `EmailLog` dedupe on
 * `(entityType, entityId, template)`.
 *
 * Reserves a log row before sending; on unique conflict, returns without sending (idempotent).
 * If the send fails, the log row is removed so callers may retry.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { RESEND_TOKEN, RESEND_FROM } = keys();
  if (!(RESEND_TOKEN && RESEND_FROM)) {
    throw new Error(
      "Email is not configured: set RESEND_TOKEN and RESEND_FROM in the environment."
    );
  }

  requireDbUrl();

  const resend = new Resend(RESEND_TOKEN);

  let logId: string;
  try {
    const row = await database.emailLog.create({
      data: {
        to: input.to,
        template: input.template,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
    logId = row.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return;
    }
    throw e;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo,
      react: input.react,
    });

    if (error) {
      throw new Error(error.message);
    }

    const providerId = data?.id;
    if (!providerId) {
      throw new Error("Resend did not return a message id.");
    }

    await database.emailLog.update({
      where: { id: logId },
      data: { providerId },
    });
  } catch (e) {
    try {
      await database.emailLog.delete({ where: { id: logId } });
    } catch {
      /* ignore if row already removed */
    }
    throw e;
  }
}
