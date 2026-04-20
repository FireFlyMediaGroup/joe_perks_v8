import { Loader2 } from "lucide-react";

export function OrderProcessing() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Loader2
        aria-hidden
        className="size-10 animate-spin text-[#D4603A]"
      />
      <div>
        <p className="font-semibold text-foreground text-lg">
          Processing your payment…
        </p>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          Please wait while we confirm your order with the payment provider.
        </p>
      </div>
    </div>
  );
}
