import {
  submitReactivateAccount,
  submitSuspendAccount,
} from "../_actions/account-lifecycle";

type LifecycleTargetType = "ORG" | "ROASTER";
type LifecycleStatus = "ACTIVE" | "ONBOARDING" | "SUSPENDED";

const REASON_OPTIONS = [
  { label: "Disputes", value: "DISPUTES" },
  { label: "Debt", value: "DEBT" },
  { label: "Fulfillment", value: "FULFILLMENT" },
  { label: "Stripe readiness", value: "STRIPE" },
  { label: "Policy review", value: "POLICY" },
  { label: "Other", value: "OTHER" },
] as const;

export function AccountLifecycleControls({
  blockers,
  defaultCanReactivate,
  nextStatus,
  status,
  stripeRequirements,
  targetId,
  targetType,
}: {
  readonly blockers: string[];
  readonly defaultCanReactivate: boolean;
  readonly nextStatus: LifecycleStatus;
  readonly status: LifecycleStatus;
  readonly stripeRequirements: string[];
  readonly targetId: string;
  readonly targetType: LifecycleTargetType;
}) {
  const suspendAction = submitSuspendAccount;
  const reactivateAction = submitReactivateAccount;

  if (status === "SUSPENDED") {
    return (
      <form action={reactivateAction} className="space-y-4">
        <input name="targetId" type="hidden" value={targetId} />
        <input name="targetType" type="hidden" value={targetType} />

        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="font-medium text-sm">Reactivation outcome</p>
          <p className="mt-1 text-sm text-zinc-600">
            If approved now, this account will move to <strong>{nextStatus}</strong>.
          </p>
          {defaultCanReactivate ? (
            <p className="mt-2 text-emerald-700 text-sm">
              No blockers detected. Default reactivation will restore full access.
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="font-medium text-sm">Readiness checks</p>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">No operational blockers detected.</p>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          )}
          {stripeRequirements.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">Stripe readiness is healthy.</p>
          ) : (
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700">
              {stripeRequirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          )}
        </div>

        <label className="block space-y-1">
          <span className="font-medium text-sm">Optional admin note</span>
          <textarea
            className="min-h-[96px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            maxLength={2000}
            name="note"
            placeholder="Required when overriding blockers."
          />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input className="mt-1" name="confirmReactivation" type="checkbox" value="on" />
          <span>I have reviewed this account and want to remove the suspension.</span>
        </label>

        {blockers.length > 0 ? (
          <label className="flex items-start gap-2 text-sm">
            <input className="mt-1" name="confirmOverride" type="checkbox" value="on" />
            <span>
              Reactivate anyway even though blockers remain. This decision will be
              recorded in the admin audit log.
            </span>
          </label>
        ) : null}

        <button
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-sm text-white"
          type="submit"
        >
          Reactivate account
        </button>
      </form>
    );
  }

  return (
    <form action={suspendAction} className="space-y-4">
      <input name="targetId" type="hidden" value={targetId} />
      <input name="targetType" type="hidden" value={targetType} />

      <label className="block space-y-1">
        <span className="font-medium text-sm">Reason category</span>
        <select
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          defaultValue=""
          name="reasonCategory"
          required
        >
          <option disabled value="">
            Select a reason
          </option>
          {REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="font-medium text-sm">Required audit note</span>
        <textarea
          className="min-h-[96px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          maxLength={2000}
          name="note"
          placeholder="Explain what triggered the suspension and what must be fixed."
          required
        />
      </label>

      <button
        className="rounded-md bg-red-700 px-4 py-2 font-medium text-sm text-white"
        type="submit"
      >
        Suspend account
      </button>
    </form>
  );
}
