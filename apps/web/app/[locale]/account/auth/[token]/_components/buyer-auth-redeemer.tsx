"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildBuyerSignInPath } from "@/lib/buyer-auth/redirect";

interface BuyerAuthRedeemerProps {
  readonly locale: string;
  readonly redirect: string;
  readonly token: string;
}

type RedeemState =
  | { status: "loading" }
  | { status: "error"; code: RedeemErrorCode };

type RedeemErrorCode = "expired" | "invalid" | "retry" | "used";

function getRedeemErrorCode(code?: string): RedeemErrorCode {
  if (code === "expired" || code === "used" || code === "invalid") {
    return code;
  }
  return "retry";
}

function getRedeemCopy(code: RedeemErrorCode): {
  description: string;
  title: string;
} {
  switch (code) {
    case "expired":
      return {
        title: "This sign-in link expired",
        description: "Request a new link to keep going.",
      };
    case "used":
      return {
        title: "This sign-in link was already used",
        description: "For security, each sign-in link works only once.",
      };
    case "invalid":
      return {
        title: "This sign-in link is invalid",
        description: "The link may be incomplete or no longer valid.",
      };
    default:
      return {
        title: "We couldn't finish sign-in",
        description: "Try again, or request a fresh sign-in link.",
      };
  }
}

export function BuyerAuthRedeemer({
  locale,
  redirect,
  token,
}: BuyerAuthRedeemerProps) {
  const router = useRouter();
  const [state, setState] = useState<RedeemState>({ status: "loading" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (state.status === "error") {
      headingRef.current?.focus();
    }
  }, [state]);

  const redeem = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/account/auth/redeem", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json().catch(() => null)) as {
        code?: string;
        redirect?: string;
      } | null;

      if (response.ok) {
        if (isMountedRef.current) {
          router.replace(data?.redirect || redirect);
        }
        return;
      }

      if (isMountedRef.current) {
        setState({
          status: "error",
          code: getRedeemErrorCode(data?.code),
        });
      }
    } catch {
      if (isMountedRef.current) {
        setState({ status: "error", code: "retry" });
      }
    }
  }, [redirect, router, token]);

  useEffect(() => {
    redeem();
  }, [redeem]);

  if (state.status === "loading") {
    return (
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="font-semibold text-2xl text-foreground">
          Signing you in...
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-6">
          We&apos;re verifying your secure sign-in link and taking you back to
          your account.
        </p>
        <output
          aria-live="polite"
          className="mt-6 inline-flex items-center gap-2 text-muted-foreground text-sm"
        >
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          Please wait a moment.
        </output>
      </div>
    );
  }

  const { description, title } = getRedeemCopy(state.code);

  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      <h1
        className="font-semibold text-2xl text-foreground outline-none"
        ref={headingRef}
        tabIndex={-1}
      >
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground text-sm leading-6">
        {description}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button asChild className="min-h-[44px] w-full">
          <Link href={buildBuyerSignInPath(locale, redirect)}>
            Request a new sign-in link
          </Link>
        </Button>
        {state.code === "retry" ? (
          <Button
            className="min-h-[44px] w-full"
            onClick={() => {
              redeem();
            }}
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
