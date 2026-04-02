import type { StorefrontCampaignItem } from "../_lib/queries";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  campaignId: string;
  items: StorefrontCampaignItem[];
  orgSlug: string;
  purchasesEnabled: boolean;
}

export function ProductGrid({
  items,
  campaignId,
  orgSlug,
  purchasesEnabled,
}: ProductGridProps) {
  const featured = items.filter((i) => i.isFeatured);
  const rest = items.filter((i) => !i.isFeatured);

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="font-body text-lg text-jp-muted">
          No products are available in this campaign yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="mb-14">
          <h2
            className="mb-6 font-display text-2xl font-bold tracking-tight text-jp-text"
            id="featured-heading"
          >
            Featured
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <li key={item.id}>
                <ProductCard
                  campaignId={campaignId}
                  item={item}
                  orgSlug={orgSlug}
                  purchasesEnabled={purchasesEnabled}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section aria-labelledby="catalog-heading">
          {featured.length > 0 ? (
            <h2
              className="mb-6 font-display text-2xl font-bold tracking-tight text-jp-text"
              id="catalog-heading"
            >
              All coffee
            </h2>
          ) : null}
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <li key={item.id}>
                <ProductCard
                  campaignId={campaignId}
                  item={item}
                  orgSlug={orgSlug}
                  purchasesEnabled={purchasesEnabled}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
