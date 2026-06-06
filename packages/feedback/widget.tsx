"use client";

import { useEffect } from "react";
import { keys } from "./keys";

/**
 * Identity passed to Featurebase so a submitted post is attributed to the
 * signed-in portal user. Build it from the Clerk session — see `identify.ts`.
 * When omitted, the widget runs anonymously.
 */
export interface FeedbackIdentity {
  /** Optional: the org/company this user belongs to (Roaster/Org name). */
  companyName?: string;
  email: string;
  name?: string;
  /** For SSO identity verification — a JWT signed server-side with FEATUREBASE_SSO_SECRET. */
  userHash?: string;
  /** Stable user id (e.g. Clerk user id). */
  userId: string;
}

interface FeedbackWidgetProps {
  identity?: FeedbackIdentity;
  placement?: "left" | "right";
  theme?: "light" | "dark";
}

type FeaturebaseFn = ((...args: unknown[]) => void) & { q?: unknown[] };

const SDK_SRC = "https://do.featurebase.app/js/sdk.js";
const SDK_ID = "featurebase-sdk";

/**
 * Mounts the Featurebase in-app feedback widget. Self-gating: renders nothing
 * (and loads no script) when `NEXT_PUBLIC_FEATUREBASE_ORG` is unset — mirroring the
 * env-gated pattern used by the Liveblocks/BetterStack scaffolding, so it is safe to
 * leave in the tree on any environment that hasn't been given a Featurebase org.
 *
 * NOTE: the exact `Featurebase(...)` call signatures below follow the current
 * Featurebase embed docs — confirm against https://help.featurebase.app when wiring,
 * the same way the BetterStack Logs source-token var is confirmed at setup time.
 */
export const FeedbackWidget = ({
  identity,
  theme = "light",
  placement = "right",
}: FeedbackWidgetProps) => {
  const organization = keys().NEXT_PUBLIC_FEATUREBASE_ORG;

  useEffect(() => {
    if (!organization) {
      return;
    }

    const win = window as unknown as { Featurebase?: FeaturebaseFn };

    if (typeof win.Featurebase !== "function") {
      const queue: FeaturebaseFn = ((...args: unknown[]) => {
        queue.q ??= [];
        queue.q.push(args);
      }) as FeaturebaseFn;
      win.Featurebase = queue;
    }

    const sdk = win.Featurebase;

    // Identify the signed-in user so posts are attributed to them.
    if (identity) {
      sdk("identify", {
        organization,
        email: identity.email,
        name: identity.name,
        id: identity.userId,
        userHash: identity.userHash,
        companies: identity.companyName
          ? [{ id: identity.companyName, name: identity.companyName }]
          : undefined,
      });
    }

    // The floating "Feedback" launcher (bug reports + feature requests).
    sdk("initialize_feedback_widget", {
      organization,
      theme,
      placement,
    });

    // Load the SDK once.
    if (!document.getElementById(SDK_ID)) {
      const script = document.createElement("script");
      script.id = SDK_ID;
      script.src = SDK_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [organization, identity, theme, placement]);

  return null;
};
