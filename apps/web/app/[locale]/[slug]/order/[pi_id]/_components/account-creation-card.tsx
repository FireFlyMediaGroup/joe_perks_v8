"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Loader2, MailCheck, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface AccountCreationCardProps {
  locale: string;
  maskedEmail: string;
  paymentIntentId: string;
  redirectPath: string;
  signedIn: boolean;
}

export function AccountCreationCard({
  locale,
  maskedEmail,
  paymentIntentId,
  redirectPath,
  signedIn,
}: AccountCreationCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (sent) {
      successHeadingRef.current?.focus();
    }
  }, [sent]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/account/sign-in/from-order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          locale,
          paymentIntentId,
          redirect: redirectPath,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "We couldn't send a sign-in link right now.");
        return;
      }

      setSent(true);
    } catch {
      setError("We couldn't send a sign-in link right now.");
    } finally {
      setIsPending(false);
    }
  }

  if (signedIn) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <Sparkles
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
          />
          <div>
            <h2 className="font-semibold text-foreground text-lg">
              Your buyer sign-in is ready
            </h2>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              You&apos;re already signed in with the email used for this order,
              so future buyer account features can recognize you without
              changing today&apos;s checkout flow.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (sent) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <MailCheck
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
          />
          <div>
            <h2
              className="font-semibold text-foreground text-lg outline-none"
              ref={successHeadingRef}
              tabIndex={-1}
            >
              Check your email
            </h2>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              We sent a secure sign-in link to {maskedEmail}. It expires in 15
              minutes.
            </p>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              Keep this tab open if you want to come back to this order after
              you sign in.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="font-semibold text-foreground text-lg">
          Save faster access for next time
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          We can email a secure sign-in link to {maskedEmail} so your future
          buyer account access is quicker. No password required.
        </p>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm outline-none"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          {error}
        </div>
      ) : null}

      <form aria-busy={isPending} className="mt-4" onSubmit={onSubmit}>
        <Button
          className="min-h-[44px] w-full"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Sending sign-in link...
            </>
          ) : (
            "Email me a sign-in link"
          )}
        </Button>
      </form>
    </section>
  );
}
