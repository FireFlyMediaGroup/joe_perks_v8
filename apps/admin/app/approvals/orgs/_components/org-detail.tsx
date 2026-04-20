import type {
  OrgApplicationStatus,
  PlatformSettings,
} from "@joe-perks/db/generated/client";

import type { OrgApplicationQueueRow } from "./org-queue";

function badgeClass(status: OrgApplicationStatus): string {
  switch (status) {
    case "PENDING_PLATFORM_REVIEW":
      return "bg-amber-100 text-amber-900 ring-amber-600/20";
    case "PENDING_ROASTER_APPROVAL":
      return "bg-blue-100 text-blue-900 ring-blue-600/20";
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

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

interface Props {
  application: OrgApplicationQueueRow;
  platformSettings: PlatformSettings | null;
}

export function OrgApplicationDetailSection({
  application,
  platformSettings,
}: Props) {
  return (
    <>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-zinc-900">
            {application.orgName}
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
          Organization
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-xs text-zinc-500">
              Desired URL slug
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900">
              {application.desiredSlug}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">
              Requested fundraiser %
            </dt>
            <dd className="mt-1 text-zinc-900">
              {formatPct(application.desiredOrgPct)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-xs text-zinc-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-900">
              {application.description ?? "—"}
            </dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Platform settings (reference)
        </h2>
        <p className="text-sm text-zinc-600">
          Allowed fundraiser percentages for campaigns are set platform-wide.
        </p>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-xs text-zinc-500">Minimum</dt>
            <dd className="mt-1 text-zinc-900">
              {platformSettings ? formatPct(platformSettings.orgPctMin) : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Default</dt>
            <dd className="mt-1 text-zinc-900">
              {platformSettings
                ? formatPct(platformSettings.orgPctDefault)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-xs text-zinc-500">Maximum</dt>
            <dd className="mt-1 text-zinc-900">
              {platformSettings ? formatPct(platformSettings.orgPctMax) : "—"}
            </dd>
          </div>
        </dl>

        <h2 className="font-medium text-sm text-zinc-500 uppercase tracking-wide">
          Roaster selections
        </h2>
        {application.roasterRequests.length === 0 ? (
          <p className="text-sm text-zinc-600">No roaster requests on file.</p>
        ) : (
          <ul className="space-y-3">
            {application.roasterRequests.map((req) => (
              <li
                className="rounded-md border border-zinc-100 bg-zinc-50/80 px-4 py-3"
                key={req.id}
              >
                <p className="font-medium text-sm text-zinc-900">
                  {req.roaster.application.businessName}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Priority {req.priority}{" "}
                  {req.priority === 1 ? "(primary)" : "(backup)"} · Request
                  status: <span className="font-medium">{req.status}</span>
                </p>
              </li>
            ))}
          </ul>
        )}

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
              {application.termsAgreedAt
                ? formatDate(application.termsAgreedAt)
                : "—"}
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
    </>
  );
}
