"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { approveApplication } from "../_actions/approve-application";
import { rejectApplication } from "../_actions/reject-application";

interface Props {
  applicationId: string;
  canAct: boolean;
}

export function ApproveRejectButtons({ applicationId, canAct }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const approveDialogRef = useRef<HTMLDialogElement>(null);
  const rejectDialogRef = useRef<HTMLDialogElement>(null);

  if (!canAct) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="min-h-11 min-w-[7rem] rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          disabled={pending}
          onClick={() => {
            setError(null);
            approveDialogRef.current?.showModal();
          }}
          type="button"
        >
          Approve
        </button>
        <button
          className="min-h-11 min-w-[7rem] rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          disabled={pending}
          onClick={() => {
            setError(null);
            rejectDialogRef.current?.showModal();
          }}
          type="button"
        >
          Reject
        </button>
      </div>

      <dialog
        className="max-w-md rounded-lg border border-zinc-200 p-0 shadow-lg backdrop:bg-black/40"
        ref={approveDialogRef}
      >
        <div className="p-6">
          <h2 className="font-semibold text-lg text-zinc-900">
            Approve application
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            This will create the roaster and admin user records and send the
            approval email. The applicant can then sign in to the roaster
            portal.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-sm text-zinc-900 hover:bg-zinc-50"
              disabled={pending}
              onClick={() => approveDialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-md bg-emerald-700 px-4 py-2 font-medium text-sm text-white hover:bg-emerald-800 disabled:opacity-60"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await approveApplication(applicationId);
                  if (result.success) {
                    setError(null);
                    approveDialogRef.current?.close();
                    router.refresh();
                  } else {
                    setError(result.error);
                  }
                });
              }}
              type="button"
            >
              {pending ? "Working…" : "Confirm approve"}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        className="max-w-md rounded-lg border border-zinc-200 p-0 shadow-lg backdrop:bg-black/40"
        ref={rejectDialogRef}
      >
        <div className="p-6">
          <h2 className="font-semibold text-lg text-zinc-900">
            Reject application
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            This will mark the application as rejected and send a polite
            notification email.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              className="min-h-11 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-sm text-zinc-900 hover:bg-zinc-50"
              disabled={pending}
              onClick={() => rejectDialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-md bg-red-700 px-4 py-2 font-medium text-sm text-white hover:bg-red-800 disabled:opacity-60"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await rejectApplication(applicationId);
                  if (result.success) {
                    setError(null);
                    rejectDialogRef.current?.close();
                    router.refresh();
                  } else {
                    setError(result.error);
                  }
                });
              }}
              type="button"
            >
              {pending ? "Working…" : "Confirm reject"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
