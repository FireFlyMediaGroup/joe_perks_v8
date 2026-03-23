type Props = {
  params: Promise<{ locale: string; slug: string; pi_id: string }>;
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { slug, pi_id } = await params;

  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="text-2xl font-semibold">Order confirmation</h1>
      <p className="mt-2 text-muted-foreground">
        Slug <code className="rounded bg-muted px-1">{slug}</code> · PaymentIntent{" "}
        <code className="rounded bg-muted px-1">{pi_id}</code>
      </p>
    </main>
  );
}
