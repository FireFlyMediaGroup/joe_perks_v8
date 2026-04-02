import { RESERVED_SLUGS } from "@joe-perks/types";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignHeader } from "./_components/campaign-header";
import { CartDrawer } from "./_components/cart-drawer";
import { ProductGrid } from "./_components/product-grid";
import { ShippingGuard } from "./_components/shipping-guard";
import { StorefrontCartSync } from "./_components/storefront-cart-sync";
import { StorefrontLayout } from "./_components/storefront-layout";
import { getStorefrontData } from "./_lib/queries";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ error?: string }>;
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
export default async function StorefrontPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const { error: queryError } = await searchParams;
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const data = await getStorefrontData(slug);
  if (!data) {
    notFound();
  }

  const { org, campaign, hasShippingRates, splitPreviewDefaults } = data;
  const purchasesEnabled = hasShippingRates;
  const showCheckoutBlocked =
    queryError === "no-shipping" && !purchasesEnabled;

  return (
    <StorefrontLayout locale={locale} orgName={org.orgName} slug={slug}>
      {purchasesEnabled ? null : <ShippingGuard />}
      {showCheckoutBlocked ? (
        <p className="bg-muted/60 py-2 text-center text-muted-foreground text-sm">
          Checkout isn&apos;t available until shipping is configured for this
          store.
        </p>
      ) : null}
      <StorefrontCartSync orgSlug={slug} />
      <CampaignHeader
        actions={
          <CartDrawer
            campaignName={campaign.name}
            locale={locale}
            orgName={org.orgName}
            purchasesEnabled={purchasesEnabled}
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
        purchasesEnabled={purchasesEnabled}
      />
    </StorefrontLayout>
  );
}
