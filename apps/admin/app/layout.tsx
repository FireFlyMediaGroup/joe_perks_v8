import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Joe Perks Admin",
  description: "Platform administration (HTTP Basic Auth for MVP).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col">
        <header className="border-zinc-200 border-b bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-4 text-sm">
            <Link
              className="font-medium text-zinc-900 dark:text-zinc-50"
              href="/"
            >
              Admin home
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/orders"
            >
              Orders
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/disputes"
            >
              Disputes
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/approvals/roasters"
            >
              Roaster Approvals
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/approvals/orgs"
            >
              Org Approvals
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/roasters"
            >
              Roasters
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/orgs"
            >
              Orgs
            </Link>
            <Link
              className="text-zinc-600 underline dark:text-zinc-400"
              href="/settings"
            >
              Settings
            </Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
