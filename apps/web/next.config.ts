import "./load-root-env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withCMS } from "@repo/cms/next-config";
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

nextConfig.images?.remotePatterns?.push({
  protocol: "https",
  hostname: "assets.basehub.com",
});

if (process.env.NODE_ENV === "production") {
  const redirects: NextConfig["redirects"] = async () => [
    {
      source: "/legal",
      destination: "/legal/privacy",
      statusCode: 301,
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
  turbopack: { ...nextConfig.turbopack, root: monorepoRoot },
};

export default withCMS(nextConfig);
