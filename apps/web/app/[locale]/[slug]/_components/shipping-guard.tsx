import { AlertTriangle } from "lucide-react";

export function ShippingGuard() {
  return (
    <div
      className="border-[#D4603A]/40 bg-[#FDF9F4] px-4 py-3 text-[#5c2e20] dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-100"
      role="status"
    >
      <div className="container mx-auto flex max-w-6xl items-start gap-3">
        <AlertTriangle
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-[#D4603A] dark:text-orange-300"
        />
        <div>
          <p className="font-semibold text-sm leading-snug">
            This store is temporarily unavailable for purchases
          </p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">
            The roaster has not configured shipping rates yet. Please check back
            soon — purchases will open once shipping is set up.
          </p>
        </div>
      </div>
    </div>
  );
}
