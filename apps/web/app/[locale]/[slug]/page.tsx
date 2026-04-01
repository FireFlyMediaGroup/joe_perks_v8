import { RESERVED_SLUGS } from "@joe-perks/types";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignHeader } from "./_components/campaign-header";
import { CartDrawer } from "./_components/cart-drawer";
import { ProductGrid } from "./_components/product-grid";
import { StorefrontCartSync } from "./_components/storefront-cart-sync";
import { StorefrontLayout } from "./_components/storefront-layout";
import { getStorefrontData } from "./_lib/queries";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    return createMetadata({
      title: "Not found",
      description: "This page does not exist.",
    });
  }
  const data = await getStorefrontData(slug);
  if (!data) {
    return createMetadata({
      title: "Store unavailable",
      description: "This storefront is not available.",
    });
  }
  return createMetadata({
    title: `${data.org.orgName} — ${data.campaign.name}`,
    description: `Shop coffee to support ${data.org.orgName}.`,
  });
}

/** Buyer storefront — one dynamic segment per org campaign slug. */
export default async function StorefrontPage({ params }: Props) {
  const { slug, locale } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const data = await getStorefrontData(slug);
  if (!data) {
    notFound();
  }

  const { org, campaign, splitPreviewDefaults } = data;

  return (
    <StorefrontLayout>
      <StorefrontCartSync orgSlug={slug} />
      <CampaignHeader
        actions={
          <CartDrawer
            campaignName={campaign.name}
            locale={locale}
            orgName={org.orgName}
            slug={slug}
            splitPreviewDefaults={splitPreviewDefaults}
          />
        }
        campaignName={campaign.name}
        goalCents={campaign.goalCents}
        orgName={org.orgName}
        orgPct={campaign.orgPct}
        totalRaisedCents={campaign.totalRaised}
      />
      <ProductGrid
        campaignId={campaign.id}
        items={campaign.items}
        orgSlug={slug}
      />
    </StorefrontLayout>
  );
}
