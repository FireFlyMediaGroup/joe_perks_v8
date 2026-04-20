import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

/** Shared Stripe env validation for apps that extend `createEnv` (web, roaster, etc.). */
export const keys = () =>
  createEnv({
    server: {
      STRIPE_SECRET_KEY: z.preprocess(
        emptyToUndefined,
        z.string().startsWith("sk_").optional()
      ),
      STRIPE_WEBHOOK_SECRET: z.preprocess(
        emptyToUndefined,
        z.string().startsWith("whsec_").optional()
      ),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
  });
