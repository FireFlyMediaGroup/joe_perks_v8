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

if (process.env.NODE_ENV === "production") {
  const redirects: NextConfig["redirects"] = async () => [
    {
      source: "/blog",
      destination: "/contact",
      permanent: true,
    },
    {
      source: "/blog/:slug",
      destination: "/contact",
      permanent: true,
    },
    {
      source: "/legal",
      destination: "/privacy-policy",
      permanent: true,
    },
    {
      source: "/legal/privacy",
      destination: "/privacy-policy",
      permanent: true,
    },
    {
      source: "/legal/terms",
      destination: "/terms/orgs",
      permanent: true,
    },
    {
      source: "/legal/:slug",
      destination: "/privacy-policy",
      permanent: true,
    },
  ];

  nextConfig.redirects = redirects;
}

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
};

export default nextConfig;
