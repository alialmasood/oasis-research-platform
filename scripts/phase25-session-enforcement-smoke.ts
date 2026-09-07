/**
 * Phase 2.5 — session enforcement smoke tests.
 * Does not print passwords/hashes. Restores DB fixtures afterward.
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import {
  createSession,
  loginUser,
  resolveAuthenticatedSession,
  verifySession,
  type SessionUser,
} from "../lib/auth";
import {
  createAdmin,
  setAdminActiveState,
} from "../lib/superAdmin/admins";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const ACTOR = "phase-smoke@local.test";
  const stamp = Date.now();
  const adminEmail = `phase25.admin.${stamp}@uobasrah.edu.iq`;
  const researcherEmail = `phase25.researcher.${stamp}@uobasrah.edu.iq`;
  const password = `TempPass_${stamp}_Aa1`;

  console.log("Setup fixtures...");
  const admin = await createAdmin({ firstName: "Phase25", lastName: "Admin", email: adminEmail, password }, ACTOR);

  const researcherRole = await prisma.role.findUnique({ where: { name: "RESEARCHER" } });
  assert(researcherRole, "RESEARCHER role missing");

  const bcrypt = await import("bcryptjs");
  const researcher = await prisma.user.create({
    data: {
      email: researcherEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullNameAr: "باحث اختبار",
      fullNameEn: "Test Researcher",
      role: "RESEARCHER",
      isActive: true,
      userRoles: {
        create: { roleId: researcherRole!.id },
      },
    },
    select: { id: true, email: true },
  });

  // ---- Test A: Active Admin ----
  console.log("TEST A active admin...");
  const loginA = await loginUser(adminEmail, password);
  assert(loginA, "active admin login failed");
  const sessionA = await resolveAuthenticatedSession(loginA!.token);
  assert(sessionA, "active admin session resolve failed");
  assert(sessionA!.roles.includes("ADMIN"), "active admin missing ADMIN role");
  console.log("OK A");

  // ---- Test B: Disable AFTER JWT issued ----
  console.log("TEST B disable after JWT...");
  const tokenBeforeDisable = loginA!.token;
  const cryptoOk = await verifySession(tokenBeforeDisable);
  assert(cryptoOk, "JWT should still verify cryptographically");
  await setAdminActiveState(admin.id, false, ACTOR);
  const sessionDisabled = await resolveAuthenticatedSession(tokenBeforeDisable);
  assert(sessionDisabled === null, "disabled admin must not resolve session");
  console.log("OK B");

  // ---- Test C: Enable + new login ----
  console.log("TEST C enable again...");
  await setAdminActiveState(admin.id, true, ACTOR);
  const loginC = await loginUser(adminEmail, password);
  assert(loginC, "re-enabled admin login failed");
  const sessionC = await resolveAuthenticatedSession(loginC!.token);
  assert(sessionC, "re-enabled session resolve failed");
  console.log("OK C");

  // ---- Test D: nonexistent user id in valid-shaped JWT ----
  console.log("TEST D deleted/nonexistent user...");
  const fakeUser: SessionUser = {
    id: `missing_user_${stamp}`,
    email: "missing@example.com",
    username: "missing@example.com",
    fullName: "Missing",
    roles: ["ADMIN"],
    permissions: [],
  };
  const fakeToken = await createSession(fakeUser, 0);
  assert(await verifySession(fakeToken), "fake JWT should verify crypto");
  assert(
    (await resolveAuthenticatedSession(fakeToken)) === null,
    "missing user must be invalid session"
  );
  console.log("OK D");

  // ---- Test E: Researcher disabled ----
  console.log("TEST E researcher disabled...");
  const loginE = await loginUser(researcherEmail, password);
  assert(loginE, "researcher login failed");
  const tokenE = loginE!.token;
  assert(await resolveAuthenticatedSession(tokenE), "researcher active session");
  await prisma.user.update({
    where: { id: researcher.id },
    data: { isActive: false },
  });
  assert(
    (await resolveAuthenticatedSession(tokenE)) === null,
    "disabled researcher must be rejected"
  );
  await prisma.user.update({
    where: { id: researcher.id },
    data: { isActive: true },
  });
  console.log("OK E");

  // ---- Test F: stale ADMIN role removed from DB ----
  console.log("TEST F stale role removed...");
  const loginF = await loginUser(adminEmail, password);
  assert(loginF, "admin login for role test failed");
  assert(loginF!.user.roles.includes("ADMIN"), "token issued with ADMIN");
  const tokenF = loginF!.token;
  const adminRoleLink = await prisma.userRole.findFirst({
    where: { userId: admin.id, role: { name: "ADMIN" } },
  });
  assert(adminRoleLink, "admin role link missing");
  await prisma.userRole.delete({ where: { id: adminRoleLink!.id } });
  const afterRoleRemoval = await resolveAuthenticatedSession(tokenF);
  assert(afterRoleRemoval, "user still active should resolve");
  assert(
    !afterRoleRemoval!.roles.includes("ADMIN"),
    "stale ADMIN role must not remain"
  );
  // restore ADMIN role
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  assert(adminRole, "ADMIN role missing");
  await prisma.userRole.create({
    data: { userId: admin.id, roleId: adminRole!.id },
  });
  const restored = await resolveAuthenticatedSession(tokenF);
  assert(restored?.roles.includes("ADMIN"), "ADMIN role restore failed");
  console.log("OK F");

  // cleanup fixtures (disable/delete test users — researcher can be deleted safely)
  await setAdminActiveState(admin.id, false, ACTOR);
  await prisma.user.delete({ where: { id: researcher.id } }).catch(() => undefined);
  // keep admin row disabled (no hard delete policy for admins in phase 2)
  console.log("CLEANUP done");
  console.log("ALL_PHASE25_TESTS_OK");
}

main()
  .catch((e) => {
    console.error("TEST_FAIL", e instanceof Error ? e.message : "unknown");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
