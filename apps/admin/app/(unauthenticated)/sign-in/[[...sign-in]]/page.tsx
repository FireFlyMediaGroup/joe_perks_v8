import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const SignIn = dynamic(() =>
  import("@repo/auth/components/sign-in").then((mod) => mod.SignIn)
);

export const metadata: Metadata = createMetadata({
  title: "Admin sign in",
  description: "Access the Joe Perks admin portal.",
});

const SignInPage = () => <SignIn />;

export default SignInPage;
