import { redirect } from "next/navigation";
import { getCurrentBuyer } from "@/lib/buyer-auth/current-buyer";
import { sanitizeBuyerRedirect } from "@/lib/buyer-auth/redirect";
import { BuyerSignInForm } from "./_components/buyer-sign-in-form";

interface BuyerSignInPageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<{ redirect?: string }>;
}

export default async function BuyerSignInPage({
  params,
  searchParams,
}: BuyerSignInPageProps) {
  const { locale } = await params;
  const { redirect: rawRedirect } = await searchParams;
  const redirectTarget = sanitizeBuyerRedirect(locale, rawRedirect);

  const buyer = await getCurrentBuyer();
  if (buyer) {
    redirect(redirectTarget);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-md">
        <BuyerSignInForm locale={locale} redirect={redirectTarget} />
      </div>
    </main>
  );
}
