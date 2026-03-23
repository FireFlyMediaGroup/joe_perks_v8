import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional()
);

export const keys = () =>
  createEnv({
    server: {
      UPSTASH_REDIS_REST_URL: optionalUrl,
      UPSTASH_REDIS_REST_TOKEN: z.preprocess(
        emptyToUndefined,
        z.string().optional()
      ),
    },
    runtimeEnv: {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  });
