"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { acknowledgeFlag } from "../_actions/acknowledge-flag";
import { resolveFlag } from "../_actions/resolve-flag";

export function FlagActionButtons({
  adminAcknowledgedFlag,
  orderId,
}: {
  readonly adminAcknowledgedFlag: boolean;
  readonly orderId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"acknowledge" | "resolve" | null>(
    null
  );
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function runAction(
    action: "acknowledge" | "resolve",
    fn: () => Promise<{ ok: boolean; error?: string }>
  ) {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        router.refresh();
        setPendingAction(null);
        return;
      }

      setError(result.error ?? "Something went wrong.");
      setPendingAction(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {adminAcknowledgedFlag ? null : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 py-2 font-medium text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100"
            disabled={pending}
            onClick={() =>
              runAction("acknowledge", () => acknowledgeFlag(orderId))
            }
            type="button"
          >
            {pending && pendingAction === "acknowledge"
              ? "Saving…"
              : "Acknowledge issue"}
          </button>
        )}
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 font-medium text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          disabled={pending}
          onClick={() => {
            if (
              // biome-ignore lint/suspicious/noAlert: MVP admin confirmation before resolving order flag
              !confirm("Resolve this fulfillment issue and resume manual handling?")
            ) {
              return;
            }
            runAction("resolve", () => resolveFlag(orderId));
          }}
          type="button"
        >
          {pending && pendingAction === "resolve" ? "Saving…" : "Resolve issue"}
        </button>
      </div>
      {error ? (
        <p className="text-rose-600 text-sm" ref={errorRef} role="alert" tabIndex={-1}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
