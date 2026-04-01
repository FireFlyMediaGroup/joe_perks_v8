import { database } from "@joe-perks/db";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrgApproveRejectButtons } from "../_components/approve-reject-buttons";
import { OrgApplicationDetailSection } from "../_components/org-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrgApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [application, platformSettings] = await Promise.all([
    database.orgApplication.findUnique({
      where: { id },
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
    }),
    database.platformSettings.findUnique({
      where: { id: "singleton" },
    }),
  ]);

  if (!application) {
    notFound();
  }

  const canAct = application.status === "PENDING_PLATFORM_REVIEW";

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        className="font-medium text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
        href="/approvals/orgs"
      >
        ← Back to queue
      </Link>

      <OrgApplicationDetailSection
        application={application}
        platformSettings={platformSettings}
      />

      <section className="mt-8">
        <h2 className="mb-3 font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Decision
        </h2>
        <OrgApproveRejectButtons applicationId={application.id} canAct={canAct} />
        {canAct ? null : (
          <p className="mt-3 text-sm text-zinc-600">
            This application has already left platform review. Approve and
            reject actions are only available while status is pending platform
            review.
          </p>
        )}
      </section>
    </main>
  );
}
