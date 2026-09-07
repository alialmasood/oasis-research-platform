import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/superAdminAuth";

export default async function SuperAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/super-admin/login");
  }

  return <>{children}</>;
}
