import { database } from "@joe-perks/db";
import { RESERVED_SLUGS } from "@joe-perks/types";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusPoller } from "./_components/order-status-poller";
import { OrderSummary } from "./_components/order-summary";

interface Props {
  params: Promise<{ locale: string; slug: string; pi_id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    return createMetadata({
      title: "Not found",
      description: "This page does not exist.",
    });
  }
  return createMetadata({
    title: "Order confirmation",
    description: "Your Joe Perks order status.",
  });
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { locale, slug, pi_id } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const order = await database.order.findUnique({
    where: { stripePiId: pi_id },
    include: {
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
      items: true,
    },
  });

  if (!order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-semibold text-foreground text-xl">
          Order not found
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          We couldn&apos;t find an order for this link. Check your email for
          confirmation or return to the storefront.
        </p>
      </main>
    );
  }

  if (order.campaign.org.slug !== slug) {
    notFound();
  }

  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;

  const lines = order.items.map((i) => ({
    lineTotal: i.lineTotal,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    variantDesc: i.variantDesc,
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-lg">
        {order.status === "PENDING" ? (
          <OrderStatusPoller locale={locale} piId={pi_id} slug={slug} />
        ) : (
          <OrderSummary
            grossAmount={order.grossAmount}
            items={lines}
            locale={locale}
            orderNumber={order.orderNumber}
            orgAmount={order.orgAmount}
            orgName={orgName}
            orgPctSnapshot={order.orgPctSnapshot}
            productSubtotal={order.productSubtotal}
            shippingAmount={order.shippingAmount}
            slug={slug}
          />
        )}
      </div>
    </main>
  );
}
