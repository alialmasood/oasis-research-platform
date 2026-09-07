/**
 * Phase 3 users management smoke tests.
 * Does not print passwords/hashes. Cleans fixtures afterward.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { loginUser, resolveAuthenticatedSession } from "../lib/auth";
import { createAdmin, setAdminActiveState } from "../lib/superAdmin/admins";
import {
  listUsers,
  updateUser,
  setUserActiveState,
  getUserById,
} from "../lib/superAdmin/users";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const ACTOR = "phase-smoke@local.test";
  const stamp = Date.now();
  const researcherEmail = `phase3.user.${stamp}@uobasrah.edu.iq`;
  const adminEmail = `phase3.admin.${stamp}@uobasrah.edu.iq`;
  const password = `TempPass_${stamp}_Aa1`;
  const dupEmail = `phase3.dup.${stamp}@uobasrah.edu.iq`;

  const researcherRole = await prisma.role.findUnique({ where: { name: "RESEARCHER" } });
  assert(researcherRole, "RESEARCHER role missing");

  const researcher = await prisma.user.create({
    data: {
      email: researcherEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullNameAr: "باحث مرحلة ثلاثة",
      fullNameEn: "Phase Three Researcher",
      phone: "+9647000000999",
      role: "RESEARCHER",
      isActive: true,
      userRoles: { create: { roleId: researcherRole!.id } },
    },
    select: { id: true },
  });

  await prisma.user.create({
    data: {
      email: dupEmail,
      passwordHash: await bcrypt.hash(password, 10),
      fullNameAr: "مستخدم مكرر",
      fullNameEn: "Dup User",
      role: "RESEARCHER",
      isActive: true,
      userRoles: { create: { roleId: researcherRole!.id } },
    },
  });

  const admin = await createAdmin({ firstName: "Phase3", lastName: "Admin", email: adminEmail, password }, ACTOR);

  console.log("TEST A list users...");
  const listA = await listUsers({ page: 1, pageSize: 20 });
  assert(listA.items.length > 0, "users list empty");
  assert(listA.items.every((u) => !("passwordHash" in u)), "passwordHash leaked");
  console.log("OK A");

  console.log("TEST B search...");
  const byEmail = await listUsers({ search: researcherEmail, page: 1, pageSize: 20 });
  assert(byEmail.items.some((u) => u.id === researcher.id), "search email failed");
  const byName = await listUsers({ search: "مرحلة ثلاثة", page: 1, pageSize: 20 });
  assert(byName.items.some((u) => u.id === researcher.id), "search name failed");
  console.log("OK B");

  console.log("TEST C filter RESEARCHER...");
  const researchers = await listUsers({ role: "RESEARCHER", page: 1, pageSize: 50 });
  assert(
    researchers.items.every((u) => u.roles.includes("RESEARCHER")),
    "researcher filter includes non-researcher"
  );
  assert(
    !researchers.items.some((u) => u.roles.includes("ADMIN") && !u.roles.includes("RESEARCHER") && u.id === admin.id)
      ? true
      : researchers.items.find((u) => u.id === admin.id)
        ? false
        : true,
    "admin-only should not appear in RESEARCHER filter"
  );
  assert(
    !researchers.items.some((u) => u.id === admin.id),
    "ADMIN-only user appeared in RESEARCHER filter"
  );
  console.log("OK C");

  console.log("TEST D filter ADMIN...");
  const adminsOnly = await listUsers({ role: "ADMIN", page: 1, pageSize: 50 });
  assert(adminsOnly.items.every((u) => u.roles.includes("ADMIN")), "admin filter broken");
  assert(adminsOnly.items.some((u) => u.id === admin.id), "created admin missing");
  console.log("OK D");

  console.log("TEST E filter DISABLED...");
  await setUserActiveState(researcher.id, false, ACTOR);
  const disabled = await listUsers({ status: "DISABLED", page: 1, pageSize: 50 });
  assert(disabled.items.every((u) => u.isActive === false), "disabled filter broken");
  assert(disabled.items.some((u) => u.id === researcher.id), "disabled user missing");
  await setUserActiveState(researcher.id, true, ACTOR);
  console.log("OK E");

  console.log("TEST F pagination...");
  const page1 = await listUsers({ page: 1, pageSize: 2 });
  assert(page1.pagination.pageSize === 2, "pageSize not applied");
  assert(page1.pagination.total >= 2, "total too small");
  assert(
    page1.pagination.totalPages === Math.ceil(page1.pagination.total / 2),
    "totalPages mismatch"
  );
  console.log("OK F");

  console.log("TEST G edit researcher...");
  const edited = await updateUser(researcher.id, {
    fullNameAr: "باحث محدّث",
    fullNameEn: "Updated Researcher",
    email: researcherEmail,
    phone: "+9647000000888",
  }, ACTOR);
  assert(edited.fullNameAr === "باحث محدّث", "edit name failed");
  console.log("OK G");

  console.log("TEST H duplicate email...");
  let dupRejected = false;
  try {
    await updateUser(researcher.id, {
      fullNameAr: "باحث محدّث",
      fullNameEn: "Updated Researcher",
      email: dupEmail,
      phone: null,
    }, ACTOR);
  } catch {
    dupRejected = true;
  }
  assert(dupRejected, "duplicate email should fail");
  console.log("OK H");

  console.log("TEST I disable after JWT...");
  const loginI = await loginUser(researcherEmail, password);
  assert(loginI, "researcher login failed");
  const tokenI = loginI!.token;
  assert(await resolveAuthenticatedSession(tokenI), "session should work before disable");
  await setUserActiveState(researcher.id, false, ACTOR);
  assert(
    (await resolveAuthenticatedSession(tokenI)) === null,
    "disabled user session must be rejected"
  );
  console.log("OK I");

  console.log("TEST J enable...");
  await setUserActiveState(researcher.id, true, ACTOR);
  const loginJ = await loginUser(researcherEmail, password);
  assert(loginJ, "enabled login failed");
  console.log("OK J");

  console.log("TEST K disable admin from users service...");
  const loginK = await loginUser(adminEmail, password);
  assert(loginK, "admin login failed");
  const tokenK = loginK!.token;
  await setUserActiveState(admin.id, false, ACTOR);
  assert(
    (await resolveAuthenticatedSession(tokenK)) === null,
    "disabled admin session must be rejected"
  );
  await setUserActiveState(admin.id, true, ACTOR);
  console.log("OK K");

  console.log("TEST detail...");
  const detail = await getUserById(researcher.id);
  assert(detail && !("passwordHash" in detail), "detail leak");
  console.log("OK detail");

  // cleanup
  await prisma.user.delete({ where: { id: researcher.id } }).catch(() => undefined);
  await prisma.user.delete({ where: { email: dupEmail } }).catch(() => undefined);
  await setAdminActiveState(admin.id, false, ACTOR);
  console.log("CLEANUP done");
  console.log("ALL_PHASE3_TESTS_OK");
}

main()
  .catch((e) => {
    console.error("TEST_FAIL", e instanceof Error ? e.message : "unknown");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
