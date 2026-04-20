"use client";

import { useActionState } from "react";

import { requestOrgReactivation } from "../_actions/request-reactivation";
import { initialRequestReactivationState } from "../_actions/request-reactivation-state";

export function ReactivationRequestForm() {
  const [state, formAction, isPending] = useActionState(
    requestOrgReactivation,
    initialRequestReactivationState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm">
          {state.message}
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900 text-sm">
          {state.error}
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="font-medium text-sm">Remediation note</span>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-zinc-300 bg-background px-3 py-2 text-sm"
          maxLength={2000}
          name="note"
          placeholder="Tell Joe Perks what changed: Stripe fixed, storefront issue resolved, open items addressed, etc."
          required
        />
      </label>

      <button
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background text-sm disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting…" : "Request reactivation"}
      </button>
    </form>
  );
}
