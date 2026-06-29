/**
 * Production smoke lane — isolated tenant for pre-beta live money-path proof.
 * Distinct from local E2E seeds (`e2e-test-org`) and from real pilot rosters.
 *
 * Use plus-addressed inboxes you control so fulfillment/refund mail stays internal.
 */
export const SMOKE_LANE_ROASTER_EMAIL =
  "chris+internal-smoke-roaster@chrisodomphoto.com";
export const SMOKE_LANE_ORG_EMAIL =
  "wearefireflymedia+internal-smoke-lane@gmail.com";
export const SMOKE_LANE_ORG_SLUG = "internal-smoke-lane";

/** Synthetic checkout buyer — not a Clerk user; safe to reuse across smoke runs. */
export const SMOKE_LANE_BUYER_EMAIL = "live-smoke-buyer@joeperks.test";

export const SMOKE_LANE_ROASTER_BUSINESS_NAME = "Internal Smoke Lane Roaster";
export const SMOKE_LANE_ORG_NAME = "Internal Smoke Lane Org";
export const SMOKE_LANE_CAMPAIGN_NAME = "Internal Smoke Lane Fundraiser";
