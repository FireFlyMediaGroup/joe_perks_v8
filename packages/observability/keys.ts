import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Empty string from .env / shell is treated as unset so z.url().optional() does not fail locally. */
const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional()
);

export const keys = () =>
  createEnv({
    server: {
      BETTERSTACK_API_KEY: z.string().optional(),
      BETTERSTACK_URL: optionalUrl,

      // Added by Sentry Integration, Vercel Marketplace
      SENTRY_ORG: z.string().optional(),
      SENTRY_PROJECT: z.string().optional(),
    },
    client: {
      // Added by Sentry Integration, Vercel Marketplace
      NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    },
    runtimeEnv: {
      BETTERSTACK_API_KEY: process.env.BETTERSTACK_API_KEY,
      BETTERSTACK_URL: process.env.BETTERSTACK_URL,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
  });
