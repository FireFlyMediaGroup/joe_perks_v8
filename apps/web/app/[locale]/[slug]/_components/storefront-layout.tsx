import type { ReactNode } from "react";

interface StorefrontLayoutProps {
  children: ReactNode;
}

/** Page shell for org-branded storefront; leaves room for US-04-05 shipping banner. */
export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
