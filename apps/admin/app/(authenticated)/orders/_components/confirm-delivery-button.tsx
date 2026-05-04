"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { confirmDelivery } from "../_actions/confirm-delivery";

export function ConfirmDeliveryButton({
  orderId,
}: {
  readonly orderId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 font-medium text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      disabled={pending}
      onClick={() => {
        if (
          // biome-ignore lint/suspicious/noAlert: MVP admin confirmation before delivery
          !confirm(
            "Mark this order as delivered? Payout eligibility will be set from now."
          )
        ) {
          return;
        }
        startTransition(async () => {
          const r = await confirmDelivery(orderId);
          if (!r.ok) {
            // biome-ignore lint/suspicious/noAlert: MVP admin error surface
            alert(r.error);
            return;
          }
          router.refresh();
        });
      }}
      type="button"
    >
      {pending ? "Saving…" : "Confirm delivery"}
    </button>
  );
}
