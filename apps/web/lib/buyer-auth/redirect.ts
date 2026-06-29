const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

export function getBuyerDefaultRedirectPath(): string {
  return "/account?focus=orders-heading";
}

export function buildBuyerSignInPath(redirect?: string | null): string {
  const safeRedirect = sanitizeBuyerRedirect(redirect);
  const params = new URLSearchParams({ redirect: safeRedirect });
  return `/account/sign-in?${params.toString()}`;
}

export function sanitizeBuyerRedirect(redirect?: string | null): string {
  const fallback = getBuyerDefaultRedirectPath();
  if (!redirect) {
    return fallback;
  }

  const trimmed = redirect.trim();
  if (
    !trimmed ||
    ABSOLUTE_URL_PATTERN.test(trimmed) ||
    trimmed.startsWith("//")
  ) {
    return fallback;
  }

  const parsed = new URL(trimmed, "https://joeperks.local");
  const pathname = parsed.pathname;

  if (!pathname.startsWith("/")) {
    return fallback;
  }

  return `${pathname}${parsed.search}${parsed.hash}`;
}
