"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  activateCampaign,
  saveCampaignDraft,
} from "../_actions/campaign-actions";
import type { SerializedProduct } from "../_lib/catalog";
import { ProductSelector, type SelectedItem } from "./product-selector";

interface CampaignFormProps {
  readonly campaignId: string | null;
  readonly initialGoalCents: number | null;
  readonly initialItems: SelectedItem[];
  readonly initialName: string;
  readonly liveSummary?: {
    name: string;
    goalCents: number | null;
    itemCount: number;
  };
  readonly orgPctPercent: number;
  readonly orgSlug?: string;
  readonly products: SerializedProduct[];
  readonly readOnlyLive: boolean;
}

function buildMap(items: SelectedItem[]): Map<string, SelectedItem> {
  const m = new Map<string, SelectedItem>();
  for (const row of items) {
    m.set(row.variantId, row);
  }
  return m;
}

export function CampaignForm({
  products,
  orgPctPercent,
  orgSlug,
  initialName,
  initialGoalCents,
  initialItems,
  campaignId: initialCampaignId,
  readOnlyLive,
  liveSummary,
}: CampaignFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [goalDollars, setGoalDollars] = useState(
    initialGoalCents != null ? (initialGoalCents / 100).toFixed(2) : ""
  );
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(() =>
    buildMap(initialItems)
  );
  const [campaignId, setCampaignId] = useState<string | null>(
    initialCampaignId
  );
  const [error, setError] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);

  const goalCentsParsed = useMemo(() => {
    const t = goalDollars.trim();
    if (!t) {
      return null;
    }
    const n = Number.parseFloat(t);
    if (!Number.isFinite(n) || n <= 0) {
      return undefined;
    }
    return Math.round(n * 100);
  }, [goalDollars]);

  if (readOnlyLive && liveSummary) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-green-700 text-sm dark:text-green-400">
          Your fundraiser is live. Buyers can shop your storefront at{" "}
          <span className="font-medium">
            joeperks.com/{orgSlug ?? "[your-org-slug]"}
          </span>
          .
        </p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Campaign</dt>
            <dd className="font-medium">{liveSummary.name}</dd>
          </div>
          {liveSummary.goalCents != null ? (
            <div>
              <dt className="text-muted-foreground">Goal</dt>
              <dd>${(liveSummary.goalCents / 100).toFixed(2)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Products</dt>
            <dd>{liveSummary.itemCount} variant(s)</dd>
          </div>
        </dl>
      </div>
    );
  }

  function toggleVariant(variantId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(variantId, { variantId, isFeatured: false });
      } else {
        next.delete(variantId);
      }
      return next;
    });
  }

  function toggleFeatured(variantId: string, featured: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      const row = next.get(variantId);
      if (row) {
        next.set(variantId, { ...row, isFeatured: featured });
      }
      return next;
    });
  }

  function handleSave() {
    setError(null);
    if (goalCentsParsed === undefined && goalDollars.trim() !== "") {
      setError("Enter a valid goal amount or leave it blank.");
      return;
    }
    const items = [...selected.values()];
    startTransition(async () => {
      const result = await saveCampaignDraft({
        name: name.trim(),
        goalCents: goalCentsParsed ?? null,
        items,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCampaignId(result.campaignId);
      router.refresh();
    });
  }

  function handleActivate() {
    setActivateError(null);
    const id = campaignId ?? initialCampaignId;
    if (!id) {
      setActivateError("Save your campaign first.");
      return;
    }
    startTransition(async () => {
      const result = await activateCampaign(id);
      if (!result.success) {
        setActivateError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-muted-foreground text-sm">
        Fundraiser share is set to{" "}
        <span className="font-medium text-foreground">
          {orgPctPercent.toFixed(1)}%
        </span>{" "}
        of each product sale (from your application).
      </p>

      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign name</Label>
        <Input
          id="campaign-name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-goal">Fundraising goal (USD, optional)</Label>
        <Input
          id="campaign-goal"
          inputMode="decimal"
          onChange={(e) => setGoalDollars(e.target.value)}
          placeholder="e.g. 5000.00"
          value={goalDollars}
        />
      </div>

      <div>
        <h2 className="mb-3 font-medium">Products from your roaster</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active products are available yet. Ask your roaster to add
            products in their portal.
          </p>
        ) : (
          <ProductSelector
            onToggleFeatured={toggleFeatured}
            onToggleVariant={toggleVariant}
            products={products}
            selected={selected}
          />
        )}
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pending || !name.trim()}
          onClick={handleSave}
          type="button"
        >
          {pending ? "Saving…" : "Save draft"}
        </Button>
        <Button
          disabled={pending}
          onClick={handleActivate}
          type="button"
          variant="secondary"
        >
          Activate campaign
        </Button>
      </div>

      {activateError ? (
        <p className="text-destructive text-sm" role="alert">
          {activateError}
        </p>
      ) : null}
    </div>
  );
}
