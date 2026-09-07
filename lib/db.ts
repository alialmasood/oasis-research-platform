import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getPool(): Pool {
  if (!globalForPrisma.pgPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // استعلامات متوازية كثيرة على نفس الـ pool (لوحة التحكم / التقييم)
    pool.setMaxListeners(0);
    globalForPrisma.pgPool = pool;
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient(): PrismaClient {
  const logQueries = process.env.PRISMA_LOG_QUERIES === "true";
  return new PrismaClient({
    adapter: new PrismaPg(getPool()),
    log: logQueries ? ["query", "error", "warn"] : ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
