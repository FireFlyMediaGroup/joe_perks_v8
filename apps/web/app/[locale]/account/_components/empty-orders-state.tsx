import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";

interface EmptyOrdersStateProps {
  readonly locale: string;
}

export function EmptyOrdersState({ locale }: EmptyOrdersStateProps) {
  return (
    <section
      aria-labelledby="buyer-empty-orders-heading"
      className="rounded-2xl border bg-card p-6 shadow-sm"
    >
      <h2
        className="font-semibold text-foreground text-xl tracking-tight"
        id="buyer-empty-orders-heading"
      >
        No orders yet
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-6">
        When you place an order with this email address, it will appear here so you
        can review the fundraiser impact and follow its status later.
      </p>
      <Button asChild className="mt-6 min-h-11 w-full touch-manipulation sm:w-auto">
        <Link href={`/${locale}`}>Browse campaigns</Link>
      </Button>
    </section>
  );
}
