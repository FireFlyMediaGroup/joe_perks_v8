import { keys as database } from "@joe-perks/db/keys";
import { keys as email } from "@joe-perks/email/keys";
import { keys as stripe } from "@joe-perks/stripe/keys";
import { keys as cms } from "@repo/cms/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as rateLimit } from "@repo/rate-limit/keys";
import { keys as security } from "@repo/security/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

export const env = createEnv({
  extends: [
    cms(),
    core(),
    database(),
    email(),
    observability(),
    flags(),
    security(),
    rateLimit(),
    stripe(),
  ],
  server: {
    SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(32)),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.preprocess(
      emptyToUndefined,
      z.string().startsWith("pk_").optional()
    ),
  },
  runtimeEnv: {
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});
