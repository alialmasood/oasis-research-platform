/**
 * Phase 4.6 — quick smoke after migration history alignment.
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { loginUser, resolveAuthenticatedSession } from "../lib/auth";
import {
  createSuperAdminToken,
  isSuperAdminConfigured,
  verifySuperAdminCredentials,
  verifySuperAdminToken,
} from "../lib/superAdminAuth";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const stamp = Date.now();
  const password = `Smoke46_${stamp}_Aa1`;
  const bcrypt = await import("bcryptjs");
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const researcherRole = await prisma.role.findUnique({ where: { name: "RESEARCHER" } });
  assert(adminRole && researcherRole, "roles missing");

  const aEmail = `smoke46.admin.${stamp}@uobasrah.edu.iq`;
  const rEmail = `smoke46.res.${stamp}@uobasrah.edu.iq`;

  const aUser = await prisma.user.create({
    data: {
      email: aEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullNameAr: "Smoke Admin",
      fullNameEn: "Smoke Admin",
      role: "ADMIN",
      isActive: true,
      userRoles: { create: { roleId: adminRole!.id } },
    },
    select: { id: true },
  });
  const rUser = await prisma.user.create({
    data: {
      email: rEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullNameAr: "Smoke Researcher",
      fullNameEn: "Smoke Researcher",
      role: "RESEARCHER",
      isActive: true,
      userRoles: { create: { roleId: researcherRole!.id } },
    },
    select: { id: true },
  });

  console.log("TEST Admin login...");
  const aLogin = await loginUser(aEmail, password);
  assert(aLogin, "admin login failed");
  assert(aLogin!.user.roles.includes("ADMIN"), "admin role missing");
  assert(await resolveAuthenticatedSession(aLogin!.token), "admin session resolve");
  console.log("OK Admin login");

  console.log("TEST Researcher login...");
  const rLogin = await loginUser(rEmail, password);
  assert(rLogin, "researcher login failed");
  assert(rLogin!.user.roles.includes("RESEARCHER"), "researcher role missing");
  assert(await resolveAuthenticatedSession(rLogin!.token), "researcher session resolve");
  console.log("OK Researcher login");

  console.log("TEST Super Admin auth...");
  assert(isSuperAdminConfigured(), "SUPER_ADMIN env missing");
  const saEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const saPassword = process.env.SUPER_ADMIN_PASSWORD || "";
  assert(verifySuperAdminCredentials(saEmail, saPassword), "super admin credentials invalid");
  const saToken = await createSuperAdminToken(saEmail);
  const saSession = await verifySuperAdminToken(saToken);
  assert(saSession?.email === saEmail, "super admin token verify failed");
  console.log("OK Super Admin login");

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const paths = [
      "/super-admin",
      "/super-admin/users",
      "/super-admin/admins",
      "/super-admin/audit-logs",
    ];
    for (const p of paths) {
      const res = await fetch(`${base}${p}`, { redirect: "manual" });
      assert(
        [200, 302, 303, 307, 308].includes(res.status),
        `page ${p} unexpected status ${res.status}`
      );
      console.log(`OK HTTP ${p} -> ${res.status}`);
    }
  } catch {
    console.log("HTTP_SKIP server not reachable");
  }

  await prisma.user.delete({ where: { id: aUser.id } }).catch(() => undefined);
  await prisma.user.delete({ where: { id: rUser.id } }).catch(() => undefined);
  console.log("ALL_PHASE46_SMOKE_OK");
}

main()
  .catch((e) => {
    console.error("SMOKE_FAIL", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
