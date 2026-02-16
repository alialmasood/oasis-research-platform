import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// تجنّب تحذير MaxListenersExceeded عند تنفيذ استعلامات متوازية كثيرة (مثل صفحة التقييم)
if (pool.setMaxListeners) pool.setMaxListeners(64);

const adapter = new PrismaPg(pool);

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function getPrismaInstance(): PrismaClient {
  let instance = globalForPrisma.prisma;
  if (!instance) {
    instance = createPrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = instance;
  }
  // في وضع التطوير: إذا كان العميل يفتقد موديلات جديدة، أعد تحميل العميل
  if (process.env.NODE_ENV !== "production") {
    const hasFieldVisit = typeof (instance as any).fieldVisit?.findMany === "function";
    const hasResearcherGoals = typeof (instance as any).researcherGoals?.findMany === "function";
    const hasResearcherLinks = typeof (instance as any).researcherLinks?.findUnique === "function";
    const hasCollaborationProject = typeof (instance as any).collaborationProject?.findMany === "function";
    if (!hasFieldVisit || !hasResearcherGoals || !hasResearcherLinks || !hasCollaborationProject) {
      try {
        const clientPath = require.resolve("@prisma/client");
        if (require.cache[clientPath]) delete require.cache[clientPath];
        try {
          const dotPath = require.resolve(".prisma/client");
          if (require.cache[dotPath]) delete require.cache[dotPath];
        } catch (_) {}
        const { PrismaClient: NewPrismaClient } = require("@prisma/client");
        instance = new NewPrismaClient({
          adapter,
          log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
        globalForPrisma.prisma = instance;
        console.warn("[Prisma] Reloaded client (missing model: fieldVisit, researcherGoals, researcherLinks, or collaboration).");
      } catch (e) {
        console.warn("[Prisma] Could not reload client. Restart the dev server after running: npx prisma generate", e);
      }
    }
  }
  return instance!;
}

// تصدير وكيل يوجّه كل وصول إلى getPrismaInstance() لضمان استخدام عميل محدّث (بعد إعادة التحميل إن لزم)
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop, receiver) {
    return Reflect.get(getPrismaInstance(), prop, receiver);
  },
});
