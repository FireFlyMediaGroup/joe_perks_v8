type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Storefront <code className="rounded bg-muted px-1">{slug}</code> — 3-step flow scaffold.
      </p>
    </main>
  );
}
