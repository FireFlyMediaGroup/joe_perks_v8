import type { GrindOption, RoastLevel } from "@joe-perks/db";

const ROAST_LABELS: Record<RoastLevel, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  MEDIUM_DARK: "Medium-dark",
  DARK: "Dark",
};

const GRIND_LABELS: Record<GrindOption, string> = {
  WHOLE_BEAN: "Whole bean",
  GROUND_DRIP: "Ground — drip",
  GROUND_ESPRESSO: "Ground — espresso",
  GROUND_FRENCH_PRESS: "Ground — French press",
};

export function formatCentsAsDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatRoastLevel(level: RoastLevel): string {
  return ROAST_LABELS[level] ?? level;
}

export function formatGrindOption(grind: GrindOption): string {
  return GRIND_LABELS[grind] ?? grind;
}
