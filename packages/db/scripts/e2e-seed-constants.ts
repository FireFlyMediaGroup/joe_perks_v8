/**
 * Single source of truth for E2E seed scripts (roaster, org, orders).
 * `ROASTER_EMAIL` in the org script must always match the roaster seed email.
 */
export const E2E_ROASTER_EMAIL = "chris@chrisodomphoto.com";
export const E2E_ORG_EMAIL = "wearefireflymedia@gmail.com";
export const E2E_ORG_SLUG = "e2e-test-org";

/** Synthetic buyer for seeded dashboard orders (not a Clerk user). */
export const E2E_SEED_BUYER_EMAIL = "e2e-buyer-orders@joeperks.test";

/** Fixed PaymentIntent ids so re-running the order seed skips instead of duplicating. */
export const E2E_SEED_ORDER_PI_CONFIRMED = "pi_e2e_seed_dashboard_confirmed";
export const E2E_SEED_ORDER_PI_SHIPPED = "pi_e2e_seed_dashboard_shipped";
