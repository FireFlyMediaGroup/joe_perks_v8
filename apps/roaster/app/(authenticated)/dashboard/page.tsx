import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

export default async function RoasterDashboardPage() {
  const { userId } = await auth();
  const dbUser = userId
    ? await database.user.findUnique({
        where: { externalAuthId: userId },
        select: { roasterId: true, email: true, role: true },
      })
    : null;

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Order queue + metrics — portal queries must scope by{" "}
        <code className="font-mono text-xs">roaster_id</code> from the linked{" "}
        <code className="font-mono text-xs">User</code> row.
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Linked roaster_id</dt>
          <dd className="font-mono">{dbUser?.roasterId ?? "—"}</dd>
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
    </div>
  );
}
