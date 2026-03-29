import { authMiddleware } from "@repo/auth/proxy";
import { noseconeOptions, securityMiddleware } from "@repo/security/proxy";
import type { NextProxy } from "next/server";

const securityHeaders = securityMiddleware(noseconeOptions);

export default authMiddleware(() => securityHeaders()) as unknown as NextProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
