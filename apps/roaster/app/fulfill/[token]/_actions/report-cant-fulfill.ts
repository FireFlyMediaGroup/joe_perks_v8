"use server";

import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import { OrderFlaggedAdminAlertEmail } from "@joe-perks/email/templates/sla";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import {
  isCantFulfillReason,
  isCantFulfillResolutionOffer,
} from "../_lib/cant-fulfill-options";
import { validateFulfillmentToken } from "../_lib/validate-token";

const MAX_NOTE_LENGTH = 500;

export type ReportCantFulfillResult =
  | { ok: true }
  | { ok: false; error: string };

export async function reportCantFulfill(
  token: string,
  reason: string,
  resolutionOffered: string,
  note = ""
): Promise<ReportCantFulfillResult> {
  const trimmedReason = reason.trim();
  const trimmedResolution = resolutionOffered.trim();
  const trimmedNote = note.trim();

  if (!isCantFulfillReason(trimmedReason)) {
    return { ok: false, error: "Choose the main reason you cannot fulfill this order." };
  }

  if (!isCantFulfillResolutionOffer(trimmedResolution)) {
    return {
      ok: false,
      error: "Choose how you want Joe Perks to help with this order.",
    };
  }

  if (trimmedNote.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }

  const validated = await validateFulfillmentToken(token);
  if (!validated.ok) {
    return { ok: false, error: "This link is no longer valid." };
  }

  const orderId = validated.orderId;

  try {
    const flagged = await database.$transaction(async (tx) => {
      const activeLink = await tx.magicLink.findFirst({
        where: {
          token,
          purpose: "ORDER_FULFILLMENT",
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });

      if (!activeLink) {
        throw new Error("LINK_INVALID");
      }

      const order = await tx.order.findFirst({
        where: { id: orderId, status: "CONFIRMED" },
        select: {
          adminAcknowledgedFlag: true,
          flagResolvedAt: true,
          flaggedAt: true,
          orderNumber: true,
          roasterId: true,
        },
      });

      if (!order) {
        throw new Error("ORDER_STATE");
      }

      if (order.flaggedAt && !order.flagResolvedAt) {
        throw new Error("ALREADY_FLAGGED");
      }

      const flaggedAt = new Date();

      await tx.order.update({
        where: { id: orderId },
        data: {
          adminAcknowledgedFlag: false,
          flagNote: trimmedNote || null,
          flagReason: trimmedReason,
          flaggedAt,
          flagResolvedAt: null,
          resolutionOffered: trimmedResolution,
        },
      });

      const event = await tx.orderEvent.create({
        data: {
          orderId,
          eventType: "ORDER_FLAGGED",
          actorType: "ROASTER",
          actorId: order.roasterId,
          payload: {
            flag_note: trimmedNote || null,
            flag_reason: trimmedReason,
            resolution_offered: trimmedResolution,
          },
        },
      });

      return {
        eventId: event.id,
        flaggedAt,
        orderNumber: order.orderNumber,
      };
    });

    const adminEmail = process.env.PLATFORM_ALERT_EMAIL?.trim();
    if (adminEmail) {
      try {
        await sendEmail({
          entityId: flagged.eventId,
          entityType: "order_event",
          react: createElement(OrderFlaggedAdminAlertEmail, {
            note: trimmedNote || null,
            orderId,
            orderNumber: flagged.orderNumber,
            reason: trimmedReason,
            resolutionOffered: trimmedResolution,
          }),
          subject: `[Joe Perks] Fulfillment issue reported — ${flagged.orderNumber}`,
          template: "order_flagged_admin_alert",
          to: adminEmail,
        });
      } catch {
        console.error("order flagged admin alert failed", { order_id: orderId });
      }
    }

    revalidatePath(`/fulfill/${token}`);
    return { ok: true };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ALREADY_FLAGGED") {
      return {
        ok: false,
        error: "This order is already flagged for follow-up with Joe Perks.",
      };
    }
    if (code === "LINK_INVALID" || code === "ORDER_STATE") {
      return {
        ok: false,
        error: "This order is no longer available for issue reporting from this link.",
      };
    }

    console.error("report-cant-fulfill failed", { order_id: orderId });
    return {
      ok: false,
      error: "We couldn't submit this report. Please try again.",
    };
  }
}
