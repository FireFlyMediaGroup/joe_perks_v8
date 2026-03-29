import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function parseBasicAuth(
  header: string | null
): { user: string; pass: string } | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }
  try {
    const decoded = globalThis.atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) {
      return null;
    }
    return {
      user: decoded.slice(0, colon),
      pass: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!(email && password)) {
    return new NextResponse("Admin credentials are not configured.", {
      status: 503,
    });
  }

  const parsed = parseBasicAuth(request.headers.get("authorization"));
  if (!parsed || parsed.user !== email || parsed.pass !== password) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Joe Perks Admin"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
