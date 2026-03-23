import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

export const keys = () =>
  createEnv({
    server: {
      SVIX_TOKEN: z.preprocess(
        emptyToUndefined,
        z
          .union([
            z.string().startsWith("sk_"),
            z.string().startsWith("testsk_"),
          ])
          .optional()
      ),
    },
    runtimeEnv: {
      SVIX_TOKEN: process.env.SVIX_TOKEN,
    },
  });
