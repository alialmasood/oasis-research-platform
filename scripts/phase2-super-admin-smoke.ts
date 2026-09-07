/**
 * Phase 2 practical checks (service layer + loginUser).
 * Does not print passwords or hashes.
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { loginUser } from "../lib/auth";
import {
  createAdmin,
  getAdminById,
  listAdmins,
  resetAdminPassword,
  setAdminActiveState,
  updateAdmin,
} from "../lib/superAdmin/admins";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const ACTOR = "phase-smoke@local.test";
  const stamp = Date.now();
  const email = `phase2.admin.${stamp}@uobasrah.edu.iq`;
  const password1 = `TempPass_${stamp}_Aa1`;
  const password2 = `TempPass_${stamp}_Bb2`;

  console.log("TEST createAdmin...");
  const admin = await createAdmin({
    firstName: "اختبار",
    lastName: "مرحلة2",
    email,
    password: password1,
  }, ACTOR);
  assert(admin.id, "admin id missing");
  assert(admin.email === email, "email mismatch");
  assert(admin.isActive === true, "should be active");
  assert(!("passwordHash" in admin), "passwordHash leaked in SafeAdmin");
  console.log("OK createAdmin", admin.id);

  console.log("TEST listAdmins includes created...");
  const listed = await listAdmins();
  assert(listed.some((a) => a.id === admin.id), "created admin not listed");
  assert(listed.every((a) => !("passwordHash" in a)), "passwordHash in list");
  console.log("OK listAdmins");

  console.log("TEST loginUser with new admin...");
  const login1 = await loginUser(email, password1);
  assert(!!login1, "login should succeed");
  assert(login1!.user.roles.includes("ADMIN"), "ADMIN role missing");
  console.log("OK loginUser active");

  console.log("TEST disable...");
  const disabled = await setAdminActiveState(admin.id, false, ACTOR);
  assert(disabled.isActive === false, "disable failed");
  const loginDisabled = await loginUser(email, password1);
  assert(loginDisabled === null, "disabled admin should not login");
  console.log("OK disable blocks login");

  console.log("TEST enable...");
  const enabled = await setAdminActiveState(admin.id, true, ACTOR);
  assert(enabled.isActive === true, "enable failed");
  const loginEnabled = await loginUser(email, password1);
  assert(!!loginEnabled, "enabled admin should login");
  console.log("OK enable restores login");

  console.log("TEST reset password...");
  await resetAdminPassword(admin.id, password2, ACTOR);
  const oldLogin = await loginUser(email, password1);
  assert(oldLogin === null, "old password should fail");
  const newLogin = await loginUser(email, password2);
  assert(!!newLogin, "new password should work");
  console.log("OK reset password");

  console.log("TEST updateAdmin...");
  const updated = await updateAdmin(admin.id, {
    firstName: "محدّث",
    lastName: "مرحلة2",
    email,
  }, ACTOR);
  assert(updated.firstName === "محدّث", "update name failed");
  console.log("OK updateAdmin");

  console.log("TEST non-admin protection...");
  const researcher = await prisma.user.findFirst({
    where: {
      userRoles: { none: { role: { name: "ADMIN" } } },
    },
    select: { id: true },
  });
  assert(researcher, "need a non-admin user for protection test");
  let rejected = false;
  try {
    await setAdminActiveState(researcher!.id, false, ACTOR);
  } catch {
    rejected = true;
  }
  assert(rejected, "non-admin target should be rejected");
  const byId = await getAdminById(researcher!.id);
  assert(byId === null, "getAdminById must not return non-admin");
  console.log("OK non-admin protection");

  // cleanup: disable test account (no delete in phase 2)
  await setAdminActiveState(admin.id, false, ACTOR);
  console.log("CLEANUP disabled test admin");
  console.log("ALL_PHASE2_SERVICE_TESTS_OK");
}

main()
  .catch((e) => {
    console.error("TEST_FAIL", e instanceof Error ? e.message : "unknown");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
