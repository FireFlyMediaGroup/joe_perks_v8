import { AlertTriangle } from "lucide-react";

export function ShippingGuard() {
  return (
    <output className="block border-jp-terra/20 border-b bg-jp-terra/5 px-4 py-3">
      <div className="container mx-auto flex max-w-6xl items-start gap-3">
        <AlertTriangle
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-jp-terra"
        />
        <div>
          <p className="font-body font-semibold text-jp-text text-sm leading-snug">
            This store is temporarily unavailable for purchases
          </p>
          <p className="mt-1 font-body text-jp-muted text-sm leading-relaxed">
            The roaster has not configured shipping rates yet. Please check back
            soon — purchases will open once shipping is set up.
          </p>
        </div>
      </div>
    </output>
  );
}
