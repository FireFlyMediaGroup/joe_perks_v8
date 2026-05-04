import { database } from "@joe-perks/db";
import type { ApplicationStatus } from "@joe-perks/db/generated/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApproveRejectButtons } from "../_components/approve-reject-buttons";

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

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoasterApplicationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const application = await database.roasterApplication.findUnique({
    where: { id },
  });

  if (!application) {
    notFound();
  }

  const canAct = application.status === "PENDING_REVIEW";

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        className="font-medium text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
        href="/approvals/roasters"
      >
        ← Back to queue
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-zinc-900">
            {application.businessName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Application ID: {application.id}
          </p>
        </div>
        <span
          className={`inline-flex rounded-md px-3 py-1 font-medium text-xs ring-1 ${badgeClass(application.status)}`}
        >
          {application.status.replace(/_/g, " ")}
        </span>
      </div>

      <section className="mt-8 space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Contact
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-xs text-zinc-500">Email</dt>
            <dd className="mt-1 text-zinc-900">{application.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Contact name</dt>
            <dd className="mt-1 text-zinc-900">{application.contactName}</dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Phone</dt>
            <dd className="mt-1 text-zinc-900">{application.phone ?? "—"}</dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Business
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="font-medium text-xs text-zinc-500">Website</dt>
            <dd className="mt-1 text-zinc-900">{application.website ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-xs text-zinc-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-900">
              {application.description ?? "—"}
            </dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Location
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-xs text-zinc-500">City</dt>
            <dd className="mt-1 text-zinc-900">{application.city}</dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">State</dt>
            <dd className="mt-1 text-zinc-900">{application.state}</dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Coffee
        </h2>
        <div>
          <dt className="font-medium text-xs text-zinc-500">Coffee info</dt>
          <dd className="mt-1 whitespace-pre-wrap text-zinc-900">
            {application.coffeeInfo ?? "—"}
          </dd>
        </div>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Terms
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-xs text-zinc-500">Terms version</dt>
            <dd className="mt-1 text-zinc-900">{application.termsVersion}</dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Agreed at</dt>
            <dd className="mt-1 text-zinc-900">
              {formatDate(application.termsAgreedAt)}
            </dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Meta
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-xs text-zinc-500">Submitted</dt>
            <dd className="mt-1 text-zinc-900">
              {formatDate(application.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Updated</dt>
            <dd className="mt-1 text-zinc-900">
              {formatDate(application.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Decision
        </h2>
        <ApproveRejectButtons applicationId={application.id} canAct={canAct} />
        {canAct ? null : (
          <p className="mt-3 text-sm text-zinc-600">
            This application has already been processed. Approve and reject
            actions are disabled.
          </p>
        )}
      </section>
    </main>
  );
}
