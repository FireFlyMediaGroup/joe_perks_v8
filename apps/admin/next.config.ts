import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";

const monorepoRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);

let nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
};

if (process.env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

export default nextConfig;
