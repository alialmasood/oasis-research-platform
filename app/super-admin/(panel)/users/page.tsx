import { SuperAdminShell } from "../SuperAdminShell";
import { listRoleNames, listUsers } from "@/lib/superAdmin/users";
import { UsersPageClient } from "./UsersPageClient";

export default async function SuperAdminUsersPage() {
  const [initial, roles] = await Promise.all([
    listUsers({ page: 1, pageSize: 20, role: "ALL", status: "ALL", search: "" }),
    listRoleNames(),
  ]);

  return (
    <SuperAdminShell active="users">
      <UsersPageClient
        initialItems={initial.items}
        initialPagination={initial.pagination}
        roleOptions={roles}
      />
    </SuperAdminShell>
  );
}
