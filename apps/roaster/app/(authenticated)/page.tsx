import { redirect } from "next/navigation";

// Roaster portal has no root landing surface; Clerk after-sign-in URL is "/".
// Send authenticated roasters straight to their dashboard.
const RoasterHome = () => {
  redirect("/dashboard");
};

export default RoasterHome;
