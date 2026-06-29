import { defaults, type Options, withVercelToolbar } from "@nosecone/next";

export { createMiddleware as securityMiddleware } from "@nosecone/next";

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: Options = {
  ...defaults,
  // Content Security Policy (CSP) is disabled by default because the values
  // depend on which Next Forge features are enabled. See
  // https://www.next-forge.com/packages/security/headers for guidance on how
  // to configure it.
  contentSecurityPolicy: false,
  // Default COEP (`require-corp`) blocks cross-origin assets without CORP
  // headers — breaks UploadThing product images (utfs.io / *.ufs.sh), Clerk
  // avatars, and other third-party embeds. Joe Perks does not rely on
  // cross-origin isolation (SharedArrayBuffer).
  crossOriginEmbedderPolicy: false,
};

export const noseconeOptionsWithToolbar: Options =
  withVercelToolbar(noseconeOptions);
