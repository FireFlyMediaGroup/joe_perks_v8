type Props = { params: Promise<{ token: string }> };

/** Org approve/decline via magic link — no auth. */
export default async function OrgRequestPage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="text-2xl font-semibold">Organization request</h1>
      <p className="mt-2 text-muted-foreground">
        Token <code className="rounded bg-muted px-1">{token}</code> (TODO).
      </p>
    </main>
  );
}
