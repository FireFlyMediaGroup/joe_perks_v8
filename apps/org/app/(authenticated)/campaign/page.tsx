import { database } from "@joe-perks/db";
import { redirect } from "next/navigation";

import { requireOrgId } from "../_lib/require-org";
import { CampaignForm } from "./_components/campaign-form";
import type { SerializedProduct } from "./_lib/catalog";

const GRIND_LABELS: Record<string, string> = {
  WHOLE_BEAN: "Whole bean",
  GROUND_DRIP: "Drip",
  GROUND_ESPRESSO: "Espresso",
  GROUND_FRENCH_PRESS: "French press",
};

function variantLabel(sizeOz: number, grind: string): string {
  const g = GRIND_LABELS[grind] ?? grind;
  return `${sizeOz} oz · ${g}`;
}

export default async function OrgCampaignPage() {
  const session = await requireOrgId();
  if (!session.ok) {
    redirect("/sign-in");
  }

  const org = await database.org.findUnique({
    where: { id: session.orgId },
    include: {
      application: true,
      campaigns: {
        orderBy: { updatedAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!org) {
    return (
      <main className="mx-auto max-w-prose p-8">
        <h1 className="font-semibold text-2xl">Campaign</h1>
        <p className="mt-2 text-muted-foreground">Organization not found.</p>
      </main>
    );
  }

  if (org.status !== "ACTIVE") {
    return (
      <main className="mx-auto max-w-prose p-8">
        <h1 className="font-semibold text-2xl">Campaign</h1>
        <p className="mt-2 text-muted-foreground">
          {org.status === "SUSPENDED" ? (
            <>
              Your account is suspended. Review the status guidance on{" "}
              <a className="text-primary underline" href="/dashboard">
                your dashboard
              </a>
              .
            </>
          ) : (
            <>
              Complete Stripe onboarding first.{" "}
              <a className="text-primary underline" href="/onboarding">
                Go to onboarding
              </a>
            </>
          )}
        </p>
      </main>
    );
  }

  const approvedRequest = await database.roasterOrgRequest.findFirst({
    where: { applicationId: org.applicationId, status: "APPROVED" },
    include: {
      roaster: { select: { id: true, email: true } },
    },
  });

  if (!approvedRequest) {
    return (
      <main className="mx-auto max-w-prose p-8">
        <h1 className="font-semibold text-2xl">Campaign</h1>
        <p className="mt-2 text-muted-foreground">
          No approved roaster partnership is on file. Contact support.
        </p>
      </main>
    );
  }

  const roasterId = approvedRequest.roasterId;

  const productsRaw = await database.product.findMany({
    where: {
      roasterId,
      deletedAt: null,
      status: "ACTIVE",
    },
    include: {
      variants: {
        where: { deletedAt: null, isAvailable: true },
        orderBy: [{ sizeOz: "asc" }, { grind: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const products: SerializedProduct[] = productsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    roastLevel: p.roastLevel,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: variantLabel(v.sizeOz, v.grind),
      retailPriceCents: v.retailPrice,
    })),
  }));

  const activeCampaign = org.campaigns.find((c) => c.status === "ACTIVE");
  const draftCampaign = org.campaigns.find((c) => c.status === "DRAFT");

  const orgPctPercent = org.application.desiredOrgPct * 100;

  if (activeCampaign) {
    return (
      <main className="mx-auto max-w-prose p-8">
        <h1 className="font-semibold text-2xl">Campaign</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Partner roaster: {approvedRequest.roaster.email}
        </p>
        <div className="mt-6">
          <CampaignForm
            campaignId={activeCampaign.id}
            initialGoalCents={activeCampaign.goalCents}
            initialItems={[]}
            initialName={activeCampaign.name}
            liveSummary={{
              goalCents: activeCampaign.goalCents,
              itemCount: activeCampaign.items.length,
              name: activeCampaign.name,
            }}
            orgPctPercent={orgPctPercent}
            products={products}
            readOnlyLive
          />
        </div>
      </main>
    );
  }

  const initialItems =
    draftCampaign?.items.map((i) => ({
      variantId: i.variantId,
      isFeatured: i.isFeatured,
    })) ?? [];

  return (
    <main className="mx-auto max-w-prose p-8">
      <h1 className="font-semibold text-2xl">Campaign</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Partner roaster: {approvedRequest.roaster.email}
      </p>
      <div className="mt-6">
        <CampaignForm
          campaignId={draftCampaign?.id ?? null}
          initialGoalCents={draftCampaign?.goalCents ?? null}
          initialItems={initialItems}
          initialName={draftCampaign?.name ?? ""}
          orgPctPercent={orgPctPercent}
          products={products}
          readOnlyLive={false}
        />
      </div>
    </main>
  );
}
