"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { ReactNode } from "react";

interface PostHogProviderProps {
  readonly children: ReactNode;
}

export const PostHogProvider = ({ children }: PostHogProviderProps) => (
  <PHProvider client={posthog}>{children}</PHProvider>
);
