const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;
const LOCALE_SEGMENT_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;

export function getBuyerDefaultRedirectPath(locale: string): string {
  return `/${locale}`;
}

export function buildBuyerSignInPath(
  locale: string,
  redirect?: string | null
): string {
  const safeRedirect = sanitizeBuyerRedirect(locale, redirect);
  const params = new URLSearchParams({ redirect: safeRedirect });
  return `/${locale}/account/sign-in?${params.toString()}`;
}

export function sanitizeBuyerRedirect(
  locale: string,
  redirect?: string | null
): string {
  const fallback = getBuyerDefaultRedirectPath(locale);
  if (!redirect) {
    return fallback;
  }

  const trimmed = redirect.trim();
  if (!trimmed || ABSOLUTE_URL_PATTERN.test(trimmed) || trimmed.startsWith("//")) {
    return fallback;
  }

  const parsed = new URL(trimmed, "https://joeperks.local");
  let pathname = parsed.pathname;

  if (!pathname.startsWith("/")) {
    return fallback;
  }

  if (pathname === "/") {
    pathname = `/${locale}`;
  } else if (!(pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && LOCALE_SEGMENT_PATTERN.test(firstSegment)) {
      return fallback;
    }
    pathname = `/${locale}${pathname}`;
  }

  return `${pathname}${parsed.search}${parsed.hash}`;
}
