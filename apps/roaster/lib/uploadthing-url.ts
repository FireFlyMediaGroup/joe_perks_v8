/** Client upload response shape varies by UploadThing version and callback data. */
export type UploadThingClientFile = {
  appUrl?: string | null;
  serverData?: unknown;
  ufsUrl?: string | null;
  url?: string | null;
};

function readUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Resolve the HTTPS URL to store on `Product.imageUrl` after an UploadThing upload. */
export function extractUploadedImageUrl(
  file: UploadThingClientFile | undefined
): string | undefined {
  if (!file) {
    return;
  }

  const direct =
    readUrl(file.ufsUrl) ?? readUrl(file.url) ?? readUrl(file.appUrl);
  if (direct) {
    return direct;
  }

  if (file.serverData && typeof file.serverData === "object") {
    const serverData = file.serverData as { url?: unknown };
    return readUrl(serverData.url);
  }

  return;
}
