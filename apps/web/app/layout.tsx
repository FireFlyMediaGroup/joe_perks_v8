import "./styles.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import { cn } from "@repo/design-system/lib/utils";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import type { ReactNode } from "react";
import { marketingFonts } from "@/lib/fonts";
import { Footer } from "./components/footer";
import { Header } from "./components/header";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProperties) => {
  return (
    <html
      className={cn(fonts, marketingFonts, "scroll-smooth")}
      lang="en"
      suppressHydrationWarning
    >
      <body className="bg-jp-bg-page text-jp-text">
        <AnalyticsProvider>
          <DesignSystemProvider>
            <Header />
            {children}
            <Footer />
          </DesignSystemProvider>
          <Toolbar />
        </AnalyticsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
