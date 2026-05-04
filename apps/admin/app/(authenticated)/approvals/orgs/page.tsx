import { database } from "@joe-perks/db";
import type { OrgApplicationStatus } from "@joe-perks/db/generated/client";
import Link from "next/link";

import { OrgApplicationQueue } from "./_components/org-queue";
import { ORG_QUEUE_PAGE_SIZE, parseQueuePage } from "./_lib/queue-url";

const DEFAULT_STATUS: OrgApplicationStatus = "PENDING_PLATFORM_REVIEW";

function parseStatusParam(raw: string | undefined): OrgApplicationStatus {
  if (
    raw === "PENDING_PLATFORM_REVIEW" ||
    raw === "PENDING_ROASTER_APPROVAL" ||
    raw === "APPROVED" ||
    raw === "REJECTED"
  ) {
    return raw;
  }
  return DEFAULT_STATUS;
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminOrgApprovalsPage({
  searchParams,
}: PageProps) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const activeStatus = parseStatusParam(statusParam);

  const totalCount = await database.orgApplication.count({
    where: { status: activeStatus },
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / ORG_QUEUE_PAGE_SIZE));
  const requestedPage = parseQueuePage(pageParam);
  const page = Math.min(requestedPage, totalPages);

  const applications = await database.orgApplication.findMany({
    where: { status: activeStatus },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ORG_QUEUE_PAGE_SIZE,
    take: ORG_QUEUE_PAGE_SIZE,
    include: {
      roasterRequests: {
        orderBy: { priority: "asc" },
        include: {
          roaster: {
            include: {
              application: { select: { businessName: true } },
            },
          },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-8">
        <Link
          className="font-medium text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          href="/"
        >
          ← Admin home
        </Link>
        <h1 className="mt-4 font-semibold text-2xl text-zinc-900">
          Organization applications
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Review org fundraising applications. Approve to route the primary
          roaster a secure link to accept or decline the partnership.
        </p>
      </div>

      <OrgApplicationQueue
        activeStatus={activeStatus}
        applications={applications}
        page={page}
        pageSize={ORG_QUEUE_PAGE_SIZE}
        totalCount={totalCount}
      />
    </main>
  );
}
