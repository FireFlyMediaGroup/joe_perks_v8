import {
  getAdminBasicAuthCredentials,
  parseBasicAuthHeader,
} from "@joe-perks/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const credentials = getAdminBasicAuthCredentials();
  if (!credentials) {
    return new NextResponse("Admin credentials are not configured.", {
      status: 503,
    });
  }

  const parsed = parseBasicAuthHeader(request.headers.get("authorization"));
  if (
    !parsed ||
    parsed.user !== credentials.email ||
    parsed.pass !== credentials.password
  ) {
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
