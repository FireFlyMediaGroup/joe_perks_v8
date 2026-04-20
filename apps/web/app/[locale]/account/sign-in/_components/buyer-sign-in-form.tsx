"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface BuyerSignInFormProps {
  readonly locale: string;
  readonly redirect: string;
}

const EMAIL_ERROR = "Enter a valid email address.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function BuyerSignInForm({ locale, redirect }: BuyerSignInFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submittedEmail) {
      successHeadingRef.current?.focus();
    }
  }, [submittedEmail]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(EMAIL_ERROR);
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/account/sign-in", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          locale,
          redirect,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "We couldn't send a sign-in link right now.");
        return;
      }

      setSubmittedEmail(trimmedEmail);
    } catch {
      setError("We couldn't send a sign-in link right now.");
    } finally {
      setIsPending(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-3 text-green-700">
          <MailCheck className="h-6 w-6" />
          <h1
            className="font-semibold text-2xl text-foreground outline-none"
            ref={successHeadingRef}
            tabIndex={-1}
          >
            Check your email
          </h1>
        </div>
        <p className="mt-4 text-muted-foreground text-sm leading-6">
          If an order is associated with <strong>{submittedEmail}</strong>,
          we&apos;ve sent a secure sign-in link. It expires in 15 minutes.
        </p>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Keep this tab open if you want to return to the same place after you
          sign in.
        </p>
        <Button
          className="mt-6 min-h-[44px] w-full"
          onClick={() => {
            setSubmittedEmail(null);
            setEmail("");
          }}
          type="button"
          variant="outline"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  const describedBy = error
    ? "buyer-sign-in-hint buyer-sign-in-error"
    : "buyer-sign-in-hint";

  return (
    <form
      aria-busy={isPending}
      className="rounded-2xl border bg-background p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl text-foreground">
          Buyer sign-in
        </h1>
        <p className="text-muted-foreground text-sm leading-6">
          Sign in with the email from your order to view order history,
          tracking, and faster future access.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="buyer-email">Email address</Label>
        <Input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          className="min-h-[44px]"
          id="buyer-email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
        <p className="text-muted-foreground text-xs" id="buyer-sign-in-hint">
          We&apos;ll email you a secure sign-in link. No password required.
        </p>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm outline-none"
          id="buyer-sign-in-error"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          {error}
        </div>
      ) : null}

      <Button
        className="mt-6 min-h-[44px] w-full"
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
  );
}
