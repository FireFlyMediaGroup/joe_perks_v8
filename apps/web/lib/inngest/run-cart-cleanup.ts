/**
 * Daily placeholder: Phase 2 will delete expired DB-backed carts.
 * Client carts (Zustand) have no server TTL today — log a zero count.
 */
export function runCartCleanup(): void {
  const expiredCartCount = 0;
  console.log("cart-cleanup: expired_cart_count", {
    expired_cart_count: expiredCartCount,
    phase: "noop_until_db_carts",
  });
}
