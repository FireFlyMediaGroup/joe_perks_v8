import { database } from "@joe-perks/db";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoRoasterProfile } from "../_components/no-roaster-profile";
import { ProductDeleteButton } from "../_components/product-delete-button";
import { VariantForm } from "../_components/variant-form";
import { VariantList } from "../_components/variant-list";
import { formatProductStatus, formatRoastLevel } from "../_lib/format";
import { requireRoasterId } from "../_lib/require-roaster";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile title="Product" />;
  }

  const product = await database.product.findFirst({
    where: {
      id,
      roasterId: session.roasterId,
      deletedAt: null,
    },
    include: {
      variants: {
        where: { deletedAt: null },
        orderBy: [{ sizeOz: "asc" }, { grind: "asc" }],
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {product.imageUrl ? (
              <Image
                alt={product.name}
                className="object-cover"
                fill
                sizes="96px"
                src={product.imageUrl}
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-semibold text-2xl">{product.name}</h1>
              <Badge variant="secondary">
                {formatProductStatus(product.status)}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {formatRoastLevel(product.roastLevel)}
              {product.origin ? ` · ${product.origin}` : null}
            </p>
            {product.description ? (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/products/${product.id}/edit`}>Edit product</Link>
          </Button>
          <ProductDeleteButton productId={product.id} />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-medium text-lg">Variants</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Each variant is a size and grind with wholesale and retail pricing.
        </p>
        <div className="mt-4">
          <VariantList
            productId={product.id}
            variants={product.variants.map((v) => ({
              id: v.id,
              sizeOz: v.sizeOz,
              grind: v.grind,
              wholesalePrice: v.wholesalePrice,
              retailPrice: v.retailPrice,
              sku: v.sku,
              isAvailable: v.isAvailable,
            }))}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-medium text-lg">Add variant</h2>
        <div className="mt-4 max-w-xl">
          <VariantForm productId={product.id} />
        </div>
      </section>
    </div>
  );
}
