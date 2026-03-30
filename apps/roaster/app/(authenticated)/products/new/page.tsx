import { env } from "@/env";

import { NoRoasterProfile } from "../_components/no-roaster-profile";
import { ProductForm } from "../_components/product-form";
import { requireRoasterId } from "../_lib/require-roaster";

export default async function NewProductPage() {
  const uploadThingEnabled = Boolean(env.UPLOADTHING_TOKEN);
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile title="New product" />;
  }

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">New product</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Add a product, then create one or more size and grind variants with
        wholesale and retail prices.
      </p>
      <div className="mt-8">
        <ProductForm mode="create" uploadThingEnabled={uploadThingEnabled} />
      </div>
    </div>
  );
}
