import type { ReactElement } from "react";

export type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

/**
 * Joe Perks transactional send path.
 * TODO: implement with Resend + `EmailLog` dedup `(entity_id, template)` per AGENTS.md.
 */
export async function sendEmail(_input: SendEmailInput): Promise<void> {
  throw new Error(
    "sendEmail() not implemented — add EmailLog dedup when Joe Perks schema is migrated."
  );
}
