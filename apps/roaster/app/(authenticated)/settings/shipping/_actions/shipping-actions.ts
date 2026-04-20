"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireActiveRoasterId } from "../../../_lib/require-active-roaster";
import { parseDollarsToCents } from "../../../products/_lib/money";
import { shippingRateFieldsSchema } from "../_lib/schema";

export type ShippingRateActionResult =
  | { success: true }
  | { success: false; error: string };

function zodFirstMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function revalidateShippingRelated() {
  revalidatePath("/settings/shipping");
  revalidatePath("/products");
}

export async function createRate(input: {
  label: string;
  carrier: string;
  flatRateDollars: string;
  isDefault: boolean;
}): Promise<ShippingRateActionResult> {
  const session = await requireActiveRoasterId();
  if (!session.ok) {
    return {
      success: false,
      error:
        session.error === "suspended"
          ? "Your account is suspended. Review the status message on your dashboard."
          : "You must be signed in as a roaster.",
    };
  }

  const parsedMoney = parseDollarsToCents(input.flatRateDollars);
  if (!parsedMoney.ok) {
    return { success: false, error: parsedMoney.error };
  }

  const existingCount = await database.roasterShippingRate.count({
    where: { roasterId: session.roasterId },
  });

  const effectiveDefault = existingCount === 0 ? true : input.isDefault;

  const parsed = shippingRateFieldsSchema.safeParse({
    label: input.label,
    carrier: input.carrier,
    flatRateCents: parsedMoney.cents,
    isDefault: effectiveDefault,
  });
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const { label, carrier, flatRateCents, isDefault } = parsed.data;

  await database.$transaction(async (tx) => {
    if (isDefault) {
      await tx.roasterShippingRate.updateMany({
        where: { roasterId: session.roasterId },
        data: { isDefault: false },
      });
    }
    await tx.roasterShippingRate.create({
      data: {
        roasterId: session.roasterId,
        label,
        carrier,
        flatRate: flatRateCents,
        isDefault,
      },
    });
  });

  revalidateShippingRelated();
  return { success: true };
}

export async function updateRate(
  rateId: string,
  input: {
    label: string;
    carrier: string;
    flatRateDollars: string;
    isDefault: boolean;
  }
): Promise<ShippingRateActionResult> {
  const session = await requireActiveRoasterId();
  if (!session.ok) {
    return {
      success: false,
      error:
        session.error === "suspended"
          ? "Your account is suspended. Review the status message on your dashboard."
          : "You must be signed in as a roaster.",
    };
  }

  const existing = await database.roasterShippingRate.findFirst({
    where: { id: rateId, roasterId: session.roasterId },
  });

  if (!existing) {
    return { success: false, error: "Shipping rate not found." };
  }

  const count = await database.roasterShippingRate.count({
    where: { roasterId: session.roasterId },
  });

  const parsedMoney = parseDollarsToCents(input.flatRateDollars);
  if (!parsedMoney.ok) {
    return { success: false, error: parsedMoney.error };
  }

  const effectiveDefault = count === 1 ? true : input.isDefault;

  const parsed = shippingRateFieldsSchema.safeParse({
    label: input.label,
    carrier: input.carrier,
    flatRateCents: parsedMoney.cents,
    isDefault: effectiveDefault,
  });
  if (!parsed.success) {
    return { success: false, error: zodFirstMessage(parsed.error) };
  }

  const { label, carrier, flatRateCents, isDefault } = parsed.data;

  await database.$transaction(async (tx) => {
    if (isDefault) {
      await tx.roasterShippingRate.updateMany({
        where: { roasterId: session.roasterId, id: { not: rateId } },
        data: { isDefault: false },
      });
    }
    await tx.roasterShippingRate.update({
      where: { id: rateId, roasterId: session.roasterId },
      data: {
        label,
        carrier,
        flatRate: flatRateCents,
        isDefault,
      },
    });
    const defaultCount = await tx.roasterShippingRate.count({
      where: { roasterId: session.roasterId, isDefault: true },
    });
    if (defaultCount === 0) {
      const first = await tx.roasterShippingRate.findFirst({
        where: { roasterId: session.roasterId },
        orderBy: { createdAt: "asc" },
      });
      if (first) {
        await tx.roasterShippingRate.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }
  });

  revalidateShippingRelated();
  return { success: true };
}

export async function deleteRate(
  rateId: string
): Promise<ShippingRateActionResult> {
  const session = await requireActiveRoasterId();
  if (!session.ok) {
    return {
      success: false,
      error:
        session.error === "suspended"
          ? "Your account is suspended. Review the status message on your dashboard."
          : "You must be signed in as a roaster.",
    };
  }

  const existing = await database.roasterShippingRate.findFirst({
    where: { id: rateId, roasterId: session.roasterId },
  });

  if (!existing) {
    return { success: false, error: "Shipping rate not found." };
  }

  const count = await database.roasterShippingRate.count({
    where: { roasterId: session.roasterId },
  });

  if (count <= 1) {
    return {
      success: false,
      error:
        "Add another shipping rate before deleting this one. At least one rate is required.",
    };
  }

  await database.$transaction(async (tx) => {
    const wasDefault = existing.isDefault;
    await tx.roasterShippingRate.delete({
      where: { id: rateId, roasterId: session.roasterId },
    });
    if (wasDefault) {
      const next = await tx.roasterShippingRate.findFirst({
        where: { roasterId: session.roasterId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await tx.roasterShippingRate.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });

  revalidateShippingRelated();
  return { success: true };
}
