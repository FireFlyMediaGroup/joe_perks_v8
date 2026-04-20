import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { label: "Apply as an org", href: "/orgs/apply" },
      { label: "Apply as a roaster", href: "/roasters/apply" },
      { label: "Browse campaigns", href: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms/orgs" },
      { label: "Privacy", href: "/privacy-policy" },
    ],
  },
];

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export const Footer = () => (
  <footer style={{ backgroundColor: "#111010" }}>
    <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-8 md:px-10 lg:px-16">
      {/* Main grid */}
      <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <Link className="flex items-center gap-2.5" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--jp-radius-sm)] bg-jp-terra">
              <span className="font-bold font-display text-sm text-white">
                JP
              </span>
            </div>
            <span className="font-bold font-display text-lg text-white">
              Joe Perks
            </span>
          </Link>
          <p className="max-w-xs font-body text-sm text-white/50 leading-relaxed">
            Coffee fundraising that works. Connecting roasters with communities
            to fund what matters.
          </p>
          {/* Social icons */}
          <div className="mt-2 flex gap-1">
            <SocialIcon href="https://instagram.com" label="Instagram">
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <title>Instagram</title>
                <rect height="20" rx="5" width="20" x="2" y="2" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://x.com" label="X (Twitter)">
              <svg
                aria-hidden="true"
                fill="currentColor"
                height="14"
                viewBox="0 0 24 24"
                width="14"
              >
                <title>X</title>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://facebook.com" label="Facebook">
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <title>Facebook</title>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://linkedin.com" label="LinkedIn">
              <svg
                aria-hidden="true"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <title>LinkedIn</title>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect height="12" width="4" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </SocialIcon>
          </div>
        </div>

        {/* Link columns */}
        {footerColumns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 font-body font-semibold text-sm text-white/80">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    className="font-body text-sm text-white/40 transition-colors hover:text-white/70"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center justify-between gap-4 border-white/10 border-t pt-6 md:flex-row">
        <p className="font-body text-white/30 text-xs">
          &copy; {new Date().getFullYear()} Joe Perks. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            className="font-body text-white/30 text-xs transition-colors hover:text-white/50"
            href="/terms/orgs"
          >
            Terms
          </Link>
          <Link
            className="font-body text-white/30 text-xs transition-colors hover:text-white/50"
            href="/privacy-policy"
          >
            Privacy
          </Link>
          <span className="rounded-full bg-jp-terra/20 px-2 py-0.5 font-jp-mono font-medium text-[9px] text-jp-terra-light uppercase tracking-[0.10em]">
            MVP
          </span>
        </div>
      </div>
    </div>
  </footer>
);
