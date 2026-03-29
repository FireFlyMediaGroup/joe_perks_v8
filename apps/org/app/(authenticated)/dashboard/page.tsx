import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

export default async function OrgDashboardPage() {
  const { userId } = await auth();
  const dbUser = userId
    ? await database.user.findUnique({
        where: { externalAuthId: userId },
        select: { orgId: true, email: true, role: true },
      })
    : null;

  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="font-semibold text-2xl">Org dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Campaign overview — queries use tenant scope from the verified session
        (`org_id` from the linked `User` row).
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Linked org_id</dt>
          <dd className="font-mono">{dbUser?.orgId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-mono">{dbUser?.role ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">User email (DB)</dt>
          <dd className="font-mono">{dbUser?.email ?? "—"}</dd>
        </div>
      </dl>
    </main>
  );
}
