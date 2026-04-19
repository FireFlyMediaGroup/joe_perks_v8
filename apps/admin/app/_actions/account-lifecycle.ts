"use server";

import {
  database,
  getSuspensionReasonLabel,
  type OrgStatus,
  parseSuspensionReasonCategory,
  type RoasterStatus,
} from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  ACCOUNT_REACTIVATED_SUBJECT,
  AccountReactivatedEmail,
} from "@joe-perks/email/templates/account-reactivated";
import {
  ACCOUNT_SUSPENDED_SUBJECT,
  AccountSuspendedEmail,
} from "@joe-perks/email/templates/account-suspended";
import { getAdminActorLabel } from "@joe-perks/types";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import { getAccountReactivationReadiness } from "../_lib/account-reactivation";

import type { AccountLifecycleState } from "./account-lifecycle-state";

const OPEN_ORDER_STATUSES = ["CONFIRMED", "SHIPPED"] as const;
const ORG_APP_ORIGIN_DEFAULT = "http://localhost:3002";
const ROASTER_APP_ORIGIN_DEFAULT = "http://localhost:3001";
const TRAILING_SLASH = /\/$/;

type LifecycleTargetType = "ORG" | "ROASTER";

interface LoadedLifecycleTarget {
  accountName: string;
  chargesEnabled: boolean;
  email: string;
  openDisputesCount: number;
  openOrderCount: number;
  payoutsEnabled: boolean;
  status: OrgStatus | RoasterStatus;
  stripeOnboarding: "COMPLETE" | "NOT_STARTED" | "PENDING" | "RESTRICTED";
  targetId: string;
  targetType: LifecycleTargetType;
  unsettledDebtCount: number;
}

function parseTargetType(
  raw: FormDataEntryValue | null
): LifecycleTargetType | null {
  return raw === "ROASTER" || raw === "ORG" ? raw : null;
}

function normalizeOrigin(origin: string | undefined, fallback: string): string {
  return (origin?.trim() || fallback).replace(TRAILING_SLASH, "");
}

function getDashboardUrl(targetType: LifecycleTargetType): string {
  if (targetType === "ROASTER") {
    return `${normalizeOrigin(process.env.ROASTER_APP_ORIGIN, ROASTER_APP_ORIGIN_DEFAULT)}/dashboard`;
  }

  return `${normalizeOrigin(process.env.ORG_APP_ORIGIN, ORG_APP_ORIGIN_DEFAULT)}/dashboard`;
}

function getAccountTypeLabel(targetType: LifecycleTargetType): string {
  return targetType === "ROASTER" ? "roaster" : "organization";
}

function formatStatusLabel(status: OrgStatus | RoasterStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function revalidateTargetPaths(
  targetType: LifecycleTargetType,
  targetId: string
) {
  const basePath = targetType === "ROASTER" ? "/roasters" : "/orgs";
  revalidatePath("/");
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${targetId}`);
}

async function loadLifecycleTarget(
  targetType: LifecycleTargetType,
  targetId: string
): Promise<LoadedLifecycleTarget | null> {
  if (targetType === "ROASTER") {
    const roaster = await database.roaster.findUnique({
      include: {
        application: {
          select: { businessName: true },
        },
      },
      where: { id: targetId },
    });

    if (!roaster) {
      return null;
    }

    const [openDisputesCount, openOrderCount, unsettledDebtCount] =
      await Promise.all([
        database.disputeRecord.count({
          where: {
            order: { roasterId: roaster.id },
            outcome: null,
          },
        }),
        database.order.count({
          where: {
            roasterId: roaster.id,
            status: { in: [...OPEN_ORDER_STATUSES] },
          },
        }),
        database.roasterDebt.count({
          where: {
            roasterId: roaster.id,
            settled: false,
          },
        }),
      ]);

    return {
      accountName: roaster.application.businessName || roaster.email,
      chargesEnabled: roaster.chargesEnabled,
      email: roaster.email,
      openDisputesCount,
      openOrderCount,
      payoutsEnabled: roaster.payoutsEnabled,
      status: roaster.status,
      stripeOnboarding: roaster.stripeOnboarding,
      targetId: roaster.id,
      targetType,
      unsettledDebtCount,
    };
  }

  const org = await database.org.findUnique({
    include: {
      application: {
        select: { orgName: true },
      },
    },
    where: { id: targetId },
  });

  if (!org) {
    return null;
  }

  const [openDisputesCount, openOrderCount] = await Promise.all([
    database.disputeRecord.count({
      where: {
        order: { campaign: { orgId: org.id } },
        outcome: null,
      },
    }),
    database.order.count({
      where: {
        campaign: { orgId: org.id },
        status: { in: [...OPEN_ORDER_STATUSES] },
      },
    }),
  ]);

  return {
    accountName: org.application.orgName || org.slug,
    chargesEnabled: org.chargesEnabled,
    email: org.email,
    openDisputesCount,
    openOrderCount,
    payoutsEnabled: org.payoutsEnabled,
    status: org.status,
    stripeOnboarding: org.stripeOnboarding,
    targetId: org.id,
    targetType,
    unsettledDebtCount: 0,
  };
}

export async function suspendAccount(
  _prevState: AccountLifecycleState,
  formData: FormData
): Promise<AccountLifecycleState> {
  const targetId = String(formData.get("targetId") ?? "").trim();
  const targetType = parseTargetType(formData.get("targetType"));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 2000);
  const reasonCategory = parseSuspensionReasonCategory(
    formData.get("reasonCategory")
  );

  if (!targetId) {
    return { error: "Missing account target.", message: null, ok: false };
  }

  if (!targetType) {
    return { error: "Missing account target.", message: null, ok: false };
  }

  if (!reasonCategory) {
    return {
      error: "Choose a suspension reason category.",
      message: null,
      ok: false,
    };
  }

  if (!note) {
    return {
      error: "Add an audit note explaining the suspension.",
      message: null,
      ok: false,
    };
  }

  const target = await loadLifecycleTarget(targetType, targetId);
  if (!target) {
    return { error: "Account not found.", message: null, ok: false };
  }

  if (target.status === "SUSPENDED") {
    return {
      error: null,
      message: "Account is already suspended.",
      ok: true,
    };
  }

  const actorLabel = getAdminActorLabel();
  const actionType =
    targetType === "ROASTER" ? "ROASTER_SUSPENDED" : "ORG_SUSPENDED";

  const actionLog = await database.$transaction(async (tx) => {
    if (targetType === "ROASTER") {
      await tx.roaster.update({
        data: { status: "SUSPENDED" },
        where: { id: targetId },
      });
    } else {
      await tx.org.update({
        data: { status: "SUSPENDED" },
        where: { id: targetId },
      });
    }

    return tx.adminActionLog.create({
      data: {
        actionType,
        actorLabel,
        note,
        payload: {
          accountName: target.accountName,
          afterStatus: "SUSPENDED",
          beforeStatus: target.status,
          reasonCategory,
        },
        targetId,
        targetType,
      },
    });
  });

  try {
    await sendEmail({
      entityId: actionLog.id,
      entityType: targetType.toLowerCase(),
      react: createElement(AccountSuspendedEmail, {
        accountName: target.accountName,
        accountTypeLabel: getAccountTypeLabel(targetType),
        loginUrl: getDashboardUrl(targetType),
        reasonLabel: getSuspensionReasonLabel(reasonCategory),
      }),
      subject: ACCOUNT_SUSPENDED_SUBJECT,
      template: "account_suspended",
      to: target.email,
    });
  } catch {
    console.error("account suspension email failed", {
      target_id: targetId,
      target_type: targetType,
    });
  }

  revalidateTargetPaths(targetType, targetId);

  return {
    error: null,
    message: `${target.accountName} is now suspended.`,
    ok: true,
  };
}

export async function submitSuspendAccount(formData: FormData): Promise<void> {
  await suspendAccount({ error: null, message: null, ok: false }, formData);
}

export async function reactivateAccount(
  _prevState: AccountLifecycleState,
  formData: FormData
): Promise<AccountLifecycleState> {
  const targetId = String(formData.get("targetId") ?? "").trim();
  const targetType = parseTargetType(formData.get("targetType"));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 2000);
  const confirmReactivation = formData.get("confirmReactivation") === "on";
  const confirmOverride = formData.get("confirmOverride") === "on";

  if (!targetId) {
    return { error: "Missing account target.", message: null, ok: false };
  }

  if (!targetType) {
    return { error: "Missing account target.", message: null, ok: false };
  }

  if (!confirmReactivation) {
    return {
      error: "Confirm the reactivation decision before saving.",
      message: null,
      ok: false,
    };
  }

  const target = await loadLifecycleTarget(targetType, targetId);
  if (!target) {
    return { error: "Account not found.", message: null, ok: false };
  }

  if (target.status !== "SUSPENDED") {
    return {
      error: null,
      message: "Account is not currently suspended.",
      ok: true,
    };
  }

  const readiness = getAccountReactivationReadiness({
    chargesEnabled: target.chargesEnabled,
    openDisputesCount: target.openDisputesCount,
    openOrderCount: target.openOrderCount,
    payoutsEnabled: target.payoutsEnabled,
    stripeOnboarding: target.stripeOnboarding,
    unsettledDebtCount: target.unsettledDebtCount,
  });

  if (readiness.requiresOverride && !confirmOverride) {
    return {
      error:
        "This account still has blockers. Check the override box to proceed anyway.",
      message: null,
      ok: false,
    };
  }

  if (readiness.requiresOverride && !note) {
    return {
      error: "Add an audit note when overriding remaining blockers.",
      message: null,
      ok: false,
    };
  }

  const actorLabel = getAdminActorLabel();
  const actionType =
    targetType === "ROASTER" ? "ROASTER_REACTIVATED" : "ORG_REACTIVATED";

  const actionLog = await database.$transaction(async (tx) => {
    if (targetType === "ROASTER") {
      await tx.roaster.update({
        data: { status: readiness.nextStatus as RoasterStatus },
        where: { id: targetId },
      });
    } else {
      await tx.org.update({
        data: { status: readiness.nextStatus as OrgStatus },
        where: { id: targetId },
      });
    }

    return tx.adminActionLog.create({
      data: {
        actionType,
        actorLabel,
        note: note || null,
        payload: {
          accountName: target.accountName,
          afterStatus: readiness.nextStatus,
          beforeStatus: target.status,
          blockers: readiness.blockers,
          overrideConfirmed: confirmOverride,
          stripeRequirements: readiness.stripeRequirements,
        },
        targetId,
        targetType,
      },
    });
  });

  try {
    await sendEmail({
      entityId: actionLog.id,
      entityType: targetType.toLowerCase(),
      react: createElement(AccountReactivatedEmail, {
        accountName: target.accountName,
        accountTypeLabel: getAccountTypeLabel(targetType),
        loginUrl: getDashboardUrl(targetType),
        nextStatusLabel: formatStatusLabel(readiness.nextStatus),
      }),
      subject: ACCOUNT_REACTIVATED_SUBJECT,
      template: "account_reactivated",
      to: target.email,
    });
  } catch {
    console.error("account reactivation email failed", {
      target_id: targetId,
      target_type: targetType,
    });
  }

  revalidateTargetPaths(targetType, targetId);

  return {
    error: null,
    message:
      readiness.nextStatus === "ACTIVE"
        ? `${target.accountName} is active again.`
        : `${target.accountName} was removed from suspension and moved to onboarding.`,
    ok: true,
  };
}

export async function submitReactivateAccount(
  formData: FormData
): Promise<void> {
  await reactivateAccount({ error: null, message: null, ok: false }, formData);
}
