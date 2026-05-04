"use client";

import type { PlatformSettings } from "@joe-perks/db";
import { useActionState } from "react";

import { updatePlatformSettings } from "../_actions/update-platform-settings";
import { initialUpdatePlatformSettingsState } from "../_actions/update-platform-settings-state";

const TRAILING_DECIMAL_ZEROS_REGEX = /\.?0+$/;

function pctInputValue(p: number): string {
  return (p * 100).toFixed(2).replace(TRAILING_DECIMAL_ZEROS_REGEX, "");
}

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function FieldErrorList({ errors }: { readonly errors: readonly string[] }) {
  if (errors.length === 0) {
    return null;
  }

  const unique = Array.from(new Set(errors));

  return (
    <ul className="mt-2 list-inside list-disc space-y-1 text-red-600 text-sm dark:text-red-400">
      {unique.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

export function PlatformSettingsForm({
  settings,
}: {
  readonly settings: PlatformSettings;
}) {
  const [state, formAction, isPending] = useActionState(
    updatePlatformSettings,
    initialUpdatePlatformSettingsState
  );

  return (
    <form action={formAction} className="space-y-10">
      {state.ok ? (
        <output className="block rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {state.message}
        </output>
      ) : null}

      {!state.ok && state.errors.length > 0 ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40"
          role="alert"
        >
          <p className="font-medium text-red-900 text-sm dark:text-red-100">
            Fix the following before saving:
          </p>
          <FieldErrorList errors={state.errors} />
        </div>
      ) : null}

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold text-lg">Revenue &amp; fees</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Platform fee applies to product subtotal only (shipping is excluded).
          Amounts are stored in cents; display uses dollars for clarity.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="font-medium text-sm">
              Platform fee (% of product subtotal)
            </span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={pctInputValue(settings.platformFeePct)}
              inputMode="decimal"
              name="platformFeePctPercent"
              required
              step="any"
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Example: 5 for 5%. Used for new checkouts; existing orders keep
              frozen splits.
            </span>
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">
              Platform fee minimum ($)
            </span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={dollarsFromCents(settings.platformFeeFloor)}
              inputMode="decimal"
              min={0}
              name="platformFeeFloorDollars"
              required
              step="0.01"
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Floor in dollars (e.g. 1.00). Applied when the percentage fee
              would be lower.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold text-lg">Fundraiser (org) share bounds</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Campaigns choose an org percentage within these bounds. Defaults align
          with product expectations (often 5–25%).
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block space-y-1">
            <span className="font-medium text-sm">Minimum org share (%)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={pctInputValue(settings.orgPctMin)}
              inputMode="decimal"
              name="orgPctMinPercent"
              required
              step="any"
              type="number"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">Maximum org share (%)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={pctInputValue(settings.orgPctMax)}
              inputMode="decimal"
              name="orgPctMaxPercent"
              required
              step="any"
              type="number"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">Default org share (%)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={pctInputValue(settings.orgPctDefault)}
              inputMode="decimal"
              name="orgPctDefaultPercent"
              required
              step="any"
              type="number"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold text-lg">Fulfillment SLA thresholds</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Hours are measured from the order start anchor used by the hourly SLA
          job (relative to each order&apos;s fulfillment deadline). Reminder
          must be strictly before the breach window; breach, critical, and
          auto-refund must stay in ascending order.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="font-medium text-sm">Reminder (hours)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={settings.slaWarnHours}
              min={1}
              name="slaWarnHours"
              required
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Roaster reminder email tier.
            </span>
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">Breach window (hours)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={settings.slaBreachHours}
              min={1}
              name="slaBreachHours"
              required
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Defines the SLA timeline length; must be greater than reminder
              hours.
            </span>
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">
              Critical threshold (hours from order start)
            </span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={settings.slaCriticalHours}
              min={1}
              name="slaCriticalHours"
              required
              type="number"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">
              Auto-refund threshold (hours from order start)
            </span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={settings.slaAutoRefundHours}
              min={1}
              name="slaAutoRefundHours"
              required
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Full refund when the SLA job passes this point (requires Stripe
              configuration).
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold text-lg">Payouts &amp; disputes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="font-medium text-sm">
              Payout hold (days after delivery)
            </span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={settings.payoutHoldDays}
              min={0}
              name="payoutHoldDays"
              required
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Delays roaster/org transfers after delivery confirmation. 0 means
              no day-based hold.
            </span>
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-sm">Dispute fee ($)</span>
            <input
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              defaultValue={dollarsFromCents(settings.disputeFeeCents)}
              inputMode="decimal"
              min={0}
              name="disputeFeeDollars"
              required
              step="0.01"
              type="number"
            />
            <span className="text-xs text-zinc-500">
              Business rule for dispute-related platform charges (stored as
              cents).
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="font-semibold text-amber-950 text-lg dark:text-amber-100">
          Before you save
        </h2>
        <p className="mt-2 text-amber-950 text-sm dark:text-amber-100/90">
          Changes apply to <strong>future</strong> checkouts, SLA processing,
          and payout timing. Existing orders keep their frozen splits, deadlines
          already set, and recorded events.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
          <input
            className="mt-1"
            name="ackFutureImpact"
            required
            type="checkbox"
            value="on"
          />
          <span>
            I understand these settings affect future platform behavior, not
            historical orders.
          </span>
        </label>
        <label className="mt-4 block space-y-1">
          <span className="font-medium text-sm">
            Optional note for audit log
          </span>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            maxLength={2000}
            name="changeNote"
            placeholder="e.g. Raised SLA breach window per ops review."
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Stored with the admin audit entry (who / when / before vs after
            snapshot).
          </span>
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save platform settings"}
        </button>
        <p className="text-sm text-zinc-500">
          Last updated {settings.updatedAt.toLocaleString()}
        </p>
      </div>
    </form>
  );
}
