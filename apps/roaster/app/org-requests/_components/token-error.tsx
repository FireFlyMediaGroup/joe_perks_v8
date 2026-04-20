import type { ReactNode } from "react";

export type TokenErrorVariant =
  | "invalid"
  | "expired"
  | "used"
  | "wrong_state"
  | "already_decided";

const titles: Record<TokenErrorVariant, string> = {
  invalid: "Link not valid",
  expired: "This link has expired",
  used: "This link was already used",
  wrong_state: "This request is no longer active",
  already_decided: "A decision was already recorded",
};

const bodies: Record<TokenErrorVariant, ReactNode> = {
  invalid:
    "We could not open this review page. The link may be incorrect or no longer available.",
  expired:
    "Review links expire after 72 hours. Please contact Joe Perks support if you still need to respond.",
  used: "This review link can only be used once. If you did not take this action, contact support.",
  wrong_state:
    "This organization application is not waiting for your review anymore.",
  already_decided:
    "This partnership request has already been approved or declined.",
};

interface TokenErrorProps {
  readonly variant: TokenErrorVariant;
}

export function TokenError({ variant }: TokenErrorProps) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-semibold text-2xl text-zinc-950 dark:text-zinc-50">
        {titles[variant]}
      </h1>
      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
        {bodies[variant]}
      </p>
    </main>
  );
}
