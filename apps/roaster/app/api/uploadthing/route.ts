import { createRouteHandler } from "uploadthing/next";

import { env } from "@/env";

import { roasterFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: roasterFileRouter,
  ...(env.UPLOADTHING_TOKEN
    ? { config: { token: env.UPLOADTHING_TOKEN } }
    : {}),
});
