import { database } from "@joe-perks/db";
import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";

import { NoRoasterProfile } from "./_components/no-roaster-profile";
import { ProductList } from "./_components/product-list";
import { requireRoasterId } from "./_lib/require-roaster";

export default async function ProductsPage() {
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile />;
  }

  const products = await database.product.findMany({
    where: { roasterId: session.roasterId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      variants: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Products</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your coffee catalog. Campaigns will reference these variants.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">New product</Link>
        </Button>
      </div>
      <ProductList
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          roastLevel: p.roastLevel,
          status: p.status,
          imageUrl: p.imageUrl,
          variantCount: p.variants.length,
        }))}
      />
    </div>
  );
}
