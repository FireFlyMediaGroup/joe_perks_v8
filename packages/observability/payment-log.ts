import { log } from "./log";

/**
 * Canonical context attached to every payment/webhook log line so they can be
 * filtered and correlated in the log backend (launch runbook A.4). The four
 * canonical keys are always emitted — `null` when unknown — so a query like
 * `order_number = "JP-00001"` returns the full lifecycle regardless of which
 * handler wrote each line.
 */
export interface PaymentLogContext {
  orderId?: string | null;
  orderNumber?: string | null;
  orgId?: string | null;
  roasterId?: string | null;
}

type LogFn = (message: string, context?: Record<string, unknown>) => void;

interface LeveledLog {
  error: LogFn;
  info: LogFn;
  warn: LogFn;
}

// `log` is `console` (dev/test) or the Logtail logger (prod); both expose
// info/warn/error as (message, context).
const leveled = log as unknown as LeveledLog;

export interface PaymentLog {
  error: LogFn;
  info: LogFn;
  warn: LogFn;
}

/**
 * Build a logger bound to a payment context. Every call merges the canonical
 * order/roaster/org keys with any per-call extra fields.
 *
 *   const plog = createPaymentLog({ orderId, orderNumber, roasterId, orgId });
 *   plog.error("payout transfer failed", { stage: "roaster_transfer" });
 */
export function createPaymentLog(context: PaymentLogContext): PaymentLog {
  const base: Record<string, unknown> = {
    order_id: context.orderId ?? null,
    order_number: context.orderNumber ?? null,
    org_id: context.orgId ?? null,
    roaster_id: context.roasterId ?? null,
  };

  const at =
    (level: keyof LeveledLog): LogFn =>
    (message, extra) =>
      leveled[level](message, { ...base, ...extra });

  return { error: at("error"), info: at("info"), warn: at("warn") };
}
