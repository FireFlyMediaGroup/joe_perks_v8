import { AuthPageLayout } from "@repo/auth/components/auth-layout";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <AuthPageLayout
    accent="terra"
    portalName="Organization Portal"
    themeToggle={<ModeToggle />}
  >
    {children}
  </AuthPageLayout>
);

export default AuthLayout;
