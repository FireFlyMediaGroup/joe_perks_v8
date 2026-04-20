"use client";

import { useActionState } from "react";
import { updateDisputeFault } from "../_actions/update-dispute-fault";
import {
  initialUpdateDisputeFaultState,
  type UpdateDisputeFaultState,
} from "../_actions/update-dispute-fault-state";

const FAULT_OPTIONS = [
  { label: "Not set", value: "" },
  { label: "Roaster", value: "ROASTER" },
  { label: "Platform", value: "PLATFORM" },
  { label: "Buyer fraud", value: "BUYER_FRAUD" },
  { label: "Unclear", value: "UNCLEAR" },
] as const;

export function FaultAttributionForm(props: {
  currentFault: "" | "BUYER_FRAUD" | "PLATFORM" | "ROASTER" | "UNCLEAR";
  disputeId: string;
}) {
  const [state, formAction, isPending] = useActionState<
    UpdateDisputeFaultState,
    FormData
  >(updateDisputeFault, initialUpdateDisputeFaultState);
  let statusMessage: React.ReactNode = null;

  if (state.ok) {
    statusMessage = (
      <p className="text-emerald-700 text-xs dark:text-emerald-300">
        {state.message}
      </p>
    );
  } else if (state.error) {
    statusMessage = (
      <p className="text-red-600 text-xs dark:text-red-400">{state.error}</p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input name="disputeId" type="hidden" value={props.disputeId} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Fault attribution
        </span>
        <select
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          defaultValue={props.currentFault}
          name="faultAttribution"
          required
        >
          {FAULT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Note (optional)
        </span>
        <textarea
          className="min-h-20 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          maxLength={2000}
          name="note"
          placeholder="Why this attribution was chosen"
        />
      </label>
      <button
        className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-4 py-2 font-medium text-sm text-white disabled:cursor-wait disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Save fault"}
      </button>
      {statusMessage}
    </form>
  );
}
