/**
 * Phase 4 — sessionVersion invalidation + audit log smoke tests.
 * Does not print passwords/hashes. Cleans fixtures afterward.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "../lib/db";
import {
  loginUser,
  resolveAuthenticatedSession,
  verifySession,
} from "../lib/auth";
import {
  createAdmin,
  resetAdminPassword,
  revokeAdminSessions,
  setAdminActiveState,
} from "../lib/superAdmin/admins";
import {
  revokeUserSessions,
  setUserActiveState,
} from "../lib/superAdmin/users";
import { listAuditLogs } from "../lib/superAdmin/audit";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function metadataHasSecret(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const text = JSON.stringify(meta).toLowerCase();
  return (
    text.includes("password") ||
    text.includes("passwordhash") ||
    text.includes("jwt") ||
    text.includes("cookie") ||
    text.includes("secret")
  );
}

async function main() {
  const ACTOR = "phase4-smoke@local.test";
  const stamp = Date.now();
  const adminEmail = `phase4.admin.${stamp}@uobasrah.edu.iq`;
  const researcherEmail = `phase4.user.${stamp}@uobasrah.edu.iq`;
  const password1 = `TempPass_${stamp}_Aa1`;
  const password2 = `TempPass_${stamp}_Bb2`;

  console.log("Setup...");
  const admin = await createAdmin(
    {
      firstName: "Phase4",
      lastName: "Admin",
      email: adminEmail,
      password: password1,
    },
    ACTOR
  );

  const researcherRole = await prisma.role.findUnique({ where: { name: "RESEARCHER" } });
  assert(researcherRole, "RESEARCHER role missing");
  const researcher = await prisma.user.create({
    data: {
      email: researcherEmail,
      passwordHash: await bcrypt.hash(password1, 10),
      fullNameAr: "باحث مرحلة4",
      fullNameEn: "Phase4 Researcher",
      role: "RESEARCHER",
      isActive: true,
      userRoles: { create: { roleId: researcherRole!.id } },
    },
    select: { id: true, email: true },
  });

  // ---- Test A: Old JWT before reset ----
  console.log("TEST A old JWT after reset...");
  const loginA = await loginUser(adminEmail, password1);
  assert(loginA, "login A failed");
  const oldToken = loginA!.token;
  assert(await resolveAuthenticatedSession(oldToken), "pre-reset session should work");
  await resetAdminPassword(admin.id, password2, ACTOR);
  assert((await verifySession(oldToken)) !== null, "JWT still cryptographically valid");
  assert(
    (await resolveAuthenticatedSession(oldToken)) === null,
    "old JWT must be invalid after reset"
  );
  console.log("OK A");

  // ---- Test B: login with new password ----
  console.log("TEST B new password login...");
  const loginB = await loginUser(adminEmail, password2);
  assert(loginB, "new password login failed");
  assert(await resolveAuthenticatedSession(loginB!.token), "new session resolve failed");
  console.log("OK B");

  // ---- Test C: old password ----
  console.log("TEST C old password...");
  assert((await loginUser(adminEmail, password1)) === null, "old password must fail");
  console.log("OK C");

  // ---- Test D: revoke sessions ----
  console.log("TEST D revoke sessions...");
  const tokenD = loginB!.token;
  await revokeAdminSessions(admin.id, ACTOR);
  assert(
    (await resolveAuthenticatedSession(tokenD)) === null,
    "revoked session must be invalid"
  );
  console.log("OK D");

  // ---- Test E: new login after revoke ----
  console.log("TEST E login after revoke...");
  const loginE = await loginUser(adminEmail, password2);
  assert(loginE, "login after revoke failed");
  assert(await resolveAuthenticatedSession(loginE!.token), "post-revoke session failed");
  console.log("OK E");

  // ---- Test F: disable ----
  console.log("TEST F disable...");
  const tokenF = loginE!.token;
  await setAdminActiveState(admin.id, false, ACTOR);
  assert((await resolveAuthenticatedSession(tokenF)) === null, "disabled must invalidate");
  console.log("OK F");

  // ---- Test G: enable ----
  console.log("TEST G enable...");
  // Disable does not bump sessionVersion, so tokenF (post-revoke login) may work again.
  // Tokens from before reset/revoke must remain invalid.
  await setAdminActiveState(admin.id, true, ACTOR);
  assert(
    (await resolveAuthenticatedSession(oldToken)) === null,
    "pre-reset JWT must stay dead after enable"
  );
  assert(
    (await resolveAuthenticatedSession(tokenD)) === null,
    "pre-revoke JWT must stay dead after enable"
  );
  const loginG = await loginUser(adminEmail, password2);
  assert(loginG, "fresh login after enable failed");
  assert(await resolveAuthenticatedSession(loginG!.token), "fresh session after enable");
  console.log("OK G");

  // ---- Test H: audit ADMIN_CREATED ----
  console.log("TEST H audit create...");
  const auditCreate = await listAuditLogs({
    action: "ADMIN_CREATED",
    search: adminEmail,
    page: 1,
    pageSize: 10,
  });
  assert(
    auditCreate.items.some((i) => i.action === "ADMIN_CREATED" && i.targetEmail === adminEmail),
    "ADMIN_CREATED missing"
  );
  assert(
    auditCreate.items.every((i) => !metadataHasSecret(i.metadata)),
    "secret in create audit"
  );
  console.log("OK H");

  // ---- Test I: disable/enable audits ----
  console.log("TEST I audit disable/enable...");
  await setUserActiveState(researcher.id, false, ACTOR);
  await setUserActiveState(researcher.id, true, ACTOR);
  const auditDisable = await listAuditLogs({
    action: "USER_DISABLED",
    search: researcherEmail,
    page: 1,
    pageSize: 5,
  });
  const auditEnable = await listAuditLogs({
    action: "USER_ENABLED",
    search: researcherEmail,
    page: 1,
    pageSize: 5,
  });
  assert(auditDisable.items.length > 0, "USER_DISABLED missing");
  assert(auditEnable.items.length > 0, "USER_ENABLED missing");
  console.log("OK I");

  // ---- Test J: password reset audit ----
  console.log("TEST J audit reset...");
  const auditReset = await listAuditLogs({
    action: "ADMIN_PASSWORD_RESET",
    search: adminEmail,
    page: 1,
    pageSize: 5,
  });
  assert(auditReset.items.length > 0, "ADMIN_PASSWORD_RESET missing");
  assert(
    auditReset.items.every((i) => !metadataHasSecret(i.metadata)),
    "password leaked in reset audit"
  );
  console.log("OK J");

  // ---- Test K: JWT without sessionVersion rejected ----
  console.log("TEST K legacy JWT without sessionVersion...");
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "default-secret-key-change-in-production"
  );
  const legacyToken = await new SignJWT({
    id: admin.id,
    email: adminEmail,
    username: adminEmail,
    fullName: "Phase4 Admin",
    roles: ["ADMIN"],
    permissions: [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  assert((await verifySession(legacyToken)) === null, "legacy JWT must fail verify");
  assert(
    (await resolveAuthenticatedSession(legacyToken)) === null,
    "legacy JWT must fail resolve"
  );
  console.log("OK K");

  // revoke sessions audit for researcher
  const loginR = await loginUser(researcherEmail, password1);
  assert(loginR, "researcher login");
  await revokeUserSessions(researcher.id, ACTOR);
  assert(
    (await resolveAuthenticatedSession(loginR!.token)) === null,
    "user revoke must invalidate"
  );
  const auditRevoke = await listAuditLogs({
    action: "USER_SESSIONS_REVOKED",
    search: researcherEmail,
    page: 1,
    pageSize: 5,
  });
  assert(auditRevoke.items.length > 0, "USER_SESSIONS_REVOKED missing");

  // cleanup
  await prisma.superAdminAuditLog.deleteMany({
    where: {
      OR: [{ targetEmail: adminEmail }, { targetEmail: researcherEmail }, { actorEmail: ACTOR }],
    },
  });
  await prisma.user.delete({ where: { id: researcher.id } }).catch(() => undefined);
  await prisma.user.delete({ where: { id: admin.id } }).catch(() => undefined);

  console.log("ALL_PHASE4_TESTS_OK");
}

main()
  .catch((e) => {
    console.error("TEST_FAIL", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
