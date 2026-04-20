const LEADING_DOLLAR_SIGN = /^\$/;

/** Parse a dollar string (e.g. "19.99" or "$19.99") to integer cents. */
export function parseDollarsToCents(
  raw: string
): { ok: true; cents: number } | { ok: false; error: string } {
  const trimmed = raw.trim().replace(LEADING_DOLLAR_SIGN, "");
  if (trimmed === "") {
    return { ok: false, error: "Price is required" };
  }
  const n = Number.parseFloat(trimmed);
  if (Number.isNaN(n)) {
    return { ok: false, error: "Enter a valid price" };
  }
  if (n <= 0) {
    return { ok: false, error: "Price must be greater than zero" };
  }
  const cents = Math.round(n * 100);
  if (cents <= 0) {
    return { ok: false, error: "Price must be greater than zero" };
  }
  return { ok: true, cents };
}

export function formatCentsAsDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** True when (retail − wholesale) / retail < 0.2 */
export function isLowMarginWarning(
  wholesaleCents: number,
  retailCents: number
): boolean {
  if (retailCents <= 0) {
    return false;
  }
  const margin = (retailCents - wholesaleCents) / retailCents;
  return margin < 0.2;
}
