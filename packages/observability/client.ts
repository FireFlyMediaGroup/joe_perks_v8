/*
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 *
 * Sentry is loaded with dynamic `import()` (no static `@sentry/nextjs` import) so:
 * - Local dev without NEXT_PUBLIC_SENTRY_DSN does not pull the SDK into the graph.
 * - Turbopack HMR is less likely to hit "module factory is not available" for stale Sentry chunks.
 */

import { keys } from "./keys";

type SentryModule = typeof import("@sentry/nextjs");

let sentry: SentryModule | null | undefined;
let loadPromise: Promise<void> | undefined;

export function initializeSentry(): void {
  const dsn = keys().NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    sentry = null;
    return;
  }

  loadPromise = import("@sentry/nextjs")
    .then((Sentry) => {
      sentry = Sentry;
      Sentry.init({
        dsn,

        // Enable logging
        enableLogs: true,

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: 1,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        replaysOnErrorSampleRate: 1,

        /*
         * This sets the sample rate to be 10%. You may want this to be 100% while
         * in development and sample at a lower rate in production
         */
        replaysSessionSampleRate: 0.1,

        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
          Sentry.consoleLoggingIntegration({
            levels: ["log", "error", "warn"],
          }),
        ],
      });
    })
    .catch((error: unknown) => {
      // Uncaught rejections here break client bootstrap (e.g. Clerk sign-in never mounts) when
      // Turbopack HMR leaves the Sentry chunk in a bad state. Degrade gracefully.
      sentry = null;
      console.warn(
        "[@repo/observability] Sentry client failed to load; continuing without Sentry.",
        error
      );
    });
}

export function onRouterTransitionStart(
  href: string,
  navigationType: string
): void {
  if (sentry === null) {
    return;
  }
  if (sentry) {
    sentry.captureRouterTransitionStart(href, navigationType);
    return;
  }
  loadPromise
    ?.then(() => {
      sentry?.captureRouterTransitionStart(href, navigationType);
    })
    .catch(() => {
      /* ignore: best-effort router hook if Sentry failed to load */
    });
}
