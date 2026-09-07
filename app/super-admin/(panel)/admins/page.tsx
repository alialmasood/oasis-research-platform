import { SuperAdminShell } from "../SuperAdminShell";
import { listAdmins } from "@/lib/superAdmin/admins";
import { AdminsPageClient } from "./AdminsPageClient";

export default async function SuperAdminAdminsPage() {
  const admins = await listAdmins();

  return (
    <SuperAdminShell active="admins">
      <AdminsPageClient initialAdmins={admins} />
    </SuperAdminShell>
  );
}
