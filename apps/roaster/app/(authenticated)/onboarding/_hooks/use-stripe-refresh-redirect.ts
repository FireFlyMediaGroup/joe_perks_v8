"use client";

import { useEffect, useState } from "react";

import { fetchStripeConnectUrl } from "../_lib/fetch-stripe-connect-url";

/**
 * When `stripeRefresh` is true (expired Account Link), POST connect and redirect.
 */
export function useStripeRefreshRedirect(stripeRefresh: boolean): {
  refreshError: string | null;
  refreshRedirecting: boolean;
} {
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshRedirecting, setRefreshRedirecting] = useState(stripeRefresh);

  useEffect(() => {
    if (!stripeRefresh) {
      return;
    }

    let cancelled = false;

    async function run() {
      setRefreshError(null);
      setRefreshRedirecting(true);
      try {
        const url = await fetchStripeConnectUrl();
        if (!cancelled) {
          window.location.href = url;
        }
      } catch (caught) {
        if (!cancelled) {
          setRefreshRedirecting(false);
          setRefreshError(
            caught instanceof Error ? caught.message : "Something went wrong"
          );
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [stripeRefresh]);

  return { refreshError, refreshRedirecting };
}
