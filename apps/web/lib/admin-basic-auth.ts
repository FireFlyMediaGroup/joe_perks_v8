/** Same credentials as `apps/admin` HTTP Basic (PLATFORM_ADMIN MVP). */
import {
  getAdminBasicAuthCredentials,
  parseBasicAuthHeader,
  verifyAdminBasicAuthHeader,
} from "@joe-perks/types";

export function parseBasicAuth(
  header: string | null
): { user: string; pass: string } | null {
  return parseBasicAuthHeader(header);
}

export function getAdminBasicAuth() {
  return getAdminBasicAuthCredentials();
}

export function verifyAdminBasicAuth(request: Request): boolean {
  return verifyAdminBasicAuthHeader(request.headers.get("authorization"));
}
