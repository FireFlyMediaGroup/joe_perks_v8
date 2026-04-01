import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/design-system/components/ui/card";
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
    <Card
      className={
        isFeatured
          ? "gap-0 overflow-hidden border-[#D4603A]/40 p-0 py-0 ring-2 ring-[#D4603A]/25"
          : "gap-0 overflow-hidden p-0 py-0"
      }
    >
      <CardHeader className="border-0 p-0 px-0">
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-t-xl bg-muted">
          {product.imageUrl ? (
            <Image
              alt={product.name}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={product.imageUrl}
              unoptimized
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-muted/60"
            >
              <span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
                No image
              </span>
            </div>
          )}
          {isFeatured ? (
            <span className="absolute top-3 left-3 rounded-md bg-[#D4603A] px-2 py-1 font-mono font-semibold text-[10px] text-white uppercase tracking-wider">
              Featured
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
            {formatRoastLevel(product.roastLevel)}
          </span>
        </div>
        <h2 className="font-semibold text-foreground text-xl leading-snug">
          {product.name}
        </h2>
        <p className="text-muted-foreground text-sm">{variantLabel}</p>
        <p className="font-bold text-2xl text-foreground tabular-nums">
          {formatCentsAsDollars(retailPrice)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
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
      </CardFooter>
    </Card>
  );
}
