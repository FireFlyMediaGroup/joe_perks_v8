import { Coffee } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface StorefrontLayoutProps {
  children: ReactNode;
  locale?: string;
  orgName?: string;
  slug?: string;
}

export function StorefrontLayout({ children, locale }: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen bg-jp-bg-page">
      <main className="flex-1">{children}</main>

      <footer className="border-jp-border border-t bg-jp-bg-alt">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Coffee className="size-4 text-jp-terra" />
              <span className="font-body font-medium text-jp-text text-sm">
                Joe Perks
              </span>
            </div>
            <p className="max-w-md font-body text-jp-muted text-xs leading-relaxed">
              Every cup makes a difference. Specialty coffee fundraising that
              connects local organizations with craft roasters.
            </p>
            <div className="flex gap-4 font-body text-jp-light text-xs">
              <Link
                className="hover:text-jp-text"
                href={locale ? `/${locale}/legal/terms` : "/legal/terms"}
              >
                Terms
              </Link>
              <Link
                className="hover:text-jp-text"
                href={locale ? `/${locale}/legal/privacy` : "/legal/privacy"}
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
