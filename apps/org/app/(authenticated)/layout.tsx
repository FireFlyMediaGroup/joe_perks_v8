import { auth, currentUser } from "@repo/auth/server";
import type { ReactNode } from "react";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const user = await currentUser();
  const { redirectToSignIn } = await auth();

  if (!user) {
    return redirectToSignIn();
  }

  return <div className="min-h-dvh">{children}</div>;
};

export default AppLayout;
