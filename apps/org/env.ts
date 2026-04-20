import "./load-root-env";

import { keys as database } from "@joe-perks/db/keys";
import { keys as stripe } from "@joe-perks/stripe/keys";
import { keys as auth } from "@repo/auth/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as security } from "@repo/security/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  extends: [auth(), core(), database(), observability(), security(), stripe()],
  server: {
    ORG_APP_ORIGIN: z.string().url().optional(),
  },
  client: {},
  runtimeEnv: {
    ORG_APP_ORIGIN: process.env.ORG_APP_ORIGIN,
  },
});
