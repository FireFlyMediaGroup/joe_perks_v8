import { database } from "@joe-perks/db";
import Link from "next/link";

export default async function AdminRoastersPage() {
  const [roasters, summary] = await Promise.all([
    database.roaster.findMany({
      include: {
        _count: {
          select: {
            debts: true,
            orders: true,
          },
        },
        application: {
          select: { businessName: true },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
    database.roaster.groupBy({
      _count: { _all: true },
      by: ["status"],
    }),
  ]);

  const activeCount = summary.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const suspendedCount =
    summary.find((row) => row.status === "SUSPENDED")?._count._all ?? 0;
  const onboardingCount =
    summary.find((row) => row.status === "ONBOARDING")?._count._all ?? 0;

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl">Roasters</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Lifecycle management for roaster accounts, dispute risk, and reactivation review.
          </p>
        </div>
        <Link className="text-sm text-zinc-600 underline" href="/">
          Home
        </Link>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-zinc-600">Active</p>
          <p className="mt-1 font-semibold text-2xl">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-zinc-600">Onboarding</p>
          <p className="mt-1 font-semibold text-2xl">{onboardingCount}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-zinc-600">Suspended</p>
          <p className="mt-1 font-semibold text-2xl">{suspendedCount}</p>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {roasters.map((roaster) => (
          <section
            className="rounded-lg border border-zinc-200 bg-white p-5"
            key={roaster.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-xl">
                  {roaster.application.businessName || roaster.email}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{roaster.email}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Stripe: {roaster.stripeOnboarding} · Disputes (90d):{" "}
                  {roaster.disputeCount90d}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                  {roaster.status}
                </span>
                <Link
                  className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 py-2 font-medium text-sm"
                  href={`/roasters/${roaster.id}`}
                >
                  Open details
                </Link>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <dt className="text-zinc-500">Orders</dt>
                <dd className="font-medium">{roaster._count.orders}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Debt items</dt>
                <dd className="font-medium">{roaster._count.debts}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Updated</dt>
                <dd className="font-medium">{roaster.updatedAt.toLocaleString()}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}
