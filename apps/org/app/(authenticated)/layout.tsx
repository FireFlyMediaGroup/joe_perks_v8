import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import { auth, currentUser } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";

import { GlobalSidebar } from "./components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const user = await currentUser();
  const { redirectToSignIn } = await auth();

  if (!user) {
    return redirectToSignIn();
  }

  const dbUser = await database.user.findUnique({
    select: { orgId: true },
    where: { externalAuthId: user.id },
  });

  const [org, latestSuspension] = dbUser?.orgId
    ? await Promise.all([
        database.org.findUnique({
          select: { status: true },
          where: { id: dbUser.orgId },
        }),
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: "ORG_SUSPENDED",
            targetId: dbUser.orgId,
            targetType: "ORG",
          },
        }),
      ])
    : [null, null];

  const suspensionReason =
    org?.status === "SUSPENDED" && latestSuspension
      ? getSuspensionReasonLabel(
          getSuspensionReasonCategoryFromAction(latestSuspension)
        )
      : null;

  return (
    <SidebarProvider>
      <GlobalSidebar>
        {org?.status === "SUSPENDED" ? (
          <div className="m-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 text-sm">
            Account suspended: {suspensionReason ?? "Account review"}. Public
            storefront availability and new campaign activity are blocked until
            the review is complete.
          </div>
        ) : null}
        {children}
      </GlobalSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;
