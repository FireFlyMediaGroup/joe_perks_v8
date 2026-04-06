"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { reportCantFulfill } from "../_actions/report-cant-fulfill";
import {
  CANT_FULFILL_REASONS,
  CANT_FULFILL_RESOLUTION_OFFERS,
} from "../_lib/cant-fulfill-options";

const MAX_NOTE_LENGTH = 500;

export function CantFulfillForm({ token }: { readonly token: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [resolutionOffered, setResolutionOffered] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-950 dark:bg-amber-950/20">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Can&apos;t fulfill this order?</h3>
        <p className="text-muted-foreground text-sm">
          Let Joe Perks know what is blocking shipment. We&apos;ll pause automated
          follow-up on this order until the issue is reviewed.
        </p>
      </div>

      {isOpen ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);

            startTransition(async () => {
              const result = await reportCantFulfill(
                token,
                reason,
                resolutionOffered,
                note
              );

              if (!result.ok) {
                setError(result.error);
                return;
              }

              router.refresh();
            });
          }}
        >
          {error ? (
            <p className="text-destructive text-sm" ref={errorRef} role="alert" tabIndex={-1}>
              {error}
            </p>
          ) : null}

          <label className="block space-y-1" htmlFor="cant-fulfill-reason">
            <span className="font-medium text-sm">What&apos;s the main issue?</span>
            <select
              className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="cant-fulfill-reason"
              onChange={(event) => setReason(event.target.value)}
              required
              value={reason}
            >
              <option value="">Choose a reason</option>
              {CANT_FULFILL_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1" htmlFor="cant-fulfill-resolution">
            <span className="font-medium text-sm">
              How should Joe Perks help next?
            </span>
            <select
              className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="cant-fulfill-resolution"
              onChange={(event) => setResolutionOffered(event.target.value)}
              required
              value={resolutionOffered}
            >
              <option value="">Choose the next step</option>
              {CANT_FULFILL_RESOLUTION_OFFERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1" htmlFor="cant-fulfill-note">
            <span className="font-medium text-sm">
              Note for Joe Perks (optional)
            </span>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="cant-fulfill-note"
              maxLength={MAX_NOTE_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything the support team should know before they contact you."
              value={note}
            />
            <div className="flex justify-between gap-3 text-muted-foreground text-xs">
              <span>You&apos;ll see a confirmation state after submission.</span>
              <span>{note.length}/{MAX_NOTE_LENGTH}</span>
            </div>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 font-medium text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              disabled={pending}
              type="submit"
            >
              {pending ? "Submitting…" : "Report issue"}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 font-medium text-sm"
              disabled={pending}
              onClick={() => {
                setError(null);
                setIsOpen(false);
              }}
              type="button"
            >
              Keep shipment flow open
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-amber-300 bg-white px-4 py-2 font-medium text-amber-950 text-sm hover:bg-amber-100 dark:border-amber-900 dark:bg-transparent dark:text-amber-100"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Report a fulfillment issue
          </button>
          <p className="max-w-xl text-muted-foreground text-sm">
            Use this only if you need Joe Perks support. Normal shipment updates
            should still go through the tracking form above.
          </p>
        </div>
      )}
    </section>
  );
}
