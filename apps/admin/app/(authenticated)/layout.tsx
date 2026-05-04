import { auth } from "@repo/auth/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { requirePlatformAdmin } from "./_lib/require-platform-admin";

interface AuthenticatedLayoutProps {
  readonly children: ReactNode;
}

const navItems = [
  { href: "/", label: "Admin home", primary: true },
  { href: "/orders", label: "Orders" },
  { href: "/disputes", label: "Disputes" },
  { href: "/approvals/roasters", label: "Roaster Approvals" },
  { href: "/approvals/orgs", label: "Org Approvals" },
  { href: "/roasters", label: "Roasters" },
  { href: "/orgs", label: "Orgs" },
  { href: "/settings", label: "Settings" },
];

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await requirePlatformAdmin();

  if (!session.ok && session.error === "unauthorized") {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  if (!session.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium text-sm text-zinc-500">Admin portal</p>
          <h1 className="mt-2 font-semibold text-2xl">Access denied</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Your Clerk account is signed in, but it has not been granted the
            Joe Perks platform admin role.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="border-zinc-200 border-b bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              className={
                item.primary
                  ? "font-medium text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 underline dark:text-zinc-400"
              }
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </>
  );
}
