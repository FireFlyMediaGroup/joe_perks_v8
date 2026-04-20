import { cn } from "@repo/design-system/lib/utils";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-jp-display",
  weight: ["400", "700", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-jp-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-jp-mono-family",
  weight: ["400", "500"],
  display: "swap",
});

export const marketingFonts = cn(
  playfair.variable,
  dmSans.variable,
  dmMono.variable
);
