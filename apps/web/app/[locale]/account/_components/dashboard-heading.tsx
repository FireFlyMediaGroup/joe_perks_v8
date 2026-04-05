"use client";

import { useEffect, useRef } from "react";

interface DashboardHeadingProps {
  readonly buyerEmail: string;
  readonly shouldAutoFocus: boolean;
}

export function DashboardHeading({
  buyerEmail,
  shouldAutoFocus,
}: DashboardHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (shouldAutoFocus) {
      headingRef.current?.focus();
    }
  }, [shouldAutoFocus]);

  return (
    <header className="space-y-2">
      <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.18em]">
        Buyer account
      </p>
      <h1
        className="font-bold text-3xl text-foreground tracking-tight outline-none sm:text-4xl"
        id="account-orders-heading"
        ref={headingRef}
        tabIndex={-1}
      >
        Your orders
      </h1>
      <p className="max-w-2xl text-muted-foreground text-sm leading-6 sm:text-base">
        Signed in as{" "}
        <span className="font-medium text-foreground">{buyerEmail}</span>. Review
        past orders, see fundraiser impact, and keep track of what you&apos;ve
        supported.
      </p>
    </header>
  );
}
