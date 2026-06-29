import { redirect } from "next/navigation";
import { getCurrentBuyer } from "@/lib/buyer-auth/current-buyer";
import { sanitizeBuyerRedirect } from "@/lib/buyer-auth/redirect";
import { BuyerSignInForm } from "./_components/buyer-sign-in-form";

interface BuyerSignInPageProps {
  readonly searchParams: Promise<{ redirect?: string }>;
}

export default async function BuyerSignInPage({
  searchParams,
}: BuyerSignInPageProps) {
  const { redirect: rawRedirect } = await searchParams;
  const redirectTarget = sanitizeBuyerRedirect(rawRedirect);

  const buyer = await getCurrentBuyer();
  if (buyer) {
    redirect(redirectTarget);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-md">
        <BuyerSignInForm redirect={redirectTarget} />
      </div>
    </main>
  );
}
