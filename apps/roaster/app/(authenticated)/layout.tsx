import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import { auth, currentUser } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { extractRouterConfig } from "uploadthing/server";
import { roasterFileRouter } from "@/app/api/uploadthing/core";
import { env } from "@/env";

import { NotificationsProvider } from "./components/notifications-provider";
import { GlobalSidebar } from "./components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  const user = await currentUser();
  const { redirectToSignIn } = await auth();
  const betaFeature = await showBetaFeature();

  if (!user) {
    return redirectToSignIn();
  }

  const dbUser = await database.user.findUnique({
    select: { roasterId: true },
    where: { externalAuthId: user.id },
  });

  const [roaster, latestSuspension] = dbUser?.roasterId
    ? await Promise.all([
        database.roaster.findUnique({
          select: { status: true },
          where: { id: dbUser.roasterId },
        }),
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: { in: ["ROASTER_AUTO_SUSPENDED", "ROASTER_SUSPENDED"] },
            targetId: dbUser.roasterId,
            targetType: "ROASTER",
          },
        }),
      ])
    : [null, null];

  const suspensionReason =
    roaster?.status === "SUSPENDED" && latestSuspension
      ? getSuspensionReasonLabel(
          getSuspensionReasonCategoryFromAction(latestSuspension)
        )
      : null;

  return (
    <NotificationsProvider userId={user.id}>
      <Suspense>
        <NextSSRPlugin routerConfig={extractRouterConfig(roasterFileRouter)} />
      </Suspense>
      <SidebarProvider>
        <GlobalSidebar>
          {betaFeature && (
            <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
              Beta feature now available
            </div>
          )}
          {roaster?.status === "SUSPENDED" ? (
            <div className="m-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 text-sm">
              Account suspended: {suspensionReason ?? "Account review"}. New
              orders and catalog/shipping updates are blocked until review is
              complete.
            </div>
          ) : null}
          {children}
        </GlobalSidebar>
      </SidebarProvider>
    </NotificationsProvider>
  );
};

export default AppLayout;
