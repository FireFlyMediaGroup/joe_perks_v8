import { Resend } from "resend";
import { keys } from "./keys";

const { RESEND_TOKEN } = keys();

/** Prefer `sendEmail` from `@joe-perks/email/send` for transactional mail (Resend + `EmailLog`). */
export const resend = RESEND_TOKEN ? new Resend(RESEND_TOKEN) : undefined;

export { sendEmail } from "./send";
export type { SendEmailInput } from "./send-email";
