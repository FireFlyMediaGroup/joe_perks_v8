"use server";

import { database, type PlatformSettings, type Prisma } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "../../_lib/require-platform-admin";
import {
  PLATFORM_SETTINGS_SINGLETON_ID,
  type ValidatedPlatformSettings,
  validatePlatformSettingsForm,
} from "../_lib/validate-platform-settings";

import type { UpdatePlatformSettingsState } from "./update-platform-settings-state";

function snapshot(s: PlatformSettings): Prisma.JsonObject {
  return {
    disputeFeeCents: s.disputeFeeCents,
    orgPctDefault: s.orgPctDefault,
    orgPctMax: s.orgPctMax,
    orgPctMin: s.orgPctMin,
    payoutHoldDays: s.payoutHoldDays,
    platformFeeFloor: s.platformFeeFloor,
    platformFeePct: s.platformFeePct,
    slaAutoRefundHours: s.slaAutoRefundHours,
    slaBreachHours: s.slaBreachHours,
    slaCriticalHours: s.slaCriticalHours,
    slaWarnHours: s.slaWarnHours,
    updatedAt: s.updatedAt.toISOString(),
  };
}

function snapshotFromValues(v: ValidatedPlatformSettings): Prisma.JsonObject {
  return {
    disputeFeeCents: v.disputeFeeCents,
    orgPctDefault: v.orgPctDefault,
    orgPctMax: v.orgPctMax,
    orgPctMin: v.orgPctMin,
    payoutHoldDays: v.payoutHoldDays,
    platformFeeFloor: v.platformFeeFloor,
    platformFeePct: v.platformFeePct,
    slaAutoRefundHours: v.slaAutoRefundHours,
    slaBreachHours: v.slaBreachHours,
    slaCriticalHours: v.slaCriticalHours,
    slaWarnHours: v.slaWarnHours,
  };
}

export async function updatePlatformSettings(
  _prevState: UpdatePlatformSettingsState,
  formData: FormData
): Promise<UpdatePlatformSettingsState> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return {
      errors: ["You are not authorized to update platform settings."],
      ok: false,
    };
  }

  const parsed = validatePlatformSettingsForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors, ok: false };
  }

  const noteRaw = String(formData.get("changeNote") ?? "").trim();
  const note = noteRaw.length > 0 ? noteRaw.slice(0, 2000) : null;

  const actorLabel = admin.admin.actorLabel;

  const before = await database.platformSettings.findUnique({
    where: { id: PLATFORM_SETTINGS_SINGLETON_ID },
  });

  if (!before) {
    return {
      errors: [
        "Platform settings row is missing. Run database seed or migrations.",
      ],
      ok: false,
    };
  }

  const values = parsed.values;

  try {
    await database.$transaction([
      database.platformSettings.update({
        where: { id: PLATFORM_SETTINGS_SINGLETON_ID },
        data: {
          disputeFeeCents: values.disputeFeeCents,
          orgPctDefault: values.orgPctDefault,
          orgPctMax: values.orgPctMax,
          orgPctMin: values.orgPctMin,
          payoutHoldDays: values.payoutHoldDays,
          platformFeeFloor: values.platformFeeFloor,
          platformFeePct: values.platformFeePct,
          slaAutoRefundHours: values.slaAutoRefundHours,
          slaBreachHours: values.slaBreachHours,
          slaCriticalHours: values.slaCriticalHours,
          slaWarnHours: values.slaWarnHours,
        },
      }),
      database.adminActionLog.create({
        data: {
          actionType: "PLATFORM_SETTINGS_UPDATED",
          actorLabel,
          note,
          payload: {
            after: snapshotFromValues(values),
            before: snapshot(before),
          },
          targetId: PLATFORM_SETTINGS_SINGLETON_ID,
          targetType: "PLATFORM_SETTINGS",
        },
      }),
    ]);
  } catch {
    return {
      errors: ["Could not save settings. Try again."],
      ok: false,
    };
  }

  revalidatePath("/settings");
  return {
    message:
      "Settings saved. New values apply to future checkouts, SLA jobs, and payout timing without a deploy.",
    ok: true,
  };
}
