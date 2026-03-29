import "server-only";

import type Stripe from "stripe";

import { getStripe } from "./client";

export interface TransferToConnectedAccountParams {
  amountCents: number;
  destinationStripeAccountId: string;
  metadata: Record<string, string>;
  sourceChargeId: string;
  transferGroup: string;
}

/**
 * Connect transfer from platform balance — `transfer_group` must match `order.id`.
 */
export function transferToConnectedAccount(
  params: TransferToConnectedAccountParams
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: "usd",
    destination: params.destinationStripeAccountId,
    source_transaction: params.sourceChargeId,
    transfer_group: params.transferGroup,
    metadata: params.metadata,
  });
}

export interface RefundChargeParams {
  /** Omit for full refund of the charge. */
  amountCents?: number;
  chargeId: string;
  metadata?: Record<string, string>;
}

export function refundCharge(
  params: RefundChargeParams
): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    charge: params.chargeId,
    ...(params.amountCents !== undefined ? { amount: params.amountCents } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  });
}
