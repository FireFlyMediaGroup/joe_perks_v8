export interface ParsedBasicAuth {
  pass: string;
  user: string;
}

export function parseBasicAuthHeader(
  header: string | null
): ParsedBasicAuth | null {
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

export function getAdminBasicAuthCredentials():
  | { email: string; password: string }
  | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!(email && password)) {
    return null;
  }

  return { email, password };
}

export function verifyAdminBasicAuthHeader(header: string | null): boolean {
  const credentials = getAdminBasicAuthCredentials();
  if (!credentials) {
    return false;
  }

  const parsed = parseBasicAuthHeader(header);
  return Boolean(
    parsed &&
      parsed.user === credentials.email &&
      parsed.pass === credentials.password
  );
}
