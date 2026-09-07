import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/superAdminAuth";
import { SuperAdminLoginForm } from "./SuperAdminLoginForm";

export default async function SuperAdminLoginPage() {
  const session = await getSuperAdminSession();
  if (session) {
    redirect("/super-admin");
  }

  return <SuperAdminLoginForm />;
}
