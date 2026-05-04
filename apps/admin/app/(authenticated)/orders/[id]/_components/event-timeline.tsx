import type { OrderEvent } from "@joe-perks/db";

const labels: Record<string, string> = {
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
  DISPUTE_CLOSED: "Dispute closed",
  DISPUTE_OPENED: "Dispute opened",
  FULFILLMENT_VIEWED: "Fulfillment viewed",
  NOTE_ADDED: "Note",
  ORDER_CONFIRMED: "Order confirmed",
  ORDER_CREATED: "Order created",
  PAYMENT_FAILED: "Payment failed",
  PAYMENT_INTENT_CREATED: "Payment started",
  PAYMENT_SUCCEEDED: "Payment succeeded",
  PAYOUT_FAILED: "Payout failed",
  PAYOUT_TRANSFERRED: "Payout transferred",
  REFUND_COMPLETED: "Refund completed",
  REFUND_INITIATED: "Refund initiated",
  SHIPPED: "Shipped",
  SLA_BREACH: "SLA breach",
  SLA_WARNING: "SLA warning",
};

export function EventTimeline({ events }: { readonly events: OrderEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-zinc-500">No events recorded yet.</p>;
  }

  return (
    <ol className="space-y-3 border-zinc-200 border-l pl-4 dark:border-zinc-800">
      {events.map((e) => (
        <li className="relative" key={e.id}>
          <div className="absolute top-1.5 -left-4 h-2 w-2 rounded-full bg-zinc-400" />
          <p className="font-medium text-sm">
            {labels[e.eventType] ?? e.eventType}
          </p>
          <p className="text-xs text-zinc-500">
            {e.createdAt.toLocaleString()} · {e.actorType}
            {e.actorId ? ` · ${e.actorId}` : ""}
          </p>
          {e.payload != null && typeof e.payload === "object" ? (
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-xs text-zinc-700 dark:bg-zinc-900">
              {JSON.stringify(e.payload, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
