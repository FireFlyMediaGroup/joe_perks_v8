"use client";

import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Label } from "@repo/design-system/components/ui/label";
import type { SerializedProduct } from "../_lib/catalog";

export type SelectedItem = { variantId: string; isFeatured: boolean };

interface ProductSelectorProps {
  readonly products: SerializedProduct[];
  readonly selected: Map<string, SelectedItem>;
  readonly onToggleVariant: (variantId: string, checked: boolean) => void;
  readonly onToggleFeatured: (variantId: string, featured: boolean) => void;
}

export function ProductSelector({
  products,
  selected,
  onToggleVariant,
  onToggleFeatured,
}: ProductSelectorProps) {
  return (
    <div className="space-y-8">
      {products.map((product) => (
        <section className="space-y-3" key={product.id}>
          <div className="flex flex-wrap items-start gap-3">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="size-14 rounded-md object-cover"
                height={56}
                src={product.imageUrl}
                width={56}
              />
            ) : null}
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-muted-foreground text-xs">{product.roastLevel}</p>
            </div>
          </div>
          <ul className="space-y-3 border-t pt-3">
            {product.variants.map((v) => {
              const isOn = selected.has(v.id);
              const featured = selected.get(v.id)?.isFeatured ?? false;
              return (
                <li
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  key={v.id}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isOn}
                      className="mt-1"
                      id={`v-${v.id}`}
                      onCheckedChange={(c) =>
                        onToggleVariant(v.id, c === true)
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal"
                      htmlFor={`v-${v.id}`}
                    >
                      <span className="block">{v.label}</span>
                      <span className="text-muted-foreground text-sm">
                        ${(v.retailPriceCents / 100).toFixed(2)} retail
                      </span>
                    </Label>
                  </div>
                  {isOn ? (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={featured}
                        id={`f-${v.id}`}
                        onCheckedChange={(c) =>
                          onToggleFeatured(v.id, c === true)
                        }
                      />
                      <span>Featured on storefront</span>
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
