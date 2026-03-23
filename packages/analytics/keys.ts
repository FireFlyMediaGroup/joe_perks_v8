import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

const optionalPrefixed = (prefix: string) =>
  z.preprocess(
    emptyToUndefined,
    z.string().startsWith(prefix).optional()
  );

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional()
);

export const keys = () =>
  createEnv({
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: optionalPrefixed("phc_"),
      NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalPrefixed("G-"),
    },
    runtimeEnv: {
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  });
