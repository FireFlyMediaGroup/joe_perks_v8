"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import { requireOrgId } from "../../_lib/require-org";

import type { RequestReactivationState } from "./request-reactivation-state";

export async function requestOrgReactivation(
  _prevState: RequestReactivationState,
  formData: FormData
): Promise<RequestReactivationState> {
  const session = await requireOrgId();
  if (!session.ok) {
    return {
      error: "You must be signed in as an organization admin.",
      message: null,
      ok: false,
    };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!note) {
    return {
      error: "Add a remediation note before submitting the request.",
      message: null,
      ok: false,
    };
  }

  const org = await database.org.findUnique({
    include: {
      application: {
        select: { orgName: true },
      },
    },
    where: { id: session.orgId },
  });

  if (!org) {
    return { error: "Organization not found.", message: null, ok: false };
  }

  if (org.status !== "SUSPENDED") {
    return {
      error: "This account is not suspended.",
      message: null,
      ok: false,
    };
  }

  await database.adminActionLog.create({
    data: {
      actionType: "ORG_REACTIVATION_REQUESTED",
      actorLabel: org.email,
      note,
      payload: {
        accountName: org.application.orgName || org.slug,
        requestSource: "org_portal",
      },
      targetId: org.id,
      targetType: "ORG",
    },
  });

  revalidatePath("/dashboard");

  return {
    error: null,
    message: "Request submitted. Joe Perks will review your account status.",
    ok: true,
  };
}
