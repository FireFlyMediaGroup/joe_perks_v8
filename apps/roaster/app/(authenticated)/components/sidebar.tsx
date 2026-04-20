"use client";

import { UserButton, useUser } from "@repo/auth/client";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { NotificationsTrigger } from "@repo/notifications/components/trigger";
import {
  BanknoteIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  PackageIcon,
  TruckIcon,
  WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface GlobalSidebarProperties {
  readonly children: ReactNode;
}

const primaryNav: {
  title: string;
  url: string;
  icon: typeof LayoutDashboardIcon;
  match?: "exact" | "prefix";
}[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
    match: "exact",
  },
  {
    title: "Payments",
    url: "/onboarding",
    icon: CreditCardIcon,
    match: "prefix",
  },
  { title: "Products", url: "/products", icon: PackageIcon, match: "prefix" },
  {
    title: "Shipping",
    url: "/settings/shipping",
    icon: TruckIcon,
    match: "prefix",
  },
  { title: "Payouts", url: "/payouts", icon: BanknoteIcon, match: "prefix" },
  { title: "Webhooks", url: "/webhooks", icon: WebhookIcon, match: "prefix" },
];

function navItemIsActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix"
) {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <PackageIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Joe Perks</span>
                    <span className="truncate text-muted-foreground text-xs">
                      Roaster portal
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Portal</SidebarGroupLabel>
            <SidebarMenu>
              {primaryNav.map((item) => {
                const active = navItemIsActive(
                  pathname,
                  item.url,
                  item.match ?? "prefix"
                );
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      className={cn(active && "bg-sidebar-accent")}
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarAccountBlock isCollapsed={state === "collapsed"} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};

function SidebarAccountBlock({ isCollapsed }: { isCollapsed: boolean }) {
  const { isLoaded, user } = useUser();

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-sidebar-accent/30 p-3">
      <div className={cn("min-w-0", isCollapsed && "flex justify-center")}>
        {isCollapsed ? null : (
          <>
            <p className="truncate font-medium text-foreground text-sm">
              {isLoaded
                ? (user?.fullName ?? user?.username ?? "Signed in")
                : "…"}
            </p>
            <p
              className="mt-0.5 truncate text-muted-foreground text-xs"
              title={
                user?.primaryEmailAddress?.emailAddress ??
                user?.emailAddresses[0]?.emailAddress
              }
            >
              {isLoaded
                ? (user?.primaryEmailAddress?.emailAddress ??
                  user?.emailAddresses[0]?.emailAddress ??
                  "—")
                : "…"}
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <UserButton
          appearance={{
            elements: {
              rootBox: "flex overflow-hidden",
              userButtonBox: "flex-row-reverse",
              userButtonOuterIdentifier: "truncate pl-0",
            },
          }}
          showName={!isCollapsed}
        />
        <div className="ml-auto flex shrink-0 items-center gap-px">
          <ModeToggle />
          <Button
            asChild
            className="shrink-0"
            size="icon"
            type="button"
            variant="ghost"
          >
            <div className="h-4 w-4">
              <NotificationsTrigger />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
