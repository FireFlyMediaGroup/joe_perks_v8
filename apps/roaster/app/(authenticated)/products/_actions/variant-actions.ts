"use server";

import { database } from "@joe-perks/db";
import { Prisma } from "@joe-perks/db/generated/client";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireRoasterId } from "../_lib/require-roaster";
import {
  createVariantInputSchema,
  updateVariantInputSchema,
} from "../_lib/schema";

export type VariantActionResult =
  | { success: true; variantId: string }
  | { success: false; error: string };

function zodFirstMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function assertProductOwnedByRoaster(roasterId: string, productId: string) {
  return database.product.findFirst({
    where: {
      id: productId,
      roasterId,
      deletedAt: null,
    },
    select: { id: true },
  });
}

export async function createVariant(
  raw: unknown
): Promise<VariantActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const parsed = createVariantInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const data = parsed.data;
  const product = await assertProductOwnedByRoaster(
    session.roasterId,
    data.productId
  );
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  try {
    const variant = await database.productVariant.create({
      data: {
        productId: data.productId,
        sizeOz: data.sizeOz,
        grind: data.grind,
        wholesalePrice: data.wholesalePriceCents,
        retailPrice: data.retailPriceCents,
        sku: data.sku ?? null,
        isAvailable: data.isAvailable,
      },
      select: { id: true },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${data.productId}`);
    return { success: true, variantId: variant.id };
  } catch (caught) {
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "That SKU is already used by another variant. Change the SKU or leave it blank.",
      };
    }
    throw caught;
  }
}

export async function updateVariant(
  raw: unknown
): Promise<VariantActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const parsed = updateVariantInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const data = parsed.data;
  const product = await assertProductOwnedByRoaster(
    session.roasterId,
    data.productId
  );
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const variant = await database.productVariant.findFirst({
    where: {
      id: data.id,
      productId: data.productId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!variant) {
    return { success: false, error: "Variant not found." };
  }

  try {
    await database.productVariant.update({
      where: { id: data.id },
      data: {
        sizeOz: data.sizeOz,
        grind: data.grind,
        wholesalePrice: data.wholesalePriceCents,
        retailPrice: data.retailPriceCents,
        sku: data.sku ?? null,
        isAvailable: data.isAvailable,
      },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${data.productId}`);
    return { success: true, variantId: data.id };
  } catch (caught) {
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "That SKU is already used by another variant. Change the SKU or leave it blank.",
      };
    }
    throw caught;
  }
}

export async function deleteVariant(
  productId: string,
  variantId: string
): Promise<VariantActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const product = await assertProductOwnedByRoaster(
    session.roasterId,
    productId
  );
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const variant = await database.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!variant) {
    return { success: false, error: "Variant not found." };
  }

  await database.productVariant.update({
    where: { id: variantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, variantId };
}
