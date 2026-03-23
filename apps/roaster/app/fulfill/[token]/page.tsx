type Props = { params: Promise<{ token: string }> };

/** Magic link fulfillment — no auth (AGENTS.md). */
export default async function FulfillPage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="text-2xl font-semibold">Fulfillment</h1>
      <p className="mt-2 text-muted-foreground">
        Token <code className="rounded bg-muted px-1">{token}</code> — validate + tracking form
        (TODO).
      </p>
    </main>
  );
}
