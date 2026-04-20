import type { ReactNode } from "react";
import { RotatingQuote } from "./rotating-quote";

const palettes = {
  teal: {
    badge: "#4A8C8C",
    glow: "rgba(74, 140, 140, 0.12)",
    glowFar: "rgba(74, 140, 140, 0.05)",
  },
  terra: {
    badge: "#D4603A",
    glow: "rgba(212, 96, 58, 0.12)",
    glowFar: "rgba(212, 96, 58, 0.05)",
  },
} as const;

interface AuthPageLayoutProps {
  accent: keyof typeof palettes;
  readonly children: ReactNode;
  portalName: string;
  themeToggle?: ReactNode;
}

export function AuthPageLayout({
  children,
  portalName,
  accent,
  themeToggle,
}: AuthPageLayoutProps) {
  const p = palettes[accent];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Mobile: compact branded header ── */}
      <div
        className="flex items-center gap-3 border-b px-6 py-4 lg:hidden"
        style={{
          backgroundColor: "var(--jp-bg-alt, #F8F5F0)",
          borderColor: "var(--jp-border, rgba(28,28,30,0.10))",
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: p.badge }}
        >
          <span className="font-bold text-sm text-white">JP</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-semibold text-lg"
            style={{ color: "var(--jp-text, #1C1C1E)" }}
          >
            Joe Perks
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--jp-muted, #6B6B70)" }}
          >
            {portalName}
          </span>
        </div>
        {themeToggle ? <div className="ml-auto">{themeToggle}</div> : null}
      </div>

      {/* ── Desktop: brand panel ── */}
      <div
        className="relative hidden h-full flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{ backgroundColor: "#1C1C1E" }}
      >
        {/* Accent gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              `radial-gradient(ellipse at 15% 90%, ${p.glow} 0%, transparent 55%)`,
              `radial-gradient(ellipse at 80% 10%, ${p.glowFar} 0%, transparent 55%)`,
            ].join(", "),
          }}
        />

        {/* Logo + portal name */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: p.badge,
              boxShadow: `0 4px 12px ${p.glow}`,
            }}
          >
            <span className="font-bold text-base text-white">JP</span>
          </div>
          <div>
            <p className="font-semibold text-lg text-white/90 tracking-tight">
              Joe Perks
            </p>
            <p className="text-white/50 text-xs uppercase tracking-wide">
              {portalName}
            </p>
          </div>
        </div>

        {/* Rotating coffee quote */}
        <div className="relative z-10 max-w-sm">
          <div
            className="mb-5 h-px w-10"
            style={{ backgroundColor: `${p.badge}55` }}
          />
          <div className="text-white/70">
            <RotatingQuote />
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div
        className="relative flex flex-1 items-center justify-center px-6 py-16 lg:px-16"
        style={{ backgroundColor: "var(--jp-bg-page, #FDF9F4)" }}
      >
        {themeToggle ? (
          <div className="absolute top-5 right-5 hidden lg:block">
            {themeToggle}
          </div>
        ) : null}
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
