import { createRouteHandler } from "uploadthing/next";

import { roasterFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: roasterFileRouter,
});
