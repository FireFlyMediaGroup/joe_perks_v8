import { type ApiData, verifyAccess } from "flags";
// biome-ignore lint/performance/noNamespaceImport: flags SDK convention
import * as flags from "./index";

export const getFlags = async (request: Request): Promise<Response> => {
  const access = await verifyAccess(request.headers.get("Authorization"));

  if (!access) {
    return Response.json(null, { status: 401 });
  }

  const definitions = Object.fromEntries(
    Object.values(flags).map((flag) => [
      flag.key,
      {
        origin: flag.origin,
        description: flag.description,
        options: flag.options,
      },
    ])
  );

  return Response.json({
    definitions,
  } satisfies ApiData);
};
