import "server-only";

import { getStripe } from "./client";

export interface ReverseTransferIfPossibleInput {
  amountCents: number;
  metadata?: Record<string, string>;
  transferId: string | null;
}

export interface ReverseTransferIfPossibleResult {
  attempted: boolean;
  error: string | null;
  recoveredCents: number;
  reversalId: string | null;
}

export async function reverseTransferIfPossible({
  amountCents,
  metadata,
  transferId,
}: ReverseTransferIfPossibleInput): Promise<ReverseTransferIfPossibleResult> {
  if (!transferId || amountCents <= 0) {
    return {
      attempted: false,
      error: null,
      recoveredCents: 0,
      reversalId: null,
    };
  }

  try {
    const reversal = await getStripe().transfers.createReversal(transferId, {
      amount: amountCents,
      ...(metadata ? { metadata } : {}),
    });

    return {
      attempted: true,
      error: null,
      recoveredCents: reversal.amount,
      reversalId: reversal.id,
    };
  } catch (error) {
    return {
      attempted: true,
      error: error instanceof Error ? error.message : "unknown",
      recoveredCents: 0,
      reversalId: null,
    };
  }
}
