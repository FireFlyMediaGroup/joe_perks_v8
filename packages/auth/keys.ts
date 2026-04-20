import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

const optionalPrefixed = (prefix: string) =>
  z.preprocess(emptyToUndefined, z.string().startsWith(prefix).optional());

export const keys = () =>
  createEnv({
    server: {
      CLERK_SECRET_KEY: optionalPrefixed("sk_"),
      CLERK_WEBHOOK_SECRET: optionalPrefixed("whsec_"),
    },
    client: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalPrefixed("pk_"),
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: optionalPrefixed("/"),
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: optionalPrefixed("/"),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: optionalPrefixed("/"),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: optionalPrefixed("/"),
    },
    runtimeEnv: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    },
  });
