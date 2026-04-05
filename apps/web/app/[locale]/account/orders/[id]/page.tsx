import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCurrentBuyer } from "@/lib/buyer-auth/current-buyer";
import { BackToOrdersLink } from "./_components/back-to-orders-link";
import { OrderDeliveryCard } from "./_components/order-delivery-card";
import { OrderDetailHeader } from "./_components/order-detail-header";
import { OrderItemsCard } from "./_components/order-items-card";
import { OrderSummaryCard } from "./_components/order-summary-card";
import { ShippingCard } from "./_components/shipping-card";
import { getBuyerOrderTrackingStateCopy } from "./_lib/order-detail";
import { getBuyerOrderDetail } from "./_lib/queries";

interface BuyerOrderDetailPageProps {
  readonly params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: "Order details",
    description: "Review your Joe Perks order details and tracking updates.",
  });
}

export default async function BuyerOrderDetailPage({
  params,
}: BuyerOrderDetailPageProps) {
  const { id, locale } = await params;
  const buyer = await requireCurrentBuyer({
    locale,
    redirectTo: `/${locale}/account/orders/${id}`,
  });
  const order = await getBuyerOrderDetail(id, buyer.id);

  if (!order) {
    notFound();
  }

  const trackingState = getBuyerOrderTrackingStateCopy(order);

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <BackToOrdersLink locale={locale} />
        <OrderDetailHeader
          fundraiserName={order.fundraiserName}
          orderNumber={order.orderNumber}
          placedAt={order.placedAt}
          trackingState={trackingState}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
          <OrderDeliveryCard order={order} />
          <ShippingCard
            buyerEmail={order.buyerEmail}
            shipToAddress1={order.shipToAddress1}
            shipToAddress2={order.shipToAddress2}
            shipToCity={order.shipToCity}
            shipToCountry={order.shipToCountry}
            shipToName={order.shipToName}
            shipToPostalCode={order.shipToPostalCode}
            shipToState={order.shipToState}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
          <OrderItemsCard items={order.items} />
          <OrderSummaryCard
            fundraiserName={order.fundraiserName}
            grossAmount={order.grossAmount}
            orgAmount={order.orgAmount}
            orgPctSnapshot={order.orgPctSnapshot}
            productSubtotal={order.productSubtotal}
            shippingAmount={order.shippingAmount}
          />
        </div>
      </div>
    </main>
  );
}
