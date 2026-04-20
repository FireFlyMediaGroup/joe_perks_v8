import type { Metadata } from "next";
import { RoasterApplyForm } from "./_components/roaster-apply-form";

export const metadata: Metadata = {
  title: "Apply as a Roaster — Joe Perks",
  description:
    "Partner with Joe Perks to sell your specialty coffee through fundraising campaigns. Apply today to join our network of artisan roasters.",
};

export default function RoastersApplyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-bold text-3xl tracking-tight">
          Roaster application
        </h1>
        <p className="mt-3 text-muted-foreground">
          Join Joe Perks as a roaster partner and sell your specialty coffee
          through local fundraising campaigns.
        </p>
      </div>
      <RoasterApplyForm />
    </main>
  );
}
