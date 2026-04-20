import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

export const keys = () =>
  createEnv({
    server: {
      DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
