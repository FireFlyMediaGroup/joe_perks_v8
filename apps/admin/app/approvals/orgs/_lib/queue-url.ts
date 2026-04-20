import type { OrgApplicationStatus } from "@joe-perks/db/generated/client";

const DEFAULT_STATUS: OrgApplicationStatus = "PENDING_PLATFORM_REVIEW";

/** Page size for `/approvals/orgs` list (URL `page` is 1-based). */
export const ORG_QUEUE_PAGE_SIZE = 20;

export function buildOrgQueueHref(
  status: OrgApplicationStatus,
  page: number
): string {
  const params = new URLSearchParams();
  if (status !== DEFAULT_STATUS) {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const q = params.toString();
  return q.length > 0 ? `/approvals/orgs?${q}` : "/approvals/orgs";
}

export function parseQueuePage(raw: string | undefined): number {
  if (raw === undefined || raw === "") {
    return 1;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return n;
}
