"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireRoasterId } from "../_lib/require-roaster";
import { type ProductFormInput, productFormSchema } from "../_lib/schema";

export type ProductActionResult =
  | { success: true; productId: string }
  | { success: false; error: string };

function zodFirstMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function createProduct(
  input: ProductFormInput
): Promise<ProductActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const data = parsed.data;

  const product = await database.product.create({
    data: {
      roasterId: session.roasterId,
      name: data.name,
      description: data.description ?? null,
      origin: data.origin ?? null,
      imageUrl: data.imageUrl ?? null,
      roastLevel: data.roastLevel,
      status: data.status,
    },
    select: { id: true },
  });
  revalidatePath("/products");
  return { success: true, productId: product.id };
}

export async function updateProduct(
  productId: string,
  input: ProductFormInput
): Promise<ProductActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const existing = await database.product.findFirst({
    where: {
      id: productId,
      roasterId: session.roasterId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Product not found." };
  }

  const data = parsed.data;

  await database.product.update({
    where: { id: productId, roasterId: session.roasterId },
    data: {
      name: data.name,
      description: data.description ?? null,
      origin: data.origin ?? null,
      imageUrl: data.imageUrl ?? null,
      roastLevel: data.roastLevel,
      status: data.status,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/edit`);
  return { success: true, productId };
}

export async function deleteProduct(
  productId: string
): Promise<ProductActionResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { success: false, error: "You must be signed in as a roaster." };
  }

  const existing = await database.product.findFirst({
    where: {
      id: productId,
      roasterId: session.roasterId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Product not found." };
  }

  const now = new Date();

  await database.$transaction([
    database.productVariant.updateMany({
      where: { productId, deletedAt: null },
      data: { deletedAt: now },
    }),
    database.product.update({
      where: { id: productId, roasterId: session.roasterId },
      data: { deletedAt: now },
    }),
  ]);

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, productId };
}
