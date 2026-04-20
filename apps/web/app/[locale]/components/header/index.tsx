"use client";

import type { Dictionary } from "@repo/internationalization";
import { Menu, Moon, MoveRight, Sun, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface HeaderProps {
  dictionary: Dictionary;
  locale: string;
}

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "For orgs", href: "/#for-orgs" },
  { label: "For roasters", href: "/#for-roasters" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      aria-label={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="flex h-9 w-9 items-center justify-center rounded-[var(--jp-radius-sm)] text-[var(--jp-muted)] transition-colors hover:bg-[var(--jp-bg-alt)] hover:text-[var(--jp-text)]"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      type="button"
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export const Header = ({ dictionary: _dictionary, locale }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = `/${locale}/account`;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-shadow duration-300 ${
        isScrolled ? "shadow-[var(--jp-shadow-sm)]" : ""
      }`}
      style={{
        backgroundColor: "var(--jp-nav-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "var(--jp-nav-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10 lg:px-16">
        {/* Logo */}
        <Link className="flex items-center gap-2.5" href="/">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--jp-radius-sm)] bg-jp-terra">
            <span className="font-bold font-display text-sm text-white">
              JP
            </span>
          </div>
          <span className="font-bold font-display text-[var(--jp-text)] text-lg">
            Joe Perks
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              className="rounded-[var(--jp-radius-sm)] px-3 py-2 font-body font-medium text-[var(--jp-muted)] text-sm transition-colors hover:text-[var(--jp-text)]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            className="hidden items-center rounded-[var(--jp-radius-md)] border border-[var(--jp-border-dark)] px-4 py-2 font-body font-semibold text-[var(--jp-text)] text-sm transition-colors hover:bg-[var(--jp-bg-alt)] md:inline-flex"
            href={accountHref}
          >
            Account
          </Link>

          <Link
            className="hidden items-center gap-2 rounded-[var(--jp-radius-md)] bg-jp-terra px-4 py-2 font-body font-semibold text-sm text-white shadow-[var(--jp-shadow-sm)] transition-all hover:-translate-y-px hover:bg-jp-terra-dark hover:shadow-[0_6px_20px_rgba(212,96,58,0.35)] md:inline-flex"
            href="/orgs/apply"
          >
            Get started
            <MoveRight size={14} />
          </Link>

          {/* Mobile hamburger */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--jp-radius-sm)] text-[var(--jp-text)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="border-t md:hidden"
          style={{
            backgroundColor: "var(--jp-bg-page)",
            borderColor: "var(--jp-border)",
          }}
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                className="rounded-[var(--jp-radius-sm)] px-3 py-3 font-body font-medium text-[var(--jp-text)] text-base transition-colors hover:bg-[var(--jp-bg-alt)]"
                href={link.href}
                key={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                className="flex items-center justify-center rounded-[var(--jp-radius-md)] border px-4 py-3 font-body font-semibold text-[var(--jp-text)] text-sm"
                href={accountHref}
                onClick={() => setMobileOpen(false)}
                style={{ borderColor: "var(--jp-border-dark)" }}
              >
                Your account
              </Link>
              <Link
                className="flex items-center justify-center gap-2 rounded-[var(--jp-radius-md)] bg-jp-terra px-4 py-3 font-body font-semibold text-sm text-white"
                href="/orgs/apply"
                onClick={() => setMobileOpen(false)}
              >
                Start your fundraiser
                <MoveRight size={14} />
              </Link>
              <Link
                className="flex items-center justify-center gap-2 rounded-[var(--jp-radius-md)] border px-4 py-3 font-body font-semibold text-[var(--jp-text)] text-sm"
                href="/roasters/apply"
                onClick={() => setMobileOpen(false)}
                style={{ borderColor: "var(--jp-border-dark)" }}
              >
                Apply as a roaster
                <MoveRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
