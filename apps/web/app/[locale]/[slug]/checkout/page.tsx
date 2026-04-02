import { RESERVED_SLUGS } from "@joe-perks/types";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "./_components/checkout-form";
import { getStorefrontData } from "../_lib/queries";

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
      title: "Checkout",
      description: "Checkout is unavailable.",
    });
  }
  return createMetadata({
    title: `Checkout — ${data.org.orgName}`,
    description: `Complete your order to support ${data.org.orgName}.`,
  });
}

export default async function CheckoutPage({ params }: Props) {
  const { locale, slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const data = await getStorefrontData(slug);
  if (!data) {
    notFound();
  }

  if (!data.hasShippingRates) {
    redirect(`/${locale}/${slug}?error=no-shipping`);
  }

  const defaultRateId =
    data.shippingRates.find((r) => r.isDefault)?.id ??
    data.shippingRates[0]?.id ??
    null;

  return (
    <main className="min-h-screen bg-jp-bg-page px-4 py-8 md:py-12">
      <CheckoutForm
        campaignId={data.campaign.id}
        defaultShippingRateId={defaultRateId}
        locale={locale}
        orgName={data.org.orgName}
        shippingRates={data.shippingRates}
        slug={slug}
      />
    </main>
  );
}
