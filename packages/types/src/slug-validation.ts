import { RESERVED_SLUGS } from "./slugs";

/**
 * Slug format: lowercase a-z, digits 0-9, hyphens; 3-63 chars; no leading/trailing hyphens.
 * Matches DNS subdomain-safe labels.
 */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export function isValidSlugFormat(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}
