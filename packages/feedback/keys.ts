import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

/**
 * Featurebase (user feedback / bug reports / feature requests / changelog).
 *
 * - `NEXT_PUBLIC_FEATUREBASE_ORG`: your Featurebase organization subdomain
 *   (the `xxxx` in `xxxx.featurebase.app`). Public — used by the in-app widget.
 * - `FEATUREBASE_SSO_SECRET`: server-only secret used to sign the identity JWT so
 *   logged-in portal users are seamlessly identified (no second sign-in). Optional —
 *   without it the widget still works anonymously / via client-side identify.
 * - `FEATUREBASE_API_KEY`: server-only key for the Featurebase REST API (e.g. to
 *   create posts from server actions). Optional.
 */
export const keys = () =>
  createEnv({
    server: {
      FEATUREBASE_SSO_SECRET: z.preprocess(
        emptyToUndefined,
        z.string().optional()
      ),
      FEATUREBASE_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
    },
    client: {
      NEXT_PUBLIC_FEATUREBASE_ORG: z.preprocess(
        emptyToUndefined,
        z.string().optional()
      ),
    },
    runtimeEnv: {
      FEATUREBASE_SSO_SECRET: process.env.FEATUREBASE_SSO_SECRET,
      FEATUREBASE_API_KEY: process.env.FEATUREBASE_API_KEY,
      NEXT_PUBLIC_FEATUREBASE_ORG: process.env.NEXT_PUBLIC_FEATUREBASE_ORG,
    },
  });
