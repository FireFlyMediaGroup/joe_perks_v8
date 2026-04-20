import "./load-root-env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";

const monorepoRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);

let nextConfig: NextConfig = {
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
  ],
  turbopack: {
    root: monorepoRoot,
  },
};

if (process.env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

export default nextConfig;
