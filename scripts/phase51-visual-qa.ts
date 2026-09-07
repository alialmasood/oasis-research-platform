/**
 * Phase 5.1 visual QA — screenshots + overflow checks.
 * Does NOT print credentials. Screenshots go to .qa-phase51/ (gitignored).
 */
import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { chromium, type Page } from "playwright";

const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";
const OUT = path.join(os.tmpdir(), "research-platform-qa-phase51");
const EMAIL = process.env.SUPER_ADMIN_EMAIL || "";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "430", width: 430, height: 932 },
  { name: "390", width: 390, height: 844 },
] as const;

const PAGES = [
  { key: "dashboard", path: "/super-admin" },
  { key: "users", path: "/super-admin/users" },
  { key: "admins", path: "/super-admin/admins" },
  { key: "audit", path: "/super-admin/audit-logs" },
] as const;

type Finding = {
  viewport: string;
  page: string;
  issue: string;
  severity: "info" | "warn" | "fail";
};

async function measureOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = doc.clientWidth;
    const overflowX = scrollWidth > clientWidth + 1;

    const offenders: string[] = [];
    const all = Array.from(document.querySelectorAll("body *"));
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > clientWidth + 2 || rect.left < -2) {
        const tag = el.tagName.toLowerCase();
        const cls = (el as HTMLElement).className?.toString?.().slice(0, 80) || "";
        offenders.push(`${tag}.${cls}`.slice(0, 120));
        if (offenders.length >= 8) break;
      }
    }
    return { overflowX, scrollWidth, clientWidth, offenders };
  });
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("SUPER_ADMIN credentials missing in env");
  }

  fs.mkdirSync(OUT, { recursive: true });
  const findings: Finding[] = [];
  const report: string[] = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login page checks at 1440 and 390
  for (const vp of [
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE}/super-admin/login`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(OUT, `login-${vp.name}.png`),
      fullPage: true,
    });
    const ov = await measureOverflow(page);
    if (ov.overflowX) {
      findings.push({
        viewport: vp.name,
        page: "login",
        issue: `horizontal overflow ${ov.scrollWidth}>${ov.clientWidth}; ${ov.offenders.join(" | ")}`,
        severity: "fail",
      });
    } else {
      findings.push({
        viewport: vp.name,
        page: "login",
        issue: "no horizontal overflow",
        severity: "info",
      });
    }
  }

  // Authenticate
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/super-admin/login`, { waitUntil: "networkidle" });
  await page.fill("#super-admin-email", EMAIL);
  await page.fill("#super-admin-password", PASSWORD);
  await Promise.all([
    page.waitForURL("**/super-admin", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  report.push("LOGIN_OK");

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of PAGES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      // Mobile: open sheet briefly on first page
      if ((vp.width <= 768) && route.key === "dashboard") {
        const menuBtn = page.getByRole("button", { name: "فتح القائمة" });
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.waitForTimeout(300);
          await page.screenshot({
            path: path.join(OUT, `sheet-open-${vp.name}.png`),
            fullPage: false,
          });
          // close via Escape
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
        }
      }

      const shot = path.join(OUT, `${route.key}-${vp.name}.png`);
      await page.screenshot({ path: shot, fullPage: true });

      const ov = await measureOverflow(page);
      if (ov.overflowX) {
        findings.push({
          viewport: vp.name,
          page: route.key,
          issue: `horizontal overflow ${ov.scrollWidth}>${ov.clientWidth}; sample: ${ov.offenders.slice(0, 3).join(" | ")}`,
          severity: "fail",
        });
      } else {
        findings.push({
          viewport: vp.name,
          page: route.key,
          issue: "layout OK / no page overflow",
          severity: "info",
        });
      }

      // Presence checks
      if (route.key === "dashboard") {
        const title = await page.getByRole("heading", { name: "لوحة التحكم" }).count();
        if (!title) {
          findings.push({
            viewport: vp.name,
            page: route.key,
            issue: "missing dashboard heading",
            severity: "warn",
          });
        }
      }
      if (route.key === "users") {
        const heading = await page.getByRole("heading", { name: /المستخدم/ }).count();
        if (!heading) {
          findings.push({
            viewport: vp.name,
            page: route.key,
            issue: "missing users heading",
            severity: "warn",
          });
        }
      }
    }

    // Dialog checks on mobile/desktop for admins create
    if (vp.name === "390" || vp.name === "1440") {
      await page.goto(`${BASE}/super-admin/admins`, { waitUntil: "networkidle" });
      const createBtn = page.getByRole("button", { name: /إضافة حساب إدارة/ });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(OUT, `admins-create-dialog-${vp.name}.png`),
          fullPage: false,
        });
        const dialogBox = page.locator('[role="dialog"]');
        if (await dialogBox.count()) {
          const box = await dialogBox.first().boundingBox();
          if (box && box.height > vp.height - 20) {
            findings.push({
              viewport: vp.name,
              page: "admins-dialog",
              issue: `create dialog height ${Math.round(box.height)} near/over viewport ${vp.height}`,
              severity: "warn",
            });
          } else {
            findings.push({
              viewport: vp.name,
              page: "admins-dialog",
              issue: "create dialog fits viewport",
              severity: "info",
            });
          }
        }
        await page.keyboard.press("Escape");
      }
    }
  }

  // Empty search visual on users
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/super-admin/users`, { waitUntil: "networkidle" });
  const search = page.getByPlaceholder(/ابحث/);
  if (await search.count()) {
    await search.fill("___no_match_phase51___");
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(OUT, `users-empty-search-1280.png`),
      fullPage: true,
    });
    const empty = await page.getByText(/لا توجد نتائج|لا مستخدم/).count();
    findings.push({
      viewport: "1280",
      page: "users-empty",
      issue: empty ? "empty state visible after no-match search" : "empty state text not found",
      severity: empty ? "info" : "warn",
    });
  }

  // Logout
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/super-admin`, { waitUntil: "networkidle" });
  const logout = page.getByRole("button", { name: /تسجيل الخروج/ }).first();
  if (await logout.isVisible()) {
    await Promise.all([
      page.waitForURL("**/super-admin/login", { timeout: 10000 }),
      logout.click(),
    ]);
    report.push("LOGOUT_OK");
  }

  await browser.close();

  const summary = {
    findings,
    report,
    outDir: OUT,
    fails: findings.filter((f) => f.severity === "fail"),
    warns: findings.filter((f) => f.severity === "warn"),
  };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("QA_FAIL", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
