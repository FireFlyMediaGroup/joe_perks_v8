import Link from "next/link";

interface BackToOrdersLinkProps {
  readonly locale: string;
}

export function BackToOrdersLink({ locale }: BackToOrdersLinkProps) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 font-medium text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={`/${locale}/account?focus=orders-heading`}
    >
      Back to order history
    </Link>
  );
}
