import { database } from "@joe-perks/db";
import { RESERVED_SLUGS } from "@joe-perks/types";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readBuyerSession } from "@/lib/buyer-auth/session";
import { AccountCreationCard } from "./_components/account-creation-card";
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

function maskEmailAddress(email: string): string {
  const [localPart, domainPart = ""] = email.split("@");
  const maskedLocalPart =
    localPart.length <= 2
      ? `${localPart[0] ?? ""}*`
      : `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}`;

  const [domainName, tld = ""] = domainPart.split(".");
  const maskedDomainName =
    domainName.length <= 1
      ? "*"
      : `${domainName[0]}${"*".repeat(Math.max(domainName.length - 1, 1))}`;

  return `${maskedLocalPart}@${maskedDomainName}${tld ? `.${tld}` : ""}`;
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
  const buyerSession = await readBuyerSession();
  const isSignedInBuyer =
    Boolean(order.buyerId) && buyerSession?.buyerId === order.buyerId;

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
          <div className="space-y-6">
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
            <AccountCreationCard
              locale={locale}
              maskedEmail={maskEmailAddress(order.buyerEmail)}
              paymentIntentId={pi_id}
              redirectPath={`/${locale}/${slug}/order/${pi_id}`}
              signedIn={isSignedInBuyer}
            />
          </div>
        )}
      </div>
    </main>
  );
}
