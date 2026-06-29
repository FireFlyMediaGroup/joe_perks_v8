import Image from "next/image";
import {
  formatCentsAsDollars,
  formatGrindOption,
  formatRoastLevel,
} from "../_lib/format";
import type { StorefrontCampaignItem } from "../_lib/queries";
import { AddToCartButton } from "./add-to-cart-button";

interface ProductCardProps {
  campaignId: string;
  item: StorefrontCampaignItem;
  orgSlug: string;
  purchasesEnabled: boolean;
}

export function ProductCard({
  item,
  campaignId,
  orgSlug,
  purchasesEnabled,
}: ProductCardProps) {
  const { product, variant, retailPrice, isFeatured } = item;
  const variantLabel = `${variant.sizeOz} oz · ${formatGrindOption(variant.grind)}`;

  return (
    <div
      className={[
        "group relative flex flex-col overflow-hidden rounded-(--jp-radius-lg) border bg-jp-bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-(--jp-shadow-md)",
        isFeatured
          ? "border-jp-terra/30 ring-2 ring-jp-terra/20"
          : "border-jp-border",
      ].join(" ")}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-jp-bg-alt">
        {product.imageUrl ? (
          <Image
            alt={product.name}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={product.imageUrl}
            unoptimized
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-linear-to-br from-jp-bg-alt to-jp-bg-page"
          >
            <span className="font-jp-mono text-[10px] text-jp-light uppercase tracking-[0.14em]">
              No image
            </span>
          </div>
        )}
        {isFeatured ? (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-jp-terra px-2.5 py-1 font-jp-mono font-semibold text-[10px] text-white uppercase tracking-wider shadow-sm">
            <svg
              aria-hidden="true"
              className="size-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-5">
        <span className="mb-1 inline-flex w-fit rounded-md bg-jp-bg-alt px-2 py-0.5 font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.12em]">
          {formatRoastLevel(product.roastLevel)}
        </span>
        <h2 className="font-bold font-display text-jp-text text-lg leading-snug">
          {product.name}
        </h2>
        <p className="font-body text-jp-muted text-sm">{variantLabel}</p>
        <p className="mt-auto pt-2 font-body font-bold text-2xl text-jp-text tabular-nums">
          {formatCentsAsDollars(retailPrice)}
        </p>
      </div>

      <div className="border-jp-border border-t px-5 py-4">
        <AddToCartButton
          ctx={{ campaignId, orgSlug }}
          disabled={!purchasesEnabled}
          line={{
            campaignItemId: item.id,
            productName: product.name,
            variantDesc: variantLabel,
            retailPrice,
            imageUrl: product.imageUrl ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
