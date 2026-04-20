interface OrgReviewDetailsProps {
  readonly contactName: string;
  readonly description: string | null;
  readonly desiredOrgPct: number;
  readonly desiredSlug: string;
  readonly email: string;
  readonly orgName: string;
  readonly phone: string | null;
}

function pctLabel(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

export function OrgReviewDetails({
  orgName,
  contactName,
  email,
  phone,
  description,
  desiredSlug,
  desiredOrgPct,
}: OrgReviewDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl text-zinc-950 dark:text-zinc-50">
          Review organization application
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Joe Perks forwarded this request to you. Approve to partner with this
          organization, or decline if you cannot take on this fundraiser.
        </p>
      </div>

      <dl className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div>
          <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
            Organization
          </dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
            {orgName}
          </dd>
        </div>
        {description ? (
          <div>
            <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {description}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
            Storefront URL
          </dt>
          <dd className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
            joeperks.com/{desiredSlug}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
            Requested fundraiser share
          </dt>
          <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            {pctLabel(desiredOrgPct)} of product sales (per campaign settings)
          </dd>
        </div>
        <div>
          <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
            Primary contact
          </dt>
          <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            {contactName}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
            Email
          </dt>
          <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            {email}
          </dd>
        </div>
        {phone ? (
          <div>
            <dt className="font-medium text-xs text-zinc-500 uppercase tracking-wide">
              Phone
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {phone}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
