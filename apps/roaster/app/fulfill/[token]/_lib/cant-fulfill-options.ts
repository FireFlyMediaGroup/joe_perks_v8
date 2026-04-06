export const CANT_FULFILL_REASONS = [
  "Inventory shortage",
  "Roast delay",
  "Package or stock damage",
  "Address issue",
  "Other",
] as const;

export const CANT_FULFILL_RESOLUTION_OFFERS = [
  "Please help confirm a new ship date",
  "Please coordinate a replacement if possible",
  "Please review for refund or cancellation",
  "Please hold this order for manual follow-up",
] as const;

export type CantFulfillReason = (typeof CANT_FULFILL_REASONS)[number];
export type CantFulfillResolutionOffer =
  (typeof CANT_FULFILL_RESOLUTION_OFFERS)[number];

export function isCantFulfillReason(
  value: string
): value is CantFulfillReason {
  return CANT_FULFILL_REASONS.includes(value as CantFulfillReason);
}

export function isCantFulfillResolutionOffer(
  value: string
): value is CantFulfillResolutionOffer {
  return CANT_FULFILL_RESOLUTION_OFFERS.includes(
    value as CantFulfillResolutionOffer
  );
}
