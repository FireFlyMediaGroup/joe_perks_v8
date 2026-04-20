import "./load-root-env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";

const monorepoRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);

let nextConfig: NextConfig = withLogging(config);

if (process.env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

nextConfig = {
  ...nextConfig,
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
  ],
  turbopack: { ...nextConfig.turbopack, root: monorepoRoot },
};

export default nextConfig;
