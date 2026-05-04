"use server";

import {
  database,
  logAdminAction,
  processLostRoasterFaultDispute,
} from "@joe-perks/db";
import { reverseTransferIfPossible } from "@joe-perks/stripe";
import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "../../_lib/require-platform-admin";
import type { UpdateDisputeFaultState } from "./update-dispute-fault-state";

const VALID_FAULTS = new Set([
  "BUYER_FRAUD",
  "PLATFORM",
  "ROASTER",
  "UNCLEAR",
] as const);

type FaultAttributionValue = "BUYER_FRAUD" | "PLATFORM" | "ROASTER" | "UNCLEAR";

function parseFaultAttribution(
  raw: FormDataEntryValue | null
): FaultAttributionValue | null {
  if (typeof raw !== "string") {
    return null;
  }

  return VALID_FAULTS.has(raw as FaultAttributionValue)
    ? (raw as FaultAttributionValue)
    : null;
}

export async function updateDisputeFault(
  _prevState: UpdateDisputeFaultState,
  formData: FormData
): Promise<UpdateDisputeFaultState> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return {
      error: "You are not authorized to update disputes.",
      ok: false,
    };
  }

  const disputeId = String(formData.get("disputeId") ?? "").trim();
  const nextFault = parseFaultAttribution(formData.get("faultAttribution"));
  const noteRaw = String(formData.get("note") ?? "").trim();
  const note = noteRaw.length > 0 ? noteRaw.slice(0, 2000) : null;

  if (!disputeId) {
    return { error: "Missing dispute id.", ok: false };
  }

  if (!nextFault) {
    return { error: "Choose a valid fault attribution.", ok: false };
  }

  const dispute = await database.disputeRecord.findUnique({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          roasterTotal: true,
          stripeTransferId: true,
        },
      },
    },
    where: { id: disputeId },
  });

  if (!dispute) {
    return { error: "Dispute not found.", ok: false };
  }

  if (dispute.faultAttribution === nextFault) {
    return {
      message: "Fault attribution is already set to that value.",
      ok: true,
    };
  }

  const existingRecoveryDebtCount = await database.roasterDebt.count({
    where: {
      orderId: dispute.orderId,
      reason: { in: ["CHARGEBACK", "DISPUTE_LOSS"] },
    },
  });

  if (
    existingRecoveryDebtCount > 0 &&
    dispute.faultAttribution === "ROASTER" &&
    nextFault !== "ROASTER"
  ) {
    return {
      error:
        "This dispute already has roaster recovery recorded. Leave the fault as ROASTER or resolve the debt manually first.",
      ok: false,
    };
  }

  const actorLabel = admin.admin.actorLabel;

  await database.disputeRecord.update({
    data: { faultAttribution: nextFault },
    where: { id: disputeId },
  });

  await logAdminAction({
    actionType: "DISPUTE_FAULT_ATTRIBUTED",
    actorLabel,
    note,
    payload: {
      after: nextFault,
      before: dispute.faultAttribution,
      orderId: dispute.orderId,
      orderNumber: dispute.order.orderNumber,
      outcome: dispute.outcome,
      stripeDisputeId: dispute.stripeDisputeId,
    },
    targetId: disputeId,
    targetType: "DISPUTE",
  });

  let message = "Fault attribution updated.";

  if (dispute.outcome === "LOST" && nextFault === "ROASTER") {
    const reversal = await reverseTransferIfPossible({
      amountCents: dispute.order.roasterTotal,
      metadata: {
        order_id: dispute.orderId,
        stripe_dispute_id: dispute.stripeDisputeId,
        type: "roaster_dispute_reversal",
      },
      transferId: dispute.order.stripeTransferId,
    });

    const recovery = await processLostRoasterFaultDispute({
      actorLabel,
      orderId: dispute.orderId,
      recoveredRoasterTransferCents: reversal.recoveredCents,
      reversalAttempted: reversal.attempted,
      reversalError: reversal.error,
      reversalId: reversal.reversalId,
      stripeDisputeId: dispute.stripeDisputeId,
      trigger: "admin",
    });

    message = recovery.autoSuspended
      ? "Fault saved, roaster recovery recorded, and the roaster was auto-suspended."
      : "Fault saved and roaster recovery recorded.";
  }

  revalidatePath("/disputes");
  revalidatePath(`/orders/${dispute.orderId}`);

  return { message, ok: true };
}
