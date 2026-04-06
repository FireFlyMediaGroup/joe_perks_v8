"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  requestNewFulfillmentLink,
  type RequestNewLinkResult,
} from "../_actions/request-new-link";

interface Props {
  readonly token: string;
}

export function ExpiredLinkRecovery({ token }: Props) {
  const [result, setResult] = useState<RequestNewLinkResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const successRef = useRef<HTMLOutputElement | null>(null);

  useEffect(() => {
    if (result?.ok) {
      successRef.current?.focus();
      return;
    }

    if (result && !result.ok) {
      errorRef.current?.focus();
    }
  }, [result]);

  return (
    <div className="space-y-3">
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const nextResult = await requestNewFulfillmentLink(token);
            setResult(nextResult);
          });
        }}
        type="button"
      >
        {isPending ? "Sending a fresh link…" : "Request a new link"}
      </button>

      {result?.ok ? (
        <output
          aria-live="polite"
          className="block text-emerald-700 text-sm"
          ref={successRef}
          tabIndex={-1}
        >
          {result.message}
        </output>
      ) : null}
      {result && !result.ok ? (
        <p className="text-destructive text-sm" ref={errorRef} role="alert" tabIndex={-1}>
          {result.error}
        </p>
      ) : null}
    </div>
  );
}
