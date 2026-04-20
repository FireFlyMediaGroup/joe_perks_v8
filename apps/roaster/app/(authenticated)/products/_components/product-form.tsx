"use client";

import type { ProductStatus, RoastLevel } from "@joe-perks/db";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createProduct,
  type ProductActionResult,
  updateProduct,
} from "../_actions/product-actions";
import {
  PRODUCT_STATUSES,
  type ProductFormInput,
  ROAST_LEVELS,
} from "../_lib/schema";
import { ProductImageField } from "./product-image-field";

type ProductFormMode = "create" | "edit";

function productPrimaryLabel(pending: boolean, mode: ProductFormMode): string {
  if (pending) {
    return "Saving…";
  }
  if (mode === "create") {
    return "Create product";
  }
  return "Save";
}

interface ProductFormProps {
  readonly initial?: {
    name: string;
    description: string | null;
    origin: string | null;
    imageUrl: string | null;
    roastLevel: RoastLevel;
    status: ProductStatus;
  };
  readonly mode: ProductFormMode;
  readonly productId?: string;
  /** Roaster-level shipping rates; used for non-blocking ACTIVE status warning. */
  readonly shippingRateCount?: number;
  /** When true, `UPLOADTHING_TOKEN` is set server-side and image upload is available. */
  readonly uploadThingEnabled: boolean;
}

export function ProductForm({
  mode,
  productId,
  initial,
  uploadThingEnabled,
  shippingRateCount = 0,
}: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [origin, setOrigin] = useState(initial?.origin ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(
    initial?.roastLevel ?? "MEDIUM"
  );
  const [status, setStatus] = useState<ProductStatus>(
    initial?.status ?? "DRAFT"
  );

  function buildPayload(): ProductFormInput {
    return {
      name,
      description: description || undefined,
      origin: origin || undefined,
      imageUrl: imageUrl || undefined,
      roastLevel,
      status,
    };
  }

  function handleSubmit() {
    setError(null);
    const payload = buildPayload();
    startTransition(async () => {
      let result: ProductActionResult;
      if (mode === "create") {
        result = await createProduct(payload);
      } else {
        if (!productId) {
          setError("Missing product id.");
          return;
        }
        result = await updateProduct(productId, payload);
      }

      if (result.success) {
        router.push(`/products/${result.productId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product-name">Product name</Label>
        <Input
          autoComplete="off"
          id="product-name"
          onChange={(e) => setName(e.target.value)}
          required
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          className="min-h-[100px]"
          id="product-description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-origin">Origin</Label>
        <Input
          autoComplete="off"
          id="product-origin"
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. Colombia Huila"
          value={origin}
        />
      </div>

      <ProductImageField
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        uploadThingEnabled={uploadThingEnabled}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Roast level</Label>
          <Select
            onValueChange={(v) => setRoastLevel(v as RoastLevel)}
            value={roastLevel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Roast level" />
            </SelectTrigger>
            <SelectContent>
              {ROAST_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            onValueChange={(v) => setStatus(v as ProductStatus)}
            value={status}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {status === "ACTIVE" && shippingRateCount === 0 ? (
        <Alert variant="default">
          <AlertTriangleIcon />
          <AlertTitle>No shipping rates configured</AlertTitle>
          <AlertDescription>
            Active products are used in campaigns, but buyers need a shipping
            rate at checkout.{" "}
            <Link
              className="font-medium underline underline-offset-4"
              href="/settings/shipping"
            >
              Add a shipping rate
            </Link>{" "}
            before going live.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pending || !name.trim()}
          onClick={() => handleSubmit()}
          type="button"
        >
          {productPrimaryLabel(pending, mode)}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link
            href={
              mode === "edit" && productId
                ? `/products/${productId}`
                : "/products"
            }
          >
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}
