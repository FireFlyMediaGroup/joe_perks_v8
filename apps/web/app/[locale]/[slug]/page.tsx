import { notFound } from "next/navigation";
import { RESERVED_SLUGS } from "@joe-perks/types";

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Buyer storefront — one dynamic segment per org campaign slug. */
export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="text-2xl font-semibold">Storefront</h1>
      <p className="mt-2 text-muted-foreground">
        Org slug: <code className="rounded bg-muted px-1">{slug}</code> — wire to Campaign /
        Product data per CONVENTIONS.md.
      </p>
    </main>
  );
}
