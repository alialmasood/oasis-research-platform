import { SuperAdminShell } from "../SuperAdminShell";
import { AuditLogsPageClient } from "./AuditLogsPageClient";
import { listAuditLogs } from "@/lib/superAdmin/audit";

export default async function SuperAdminAuditLogsPage() {
  const initial = await listAuditLogs({ page: 1, pageSize: 20 });

  return (
    <SuperAdminShell active="audit-logs">
      <AuditLogsPageClient
        initialItems={initial.items}
        initialPagination={initial.pagination}
      />
    </SuperAdminShell>
  );
}
