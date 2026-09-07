import { getSuperAdminSession } from "@/lib/superAdminAuth";
import { SuperAdminFrame } from "./_components/SuperAdminFrame";
import type { SuperAdminNavKey } from "./_components/presentation";

export async function SuperAdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: SuperAdminNavKey;
}) {
  const session = await getSuperAdminSession();

  return (
    <SuperAdminFrame active={active} email={session?.email}>
      {children}
    </SuperAdminFrame>
  );
}
