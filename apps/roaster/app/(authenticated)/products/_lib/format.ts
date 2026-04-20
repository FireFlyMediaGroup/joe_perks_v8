import type { GrindOption, ProductStatus, RoastLevel } from "@joe-perks/db";

const ROAST_LABELS: Record<RoastLevel, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  MEDIUM_DARK: "Medium-dark",
  DARK: "Dark",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

const GRIND_LABELS: Record<GrindOption, string> = {
  WHOLE_BEAN: "Whole bean",
  GROUND_DRIP: "Ground — drip",
  GROUND_ESPRESSO: "Ground — espresso",
  GROUND_FRENCH_PRESS: "Ground — French press",
};

export function formatRoastLevel(level: RoastLevel): string {
  return ROAST_LABELS[level] ?? level;
}

export function formatProductStatus(status: ProductStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatGrindOption(grind: GrindOption): string {
  return GRIND_LABELS[grind] ?? grind;
}
