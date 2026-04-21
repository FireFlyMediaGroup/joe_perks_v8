import "./load-root-env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withToolbar } from "@repo/feature-flags/lib/toolbar";
import { config, withAnalyzer } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

const monorepoRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);

let nextConfig: NextConfig = withToolbar(withLogging(config));

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

nextConfig = {
  ...nextConfig,
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
  ],
  turbopack: { ...nextConfig.turbopack, root: monorepoRoot },
  images: {
    ...nextConfig.images,
    remotePatterns: [
      ...(nextConfig.images?.remotePatterns ?? []),
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**",
      },
      {
        protocol: "https",
        hostname: "ufs.sh",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
