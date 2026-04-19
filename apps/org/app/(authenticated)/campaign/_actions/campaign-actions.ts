"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import { requireOrgId } from "../../_lib/require-org";
import { campaignDraftSchema } from "../_lib/schema";

export type CampaignActionResult =
  | { success: true }
  | { success: false; error: string };

export type SaveDraftResult =
  | { success: true; campaignId: string }
  | { success: false; error: string };

function getOrgCampaignAccessError(
  status: "ACTIVE" | "ONBOARDING" | "SUSPENDED"
): string | null {
  if (status === "ACTIVE") {
    return null;
  }

  return status === "SUSPENDED"
    ? "Your account is suspended. Review the status guidance on your dashboard."
    : "Complete Stripe onboarding before creating a campaign.";
}

async function validateCampaignVariants(
  roasterId: string,
  variantIds: string[]
): Promise<string | null> {
  if (variantIds.length === 0) {
    return null;
  }

  const variants = await database.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  if (variants.length !== variantIds.length) {
    return "One or more product variants are invalid.";
  }

  for (const v of variants) {
    if (
      v.product.roasterId !== roasterId ||
      v.product.deletedAt !== null ||
      v.deletedAt !== null ||
      !v.isAvailable
    ) {
      return "Selected products are not available from your roaster.";
    }
    if (v.product.status !== "ACTIVE") {
      return "Selected products are not active.";
    }
  }

  return null;
}

export async function saveCampaignDraft(
  input: unknown
): Promise<SaveDraftResult> {
  const session = await requireOrgId();
  if (!session.ok) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = campaignDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid campaign data." };
  }

  const org = await database.org.findUnique({
    where: { id: session.orgId },
    include: { application: true },
  });
  if (!org) {
    return { success: false, error: "Organization not found." };
  }

  const orgAccessError = getOrgCampaignAccessError(org.status);
  if (orgAccessError) {
    return {
      success: false,
      error: orgAccessError,
    };
  }

  const approvedRequest = await database.roasterOrgRequest.findFirst({
    where: { applicationId: org.applicationId, status: "APPROVED" },
  });
  if (!approvedRequest) {
    return { success: false, error: "No approved roaster partnership found." };
  }
  const roasterId = approvedRequest.roasterId;

  const variantIdSet = new Set<string>();
  for (const row of parsed.data.items) {
    if (variantIdSet.has(row.variantId)) {
      return { success: false, error: "Duplicate product variant selected." };
    }
    variantIdSet.add(row.variantId);
  }

  const variantIds = [...variantIdSet];
  const variantError = await validateCampaignVariants(roasterId, variantIds);
  if (variantError) {
    return { success: false, error: variantError };
  }

  const existingActive = await database.campaign.findFirst({
    where: { orgId: org.id, status: "ACTIVE" },
  });
  if (existingActive) {
    return { success: false, error: "Your campaign is already live." };
  }

  const draft = await database.campaign.findFirst({
    where: { orgId: org.id, status: "DRAFT" },
  });

  const orgPct = org.application.desiredOrgPct;

  let resultCampaignId: string;
  try {
    resultCampaignId = await database.$transaction(async (tx) => {
      let campaignId: string;
      if (draft) {
        await tx.campaign.update({
          where: { id: draft.id },
          data: {
            name: parsed.data.name,
            goalCents: parsed.data.goalCents ?? null,
          },
        });
        campaignId = draft.id;
        await tx.campaignItem.deleteMany({ where: { campaignId: draft.id } });
      } else {
        const c = await tx.campaign.create({
          data: {
            orgId: org.id,
            name: parsed.data.name,
            status: "DRAFT",
            orgPct,
            goalCents: parsed.data.goalCents ?? null,
          },
        });
        campaignId = c.id;
      }

      for (const row of parsed.data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: row.variantId },
          include: { product: true },
        });
        if (!variant) {
          throw new Error("VARIANT_GONE");
        }
        await tx.campaignItem.create({
          data: {
            campaignId,
            productId: variant.productId,
            variantId: variant.id,
            retailPrice: variant.retailPrice,
            wholesalePrice: variant.wholesalePrice,
            isFeatured: row.isFeatured ?? false,
          },
        });
      }

      return campaignId;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "VARIANT_GONE") {
      return {
        success: false,
        error: "A selected variant is no longer available.",
      };
    }
    throw e;
  }

  revalidatePath("/campaign");
  return { success: true, campaignId: resultCampaignId };
}

export async function activateCampaign(
  campaignId: string
): Promise<CampaignActionResult> {
  const session = await requireOrgId();
  if (!session.ok) {
    return { success: false, error: "Unauthorized" };
  }

  const org = await database.org.findUnique({
    select: { status: true },
    where: { id: session.orgId },
  });
  if (!org) {
    return { success: false, error: "Organization not found." };
  }

  const orgAccessError = getOrgCampaignAccessError(org.status);
  if (orgAccessError) {
    return {
      success: false,
      error:
        org.status === "SUSPENDED"
          ? orgAccessError
          : "Complete Stripe onboarding before activating a campaign.",
    };
  }

  const campaign = await database.campaign.findFirst({
    where: {
      id: campaignId,
      orgId: session.orgId,
      status: "DRAFT",
    },
    include: { items: true },
  });
  if (!campaign) {
    return { success: false, error: "Draft campaign not found." };
  }
  if (campaign.items.length === 0) {
    return {
      success: false,
      error: "Add at least one product variant before activating.",
    };
  }

  const productIds = [...new Set(campaign.items.map((i) => i.productId))];
  const products = await database.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, roasterId: true },
  });
  const roasters = new Set(products.map((p) => p.roasterId));
  if (roasters.size !== 1) {
    return {
      success: false,
      error: "Campaign items must be from a single roaster catalog.",
    };
  }
  const roasterId = [...roasters][0];

  const rateCount = await database.roasterShippingRate.count({
    where: { roasterId },
  });
  if (rateCount === 0) {
    return {
      success: false,
      error:
        "Your roaster has no shipping rates configured yet. Contact them or Joe Perks support.",
    };
  }

  await database.campaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/campaign");
  return { success: true };
}
