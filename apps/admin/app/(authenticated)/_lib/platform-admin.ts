interface PlatformAdminUser {
  isPlatformAdmin: boolean;
  role: string;
}

export function isPlatformAdminUser(user: PlatformAdminUser | null): boolean {
  return Boolean(
    user && (user.role === "PLATFORM_ADMIN" || user.isPlatformAdmin)
  );
}
