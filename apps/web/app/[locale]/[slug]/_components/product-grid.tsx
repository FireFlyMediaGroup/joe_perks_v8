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
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="font-body text-jp-muted text-lg">
          No products are available in this campaign yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14 md:py-20">
      {featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="mb-16">
          <h2
            className="mb-8 text-center font-bold font-display text-2xl text-jp-text tracking-tight"
            id="featured-heading"
          >
            Featured
          </h2>
          <ul className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <li className="w-full" key={item.id}>
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
              className="mb-8 text-center font-bold font-display text-2xl text-jp-text tracking-tight"
              id="catalog-heading"
            >
              All coffee
            </h2>
          ) : null}
          <ul className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <li className="w-full" key={item.id}>
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
