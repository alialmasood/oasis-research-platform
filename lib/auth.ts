import { prisma } from "./db";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-key-change-in-production"
);

// Lazy load pg to avoid Turbopack issues
let pool: any = null;
async function getPool() {
  if (!pool) {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

// Hash password using database function
export async function hashPassword(password: string): Promise<string> {
  try {
    const poolInstance = await getPool();
    const client = await poolInstance.connect();
    try {
      const result = await client.query(
        `SELECT hash_password($1) as hash_password`,
        [password]
      );
      return result.rows[0]?.hash_password || "";
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in hashPassword:", error);
    throw error;
  }
}

// Verify login using database function
export async function verifyLogin(
  usernameOrEmail: string,
  password: string
): Promise<{
  userId: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  departmentId: string | null;
} | null> {
  try {
    const poolInstance = await getPool();
    const client = await poolInstance.connect();
    try {
      const result = await client.query(
        `SELECT * FROM verify_login($1, $2)`,
        [usernameOrEmail, password]
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        username: row.username,
        email: row.email,
        fullName: row.full_name,
        isActive: row.is_active,
        departmentId: row.department_id,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in verifyLogin:", error);
    return null;
  }
}

// Get user roles
export async function getUserRoles(userId: string): Promise<string[]> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  return roles.map((ur) => ur.role.name);
}

// Get user permissions (from all roles)
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const userRole of userRoles) {
    for (const rp of userRole.role.rolePermissions) {
      permissions.add(rp.permission.name);
    }
  }

  return Array.from(permissions);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    roles: user.roles,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const isString = (value: unknown): value is string => typeof value === "string";
    if (!isString(payload.id) || !isString(payload.email) || !isString(payload.username) || !isString(payload.fullName)) {
      return null;
    }
    const roles = Array.isArray(payload.roles) ? payload.roles.filter(isString) : [];
    const permissions = Array.isArray(payload.permissions) ? payload.permissions.filter(isString) : [];
    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      fullName: payload.fullName,
      roles,
      permissions,
    };
  } catch (error) {
    return null;
  }
}

export async function loginUser(
  usernameOrEmail: string,
  password: string
): Promise<{ user: SessionUser; token: string } | null> {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني (لأن username تم حذفه)
    const user = await prisma.user.findUnique({
      where: { email: usernameOrEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullNameAr: true,
        fullNameEn: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // التحقق من كلمة المرور باستخدام bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Get user roles and permissions
    const roles = await getUserRoles(user.id);
    const permissions = await getUserPermissions(user.id);

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.email, // استخدام email كـ username مؤقتاً
      fullName: user.fullNameAr || user.fullNameEn || user.email,
      roles,
      permissions,
    };

    const token = await createSession(sessionUser);
    return { user: sessionUser, token };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return null;
  }
}
