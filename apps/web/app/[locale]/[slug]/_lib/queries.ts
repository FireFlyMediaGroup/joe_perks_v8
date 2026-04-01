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

export interface StorefrontData {
  campaign: Campaign & { items: StorefrontCampaignItem[] };
  org: {
    id: string;
    slug: string;
    orgName: string;
  };
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
    where: { orgId: org.id, status: "ACTIVE" },
    include: {
      items: {
        where: {
          product: { deletedAt: null },
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
  const first = campaign.items[0];
  if (first) {
    const roasterId = first.product.roasterId;
    const rate = await database.roasterShippingRate.findFirst({
      where: { roasterId },
      orderBy: [{ isDefault: "desc" }, { flatRate: "asc" }],
    });
    estimatedShippingCents = rate?.flatRate ?? null;
  }

  return {
    org: {
      id: org.id,
      slug: org.slug,
      orgName: org.application.orgName,
    },
    campaign,
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
