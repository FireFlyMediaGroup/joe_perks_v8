import type { Metadata } from "next";
import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Joe Perks Admin",
  description: "Platform administration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${fonts} h-full`} lang="en" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
