import { database } from "@joe-perks/db";
import { notFound } from "next/navigation";

import { env } from "@/env";

import { NoRoasterProfile } from "../../_components/no-roaster-profile";
import { ProductForm } from "../../_components/product-form";
import { requireRoasterId } from "../../_lib/require-roaster";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const uploadThingEnabled = Boolean(env.UPLOADTHING_TOKEN);
  const { id } = await params;
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile title="Edit product" />;
  }

  const product = await database.product.findFirst({
    where: {
      id,
      roasterId: session.roasterId,
      deletedAt: null,
    },
  });

  if (!product) {
    notFound();
  }

  const shippingRateCount = await database.roasterShippingRate.count({
    where: { roasterId: session.roasterId },
  });

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">Edit product</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Update details shown on your catalog and campaign flows.
      </p>
      <div className="mt-8">
        <ProductForm
          initial={{
            name: product.name,
            description: product.description,
            origin: product.origin,
            imageUrl: product.imageUrl,
            roastLevel: product.roastLevel,
            status: product.status,
          }}
          mode="edit"
          productId={product.id}
          shippingRateCount={shippingRateCount}
          uploadThingEnabled={uploadThingEnabled}
        />
      </div>
    </div>
  );
}
