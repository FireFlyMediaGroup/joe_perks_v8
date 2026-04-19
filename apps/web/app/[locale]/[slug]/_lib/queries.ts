import type {
  Campaign,
  CampaignItem,
  Product,
  ProductVariant,
} from "@joe-perks/db";
import { database } from "@joe-perks/db";

export type StorefrontCampaignItem = CampaignItem & {
  product: Product;
  variant: ProductVariant;
};

/** Server defaults for cart/checkout split preview — matches `create-intent` inputs. */
export interface SplitPreviewDefaults {
  estimatedShippingCents: number | null;
  orgPct: number;
  orgPctMax: number;
  orgPctMin: number;
  platformFeeFloorCents: number;
  platformFeePct: number;
}

/** Roaster shipping options for checkout (US-04-03) and availability guard (US-04-05). */
export interface ShippingRateOption {
  carrier: string;
  flatRate: number;
  id: string;
  isDefault: boolean;
  label: string;
}

export interface StorefrontData {
  campaign: Campaign & { items: StorefrontCampaignItem[] };
  /** True when the campaign roaster has at least one `RoasterShippingRate`. */
  hasShippingRates: boolean;
  org: {
    id: string;
    slug: string;
    orgName: string;
  };
  shippingRates: ShippingRateOption[];
  splitPreviewDefaults: SplitPreviewDefaults;
}

/**
 * Loads org + active campaign + visible campaign items for the buyer storefront.
 * Reused by checkout (US-04-03) for validation.
 */
export async function getStorefrontData(
  slug: string
): Promise<StorefrontData | null> {
  const org = await database.org.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      application: { select: { orgName: true } },
    },
  });
  if (!org) {
    return null;
  }

  const campaign = await database.campaign.findFirst({
    where: {
      items: {
        some: {
          product: {
            deletedAt: null,
            roaster: { status: "ACTIVE" },
            status: "ACTIVE",
          },
          variant: { deletedAt: null, isAvailable: true },
        },
      },
      orgId: org.id,
      status: "ACTIVE",
    },
    include: {
      items: {
        where: {
          product: {
            deletedAt: null,
            roaster: { status: "ACTIVE" },
            status: "ACTIVE",
          },
          variant: { deletedAt: null, isAvailable: true },
        },
        orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
        include: { product: true, variant: true },
      },
    },
  });
  if (!campaign) {
    return null;
  }

  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  let estimatedShippingCents: number | null = null;
  let shippingRates: ShippingRateOption[] = [];
  let hasShippingRates = false;

  const first = campaign.items[0];
  if (first) {
    const roasterId = first.product.roasterId;
    const rates = await database.roasterShippingRate.findMany({
      where: { roasterId },
      orderBy: [{ isDefault: "desc" }, { flatRate: "asc" }],
      select: {
        id: true,
        label: true,
        carrier: true,
        flatRate: true,
        isDefault: true,
      },
    });
    shippingRates = rates;
    hasShippingRates = rates.length > 0;
    const rate = rates[0];
    estimatedShippingCents = rate?.flatRate ?? null;
  }

  return {
    org: {
      id: org.id,
      slug: org.slug,
      orgName: org.application.orgName,
    },
    campaign,
    hasShippingRates,
    shippingRates,
    splitPreviewDefaults: {
      estimatedShippingCents,
      orgPct: campaign.orgPct,
      orgPctMax: settings.orgPctMax,
      orgPctMin: settings.orgPctMin,
      platformFeeFloorCents: settings.platformFeeFloor,
      platformFeePct: settings.platformFeePct,
    },
  };
}
