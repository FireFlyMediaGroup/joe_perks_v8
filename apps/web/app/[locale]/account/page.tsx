import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { DashboardHeading } from "./_components/dashboard-heading";
import { EmptyOrdersState } from "./_components/empty-orders-state";
import { BuyerImpactSummary } from "./_components/impact-summary";
import { OrderHistoryList } from "./_components/order-history-list";
import { buildBuyerDashboardSummary } from "./_lib/dashboard";
import { getBuyerDashboardOrders } from "./_lib/queries";
import { requireCurrentBuyer } from "@/lib/buyer-auth/current-buyer";

interface BuyerAccountPageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<{ focus?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: "Your account",
    description: "Review your Joe Perks order history and fundraiser impact.",
  });
}

export default async function BuyerAccountPage({
  params,
  searchParams,
}: BuyerAccountPageProps) {
  const { locale } = await params;
  const { focus } = await searchParams;
  const buyer = await requireCurrentBuyer({
    locale,
    redirectTo: `/${locale}/account?focus=orders-heading`,
  });
  const orders = await getBuyerDashboardOrders(buyer.id);
  const summary = buildBuyerDashboardSummary(orders);
  const shouldAutoFocusHeading = focus === "orders-heading";

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <DashboardHeading
          buyerEmail={buyer.email}
          shouldAutoFocus={shouldAutoFocusHeading}
        />
        {orders.length > 0 ? (
          <>
            <BuyerImpactSummary summary={summary} />
            <OrderHistoryList locale={locale} orders={orders} />
          </>
        ) : (
          <EmptyOrdersState locale={locale} />
        )}
      </div>
    </main>
  );
}
