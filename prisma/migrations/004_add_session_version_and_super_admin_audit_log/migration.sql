-- Add session version for JWT invalidation + Super Admin audit log

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "super_admin_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "target_email" TEXT,
    "metadata" JSONB,
    "actor_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "super_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "super_admin_audit_logs_created_at_idx" ON "super_admin_audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "super_admin_audit_logs_action_idx" ON "super_admin_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "super_admin_audit_logs_target_type_idx" ON "super_admin_audit_logs"("target_type");
CREATE INDEX IF NOT EXISTS "super_admin_audit_logs_target_id_idx" ON "super_admin_audit_logs"("target_id");
CREATE INDEX IF NOT EXISTS "super_admin_audit_logs_target_email_idx" ON "super_admin_audit_logs"("target_email");
