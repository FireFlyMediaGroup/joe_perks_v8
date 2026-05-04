"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DashboardRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 py-2 font-medium text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      type="button"
    >
      {isPending ? "Refreshing..." : "Refresh dashboard"}
    </button>
  );
}
