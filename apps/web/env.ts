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
  server: {},
  client: {},
  runtimeEnv: {},
});
