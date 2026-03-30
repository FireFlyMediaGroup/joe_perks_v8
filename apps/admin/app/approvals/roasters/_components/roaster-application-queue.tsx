import type {
  ApplicationStatus,
  RoasterApplication,
} from "@joe-perks/db/generated/client";
import Link from "next/link";

import { buildRoasterQueueHref } from "../_lib/queue-url";

const STATUS_FILTERS: { value: ApplicationStatus; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function badgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-900 ring-amber-600/20";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-600/20";
    case "REJECTED":
      return "bg-red-100 text-red-900 ring-red-600/20";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-600/20";
  }
}

function formatSubmittedAt(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

interface Props {
  activeStatus: ApplicationStatus;
  applications: RoasterApplication[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export function RoasterApplicationQueue({
  applications,
  activeStatus,
  page,
  pageSize,
  totalCount,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const isActive = activeStatus === value;
          const href = buildRoasterQueueHref(value, 1);
          return (
            <Link
              className={`rounded-full px-4 py-2 font-medium text-sm ring-1 transition ${
                isActive
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
              }`}
              href={href}
              key={value}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {totalCount === 0 ? (
        <p className="text-muted-foreground text-sm">
          No applications in this view.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-600">
            Showing{" "}
            <span className="font-medium text-zinc-900">
              {rangeStart}–{rangeEnd}
            </span>{" "}
            of <span className="font-medium text-zinc-900">{totalCount}</span>
          </p>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-zinc-200 border-b bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {applications.map((row) => (
                  <tr className="hover:bg-zinc-50/80" key={row.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.businessName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.email}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.city}, {row.state}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {formatSubmittedAt(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 font-medium text-xs ring-1 ${badgeClass(row.status)}`}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                        href={`/approvals/roasters/${row.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-4 border-zinc-200 border-t pt-4"
          >
            <p className="text-sm text-zinc-600">
              Page <span className="font-medium text-zinc-900">{page}</span> of{" "}
              <span className="font-medium text-zinc-900">{totalPages}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {page > 1 ? (
                <Link
                  className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-sm text-zinc-900 hover:bg-zinc-50"
                  href={buildRoasterQueueHref(activeStatus, page - 1)}
                >
                  Previous
                </Link>
              ) : (
                <span className="min-h-11 cursor-not-allowed rounded-md border border-zinc-200 px-4 py-2 font-medium text-sm text-zinc-400">
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <Link
                  className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-sm text-zinc-900 hover:bg-zinc-50"
                  href={buildRoasterQueueHref(activeStatus, page + 1)}
                >
                  Next
                </Link>
              ) : (
                <span className="min-h-11 cursor-not-allowed rounded-md border border-zinc-200 px-4 py-2 font-medium text-sm text-zinc-400">
                  Next
                </span>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
