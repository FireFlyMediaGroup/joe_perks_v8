import { keys as database } from "@joe-perks/db/keys";
import { keys as email } from "@joe-perks/email/keys";
import { keys as stripe } from "@joe-perks/stripe/keys";
import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/keys";
import { keys as collaboration } from "@repo/collaboration/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as notifications } from "@repo/notifications/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as security } from "@repo/security/keys";
import { keys as webhooks } from "@repo/webhooks/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    security(),
    webhooks(),
    stripe(),
  ],
  server: {
    ROASTER_APP_ORIGIN: z.string().url().optional(),
  },
  client: {},
  runtimeEnv: {
    ROASTER_APP_ORIGIN: process.env.ROASTER_APP_ORIGIN,
  },
});
