import { database } from "@joe-perks/db";

import { OrgApplyForm } from "./_components/org-apply-form";

export const metadata = {
  title: "Apply — Organization | Joe Perks",
  description:
    "Apply to run a fundraising campaign with Joe Perks. Choose a roaster partner, set your storefront URL, and start earning for your organization.",
};

export default async function OrgsApplyPage() {
  const [roasters, settings] = await Promise.all([
    database.roaster.findMany({
      where: { status: "ACTIVE" },
      include: {
        application: { select: { businessName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    database.platformSettings.findUniqueOrThrow({ where: { id: "singleton" } }),
  ]);

  const activeRoasters = roasters.map((r) => ({
    id: r.id,
    email: r.email,
    businessName: r.application.businessName,
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="font-semibold text-3xl tracking-tight">
          Apply to fundraise with Joe Perks
        </h1>
        <p className="mt-3 text-muted-foreground">
          Partner with a local roaster, create your storefront, and earn a
          percentage of every bag sold — at no cost to your organization.
        </p>
      </header>

      <OrgApplyForm
        orgPctDefault={settings.orgPctDefault}
        orgPctMax={settings.orgPctMax}
        orgPctMin={settings.orgPctMin}
        roasters={activeRoasters}
      />
    </main>
  );
}
