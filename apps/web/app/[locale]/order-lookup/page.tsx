import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { OrderLookupForm } from "./_components/order-lookup-form";

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: "Look up an order",
    description: "Find your Joe Perks order with the email from checkout and your order number.",
  });
}

interface GuestOrderLookupPageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function GuestOrderLookupPage({
  params,
}: GuestOrderLookupPageProps) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <OrderLookupForm locale={locale} />
      </div>
    </main>
  );
}
