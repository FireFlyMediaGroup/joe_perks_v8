import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

export const keys = () =>
  createEnv({
    server: {
      RESEND_FROM: z.preprocess(
        emptyToUndefined,
        z.string().email().optional()
      ),
      RESEND_TOKEN: z.preprocess(
        emptyToUndefined,
        z.string().startsWith("re_").optional()
      ),
    },
    runtimeEnv: {
      RESEND_FROM: process.env.RESEND_FROM,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
    },
  });
