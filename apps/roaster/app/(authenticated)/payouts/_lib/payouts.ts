import type {
  DebtReason,
  DisputeOutcome,
  FaultType,
  PayoutStatus,
} from "@joe-perks/db";

export type PayoutDisplayState =
  | "pending"
  | "in-hold"
  | "awaiting-release"
  | "paid"
  | "failed";

export type PayoutBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export interface FinanceSummaryMetric {
  readonly amount: number;
  readonly count: number;
}

export interface FinanceSummary {
  readonly awaitingRelease: FinanceSummaryMetric;
  readonly failed: FinanceSummaryMetric;
  readonly inHold: FinanceSummaryMetric;
  readonly openDisputes: number;
  readonly paid: FinanceSummaryMetric;
  readonly unsettledDebtCount: number;
  readonly unsettledDebtTotal: number;
}

interface SummaryPayoutRow {
  readonly payoutEligibleAt: Date | null;
  readonly payoutStatus: PayoutStatus;
  readonly roasterTotal: number;
}

interface SummaryDebtRow {
  readonly amount: number;
}

interface SummaryDisputeRow {
  readonly outcome: DisputeOutcome | null;
}

interface PayoutEventSnapshot {
  readonly eventType: "PAYOUT_FAILED" | "PAYOUT_TRANSFERRED";
  readonly payload: unknown;
}

export function getPayoutDisplayState(
  payoutStatus: PayoutStatus,
  payoutEligibleAt: Date | null,
  now: Date = new Date()
): PayoutDisplayState {
  if (payoutStatus === "TRANSFERRED") {
    return "paid";
  }

  if (payoutStatus === "FAILED") {
    return "failed";
  }

  if (payoutStatus === "HELD") {
    if (payoutEligibleAt && payoutEligibleAt.getTime() <= now.getTime()) {
      return "awaiting-release";
    }

    return "in-hold";
  }

  return "pending";
}

export function getPayoutDisplayLabel(state: PayoutDisplayState): string {
  switch (state) {
    case "in-hold": {
      return "In hold period";
    }
    case "awaiting-release": {
      return "Awaiting release";
    }
    case "paid": {
      return "Paid";
    }
    case "failed": {
      return "Transfer failed";
    }
    case "pending": {
      return "Pending";
    }
    default: {
      return "Pending";
    }
  }
}

export function getPayoutBadgeVariant(
  state: PayoutDisplayState
): PayoutBadgeVariant {
  switch (state) {
    case "paid": {
      return "default";
    }
    case "in-hold":
    case "pending": {
      return "secondary";
    }
    case "awaiting-release": {
      return "outline";
    }
    case "failed": {
      return "destructive";
    }
    default: {
      return "secondary";
    }
  }
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDebtReason(reason: DebtReason): string {
  switch (reason) {
    case "DISPUTE_LOSS": {
      return "Dispute loss";
    }
    case "CHARGEBACK": {
      return "Chargeback";
    }
    case "MANUAL_ADJUSTMENT": {
      return "Manual adjustment";
    }
    case "PLATFORM_FEE": {
      return "Platform fee";
    }
    default: {
      return "Manual adjustment";
    }
  }
}

export function formatFaultAttribution(
  faultAttribution: FaultType | null
): string {
  switch (faultAttribution) {
    case "ROASTER": {
      return "Roaster";
    }
    case "PLATFORM": {
      return "Platform";
    }
    case "BUYER_FRAUD": {
      return "Buyer fraud";
    }
    case "UNCLEAR": {
      return "Unclear";
    }
    case null: {
      return "Under review";
    }
    default: {
      return "Under review";
    }
  }
}

export function formatDisputeOutcome(outcome: DisputeOutcome | null): string {
  switch (outcome) {
    case "WON": {
      return "Won";
    }
    case "LOST": {
      return "Lost";
    }
    case "WITHDRAWN": {
      return "Withdrawn";
    }
    case null: {
      return "Open";
    }
    default: {
      return "Open";
    }
  }
}

export function summarizeFinanceData(
  payouts: readonly SummaryPayoutRow[],
  debts: readonly SummaryDebtRow[],
  disputes: readonly SummaryDisputeRow[],
  now: Date = new Date()
): FinanceSummary {
  let inHoldAmount = 0;
  let inHoldCount = 0;
  let awaitingReleaseAmount = 0;
  let awaitingReleaseCount = 0;
  let paidAmount = 0;
  let paidCount = 0;
  let failedAmount = 0;
  let failedCount = 0;

  for (const payout of payouts) {
    const state = getPayoutDisplayState(
      payout.payoutStatus,
      payout.payoutEligibleAt,
      now
    );

    if (state === "in-hold") {
      inHoldAmount += payout.roasterTotal;
      inHoldCount += 1;
      continue;
    }

    if (state === "awaiting-release") {
      awaitingReleaseAmount += payout.roasterTotal;
      awaitingReleaseCount += 1;
      continue;
    }

    if (state === "paid") {
      paidAmount += payout.roasterTotal;
      paidCount += 1;
      continue;
    }

    if (state === "failed") {
      failedAmount += payout.roasterTotal;
      failedCount += 1;
    }
  }

  return {
    awaitingRelease: {
      amount: awaitingReleaseAmount,
      count: awaitingReleaseCount,
    },
    failed: {
      amount: failedAmount,
      count: failedCount,
    },
    inHold: {
      amount: inHoldAmount,
      count: inHoldCount,
    },
    openDisputes: disputes.filter((dispute) => dispute.outcome === null).length,
    paid: {
      amount: paidAmount,
      count: paidCount,
    },
    unsettledDebtCount: debts.length,
    unsettledDebtTotal: debts.reduce((sum, debt) => sum + debt.amount, 0),
  };
}

export function getPayoutEventNote(
  event: PayoutEventSnapshot | null | undefined
): string | null {
  if (!event) {
    return null;
  }

  const payload = asRecord(event.payload);
  if (!payload) {
    return null;
  }

  if (event.eventType === "PAYOUT_TRANSFERRED") {
    const totalDebt = payload.total_debt;
    if (typeof totalDebt === "number" && totalDebt > 0) {
      return `Reduced by ${formatUsd(totalDebt)} to settle earlier roaster debt.`;
    }

    return null;
  }

  const reason = payload.reason;
  if (reason === "roaster_debt_exceeds_payout") {
    return "Blocked because unsettled roaster debt exceeded this payout.";
  }

  if (reason === "roaster_connect_not_ready") {
    return "Blocked until Stripe payouts are enabled for this roaster account.";
  }

  return "Platform follow-up is required before this payout can complete.";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}
