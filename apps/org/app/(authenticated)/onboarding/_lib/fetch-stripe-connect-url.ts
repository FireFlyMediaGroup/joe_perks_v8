/**
 * POST /api/stripe/connect — returns Stripe-hosted Account Link URL.
 */
export async function fetchStripeConnectUrl(): Promise<string> {
  const response = await fetch("/api/stripe/connect", { method: "POST" });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to connect to Stripe");
  }
  if (!data.url) {
    throw new Error("No redirect URL from Stripe");
  }
  return data.url;
}
