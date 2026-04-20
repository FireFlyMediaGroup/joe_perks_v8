import { database } from "@joe-perks/db";
import type { ApplicationStatus } from "@joe-perks/db/generated/client";
import Link from "next/link";

import { RoasterApplicationQueue } from "./_components/roaster-application-queue";
import { parseQueuePage, ROASTER_QUEUE_PAGE_SIZE } from "./_lib/queue-url";

const DEFAULT_STATUS: ApplicationStatus = "PENDING_REVIEW";

function parseStatusParam(raw: string | undefined): ApplicationStatus {
  if (raw === "APPROVED" || raw === "REJECTED" || raw === "PENDING_REVIEW") {
    return raw;
  }
  return DEFAULT_STATUS;
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminRoasterApprovalsPage({
  searchParams,
}: PageProps) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const activeStatus = parseStatusParam(statusParam);

  const totalCount = await database.roasterApplication.count({
    where: { status: activeStatus },
  });

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / ROASTER_QUEUE_PAGE_SIZE)
  );
  const requestedPage = parseQueuePage(pageParam);
  const page = Math.min(requestedPage, totalPages);

  const applications = await database.roasterApplication.findMany({
    where: { status: activeStatus },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ROASTER_QUEUE_PAGE_SIZE,
    take: ROASTER_QUEUE_PAGE_SIZE,
  });

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <Link
          className="font-medium text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          href="/"
        >
          ← Admin home
        </Link>
        <h1 className="mt-4 font-semibold text-2xl text-zinc-900">
          Roaster applications
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Review submissions from the public roaster application form. Approve
          to create the roaster account and notify the applicant.
        </p>
      </div>

      <RoasterApplicationQueue
        activeStatus={activeStatus}
        applications={applications}
        page={page}
        pageSize={ROASTER_QUEUE_PAGE_SIZE}
        totalCount={totalCount}
      />
    </main>
  );
}
