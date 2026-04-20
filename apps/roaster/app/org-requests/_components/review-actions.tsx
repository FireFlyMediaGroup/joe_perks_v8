"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { useState, useTransition } from "react";

import type { ApproveOrgResult } from "../_actions/approve-org";
import { approveOrg } from "../_actions/approve-org";
import type { DeclineOrgResult } from "../_actions/decline-org";
import { declineOrg } from "../_actions/decline-org";

interface ReviewActionsProps {
  readonly token: string;
}

export function ReviewActions({ token }: ReviewActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<
    null | { type: "approved" } | { type: "declined"; backup: boolean }
  >(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res: ApproveOrgResult = await approveOrg(token);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setApproveOpen(false);
      setDone({ type: "approved" });
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const res: DeclineOrgResult = await declineOrg(token);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDeclineOpen(false);
      setDone({ type: "declined", backup: res.routedToBackup });
    });
  }

  if (done?.type === "approved") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="font-medium text-emerald-900 text-sm dark:text-emerald-100">
          You approved this organization. They will receive an email with next
          steps to sign in to the org portal.
        </p>
      </div>
    );
  }

  if (done?.type === "declined") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {done.backup
            ? "Your decline was recorded. If a backup roaster was listed, they will receive a review request by email."
            : "Your decline was recorded. The organization will be notified that we could not place them with a roaster partner."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <AlertDialog onOpenChange={setApproveOpen} open={approveOpen}>
          <AlertDialogTrigger asChild>
            <Button disabled={pending} type="button" variant="default">
              Approve partnership
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve this organization?</AlertDialogTitle>
              <AlertDialogDescription>
                This creates their org account and notifies them to complete
                Stripe onboarding and start a campaign on Joe Perks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button
                disabled={pending}
                onClick={() => handleApprove()}
                type="button"
              >
                {pending ? "Working…" : "Approve"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog onOpenChange={setDeclineOpen} open={declineOpen}>
          <AlertDialogTrigger asChild>
            <Button disabled={pending} type="button" variant="outline">
              Decline
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline this partnership?</AlertDialogTitle>
              <AlertDialogDescription>
                If you decline, we may contact a backup roaster if one was
                listed. Otherwise the organization will be notified that we
                could not proceed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button
                disabled={pending}
                onClick={() => handleDecline()}
                type="button"
                variant="outline"
              >
                {pending ? "Working…" : "Decline"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
