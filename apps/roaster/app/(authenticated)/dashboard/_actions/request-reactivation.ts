"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import { requireRoasterId } from "../../products/_lib/require-roaster";

import type { RequestReactivationState } from "./request-reactivation-state";

export async function requestRoasterReactivation(
  _prevState: RequestReactivationState,
  formData: FormData
): Promise<RequestReactivationState> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return {
      error: "You must be signed in as a roaster.",
      message: null,
      ok: false,
    };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!note) {
    return {
      error: "Add a remediation note before submitting the request.",
      message: null,
      ok: false,
    };
  }

  const roaster = await database.roaster.findUnique({
    include: {
      application: {
        select: { businessName: true },
      },
    },
    where: { id: session.roasterId },
  });

  if (!roaster) {
    return { error: "Roaster profile not found.", message: null, ok: false };
  }

  if (roaster.status !== "SUSPENDED") {
    return {
      error: "This account is not suspended.",
      message: null,
      ok: false,
    };
  }

  await database.adminActionLog.create({
    data: {
      actionType: "ROASTER_REACTIVATION_REQUESTED",
      actorLabel: roaster.email,
      note,
      payload: {
        accountName: roaster.application.businessName || roaster.email,
        requestSource: "roaster_portal",
      },
      targetId: roaster.id,
      targetType: "ROASTER",
    },
  });

  revalidatePath("/dashboard");

  return {
    error: null,
    message: "Request submitted. Joe Perks will review your account status.",
    ok: true,
  };
}
