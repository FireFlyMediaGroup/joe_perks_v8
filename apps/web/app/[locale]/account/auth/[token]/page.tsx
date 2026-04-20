import { sanitizeBuyerRedirect } from "@/lib/buyer-auth/redirect";
import { BuyerAuthRedeemer } from "./_components/buyer-auth-redeemer";

interface BuyerAuthPageProps {
  readonly params: Promise<{ locale: string; token: string }>;
  readonly searchParams: Promise<{ redirect?: string }>;
}

export default async function BuyerAuthPage({
  params,
  searchParams,
}: BuyerAuthPageProps) {
  const { locale, token } = await params;
  const { redirect } = await searchParams;
  const safeRedirect = sanitizeBuyerRedirect(locale, redirect);

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-md">
        <BuyerAuthRedeemer
          locale={locale}
          redirect={safeRedirect}
          token={token}
        />
      </div>
    </main>
  );
}
