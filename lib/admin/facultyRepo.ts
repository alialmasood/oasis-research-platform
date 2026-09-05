import { prisma } from "@/lib/db";
import { resolvePublicUrl } from "@/lib/utils";
import type { AcademicDegreeType, Prisma } from "@prisma/client";
import { DEPARTMENTS_BY_ENTITY } from "@/lib/entities";
import {
  DEGREE_LABELS,
  FACULTY_PAGE_SIZE,
  type FacultyDegreeType,
  type FacultyListFilters,
  type FacultyMember,
  type FacultyMemberDetail,
  type FacultyPageData,
  type FacultyStats,
} from "./facultyTypes";

const DEGREE_RANK: Record<AcademicDegreeType, number> = {
  DIPLOMA: 1,
  BACHELORS: 2,
  HIGHER_DIPLOMA: 3,
  MASTERS: 4,
  BOARD: 5,
  PHD: 6,
};

const GENDER_LABELS: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
};

/** تدريسيون فقط — يستبعد حسابات الإدارة (ADMIN) */
export const FACULTY_BASE_WHERE: Prisma.UserWhereInput = {
  role: "RESEARCHER",
  NOT: {
    userRoles: {
      some: { role: { name: "ADMIN" } },
    },
  },
};

const BASE_WHERE = FACULTY_BASE_WHERE;

const USER_LIST_SELECT = {
  id: true,
  email: true,
  fullNameAr: true,
  fullNameEn: true,
  phone: true,
  academicTitle: true,
  entity: true,
  department: true,
  generalSpecialization: true,
  specificSpecialization: true,
  employeeNumber: true,
  appointmentYear: true,
  isActive: true,
  researcherProfile: {
    select: { avatarUrl: true, avatarData: true },
  },
  profileCv: {
    select: { gender: true },
  },
  academicDegrees: {
    select: { degree: true },
  },
} as const;

const USER_COMPLETION_SELECT = {
  id: true,
  fullNameAr: true,
  fullNameEn: true,
  academicTitle: true,
  phone: true,
  entity: true,
  department: true,
  generalSpecialization: true,
  specificSpecialization: true,
  employeeNumber: true,
  appointmentYear: true,
} as const;

const LIST_ORDER: Prisma.UserOrderByWithRelationInput[] = [
  { entity: "asc" },
  { fullNameAr: "asc" },
  { fullNameEn: "asc" },
];

type UserListRow = Prisma.UserGetPayload<{ select: typeof USER_LIST_SELECT }>;
type UserCompletionRow = Prisma.UserGetPayload<{ select: typeof USER_COMPLETION_SELECT }>;

function getDisplayName(fullNameAr: string | null, fullNameEn: string | null): string {
  return fullNameAr?.trim() || fullNameEn?.trim() || "—";
}

function getHighestDegree(
  degrees: { degree: AcademicDegreeType }[]
): { type: AcademicDegreeType | null; label: string | null } {
  if (degrees.length === 0) return { type: null, label: null };

  const highest = degrees.reduce((best, current) =>
    DEGREE_RANK[current.degree] > DEGREE_RANK[best.degree] ? current : best
  );

  return { type: highest.degree, label: DEGREE_LABELS[highest.degree] };
}

function calcProfileCompletePercent(user: UserCompletionRow): number {
  const hasName = !!(user.fullNameAr?.trim() || user.fullNameEn?.trim());
  const basicComplete = hasName && !!user.academicTitle && !!user.phone;

  const departments = user.entity ? DEPARTMENTS_BY_ENTITY[user.entity] ?? [] : [];
  const departmentOk =
    !!user.entity &&
    (departments.length === 0 ? true : !!user.department) &&
    !!user.generalSpecialization &&
    !!user.specificSpecialization;
  const academicComplete = departmentOk;

  const adminComplete = !!user.employeeNumber && user.appointmentYear != null;

  const completedSections = [basicComplete, academicComplete, adminComplete].filter(Boolean).length;
  return Math.round((completedSections / 3) * 100);
}

function mapUserToFacultyMember(user: UserListRow): FacultyMember {
  const { type: highestDegreeType, label: highestDegree } = getHighestDegree(user.academicDegrees);
  const avatarUrl = user.researcherProfile?.avatarData
    ? `/api/avatar/${user.id}`
    : resolvePublicUrl(user.researcherProfile?.avatarUrl);

  return {
    id: user.id,
    fullNameAr: user.fullNameAr,
    fullNameEn: user.fullNameEn,
    displayName: getDisplayName(user.fullNameAr, user.fullNameEn),
    email: user.email,
    phone: user.phone,
    academicTitle: user.academicTitle,
    entity: user.entity,
    department: user.department,
    generalSpecialization: user.generalSpecialization,
    specificSpecialization: user.specificSpecialization,
    employeeNumber: user.employeeNumber,
    appointmentYear: user.appointmentYear,
    gender: user.profileCv?.gender
      ? (GENDER_LABELS[user.profileCv.gender] ?? user.profileCv.gender)
      : null,
    avatarUrl,
    highestDegree,
    highestDegreeType,
    degreesCount: user.academicDegrees.length,
    profileCompletePercent: calcProfileCompletePercent(user),
    isActive: user.isActive,
  };
}

function buildSearchWhere(search: string): Prisma.UserWhereInput {
  const q = search.trim();
  if (!q) return {};

  return {
    OR: [
      { fullNameAr: { contains: q, mode: "insensitive" } },
      { fullNameEn: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { academicTitle: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { generalSpecialization: { contains: q, mode: "insensitive" } },
      { specificSpecialization: { contains: q, mode: "insensitive" } },
      { employeeNumber: { contains: q, mode: "insensitive" } },
    ],
  };
}

function buildHighestDegreeWhere(degree: FacultyDegreeType): Prisma.UserWhereInput {
  const higher = (Object.entries(DEGREE_RANK) as [AcademicDegreeType, number][])
    .filter(([, rank]) => rank > DEGREE_RANK[degree])
    .map(([d]) => d);

  return {
    academicDegrees: { some: { degree } },
    ...(higher.length > 0
      ? { NOT: { academicDegrees: { some: { degree: { in: higher } } } } }
      : {}),
  };
}

function buildListWhere(filters: FacultyListFilters): Prisma.UserWhereInput {
  const conditions: Prisma.UserWhereInput[] = [BASE_WHERE];

  const searchWhere = buildSearchWhere(filters.search);
  if (Object.keys(searchWhere).length > 0) conditions.push(searchWhere);

  if (filters.entity) conditions.push({ entity: filters.entity });
  if (filters.department) conditions.push({ department: filters.department });

  if (filters.degree && filters.degree in DEGREE_LABELS) {
    conditions.push(buildHighestDegreeWhere(filters.degree as FacultyDegreeType));
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

async function getFacultyStats(): Promise<FacultyStats> {
  const [totalFaculty, totalDegrees, phdHolders, mastersOrPhd, entitiesRows, departmentsRows, completionRows] =
    await Promise.all([
      prisma.user.count({ where: BASE_WHERE }),
      prisma.academicDegree.count({ where: { user: BASE_WHERE } }),
      prisma.user.count({
        where: { ...BASE_WHERE, ...buildHighestDegreeWhere("PHD") },
      }),
      prisma.user.count({
        where: {
          AND: [
            BASE_WHERE,
            {
              OR: [
                buildHighestDegreeWhere("MASTERS"),
                buildHighestDegreeWhere("PHD"),
              ],
            },
          ],
        },
      }),
      prisma.user.findMany({
        where: { ...BASE_WHERE, entity: { not: null } },
        select: { entity: true },
        distinct: ["entity"],
      }),
      prisma.user.findMany({
        where: { ...BASE_WHERE, department: { not: null } },
        select: { department: true },
        distinct: ["department"],
      }),
      prisma.user.findMany({
        where: BASE_WHERE,
        select: USER_COMPLETION_SELECT,
      }),
    ]);

  const completeProfiles = completionRows.filter((u) => calcProfileCompletePercent(u) === 100).length;
  const withAcademicDegrees = await prisma.user.count({
    where: { ...BASE_WHERE, academicDegrees: { some: {} } },
  });

  return {
    totalFaculty,
    totalDegrees,
    phdHolders,
    mastersHolders: mastersOrPhd,
    entitiesCount: entitiesRows.length,
    departmentsCount: departmentsRows.length,
    completeProfiles,
    incompleteProfiles: totalFaculty - completeProfiles,
    withAcademicDegrees,
  };
}

async function getFilterOptions(entityFilter: string) {
  const [entitiesRows, departmentsRows] = await Promise.all([
    prisma.user.findMany({
      where: { ...BASE_WHERE, entity: { not: null } },
      select: { entity: true },
      distinct: ["entity"],
      orderBy: { entity: "asc" },
    }),
    prisma.user.findMany({
      where: {
        ...BASE_WHERE,
        department: { not: null },
        ...(entityFilter ? { entity: entityFilter } : {}),
      },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
  ]);

  return {
    entities: entitiesRows.map((r) => r.entity as string),
    departments: departmentsRows.map((r) => r.department as string),
  };
}

async function fetchUsersByIds(ids: string[]): Promise<UserListRow[]> {
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: USER_LIST_SELECT,
  });

  const byId = new Map(users.map((u) => [u.id, u]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as UserListRow[];
}

async function getPaginatedFaculty(
  where: Prisma.UserWhereInput,
  filters: FacultyListFilters
): Promise<{ faculty: FacultyMember[]; totalCount: number }> {
  const pageSize = filters.pageSize || FACULTY_PAGE_SIZE;
  const page = filters.page;
  const skip = (page - 1) * pageSize;

  const needsCompletionFilter =
    filters.completion === "complete" || filters.completion === "incomplete";

  if (needsCompletionFilter) {
    const candidates = await prisma.user.findMany({
      where,
      select: USER_COMPLETION_SELECT,
      orderBy: LIST_ORDER,
    });

    const filteredIds = candidates
      .filter((user) => {
        const percent = calcProfileCompletePercent(user);
        if (filters.completion === "complete") return percent === 100;
        return percent < 100;
      })
      .map((u) => u.id);

    const totalCount = filteredIds.length;
    const pageIds = filteredIds.slice(skip, skip + pageSize);
    const users = await fetchUsersByIds(pageIds);

    return { faculty: users.map(mapUserToFacultyMember), totalCount };
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: USER_LIST_SELECT,
      orderBy: LIST_ORDER,
      skip,
      take: pageSize,
    }),
  ]);

  return { faculty: users.map(mapUserToFacultyMember), totalCount };
}

export async function getFacultyPageData(filters: FacultyListFilters): Promise<FacultyPageData> {
  const pageSize = filters.pageSize || FACULTY_PAGE_SIZE;
  let page = Math.max(1, filters.page);

  const normalizedFilters: FacultyListFilters = {
    ...filters,
    page,
    pageSize,
  };

  const where = buildListWhere(normalizedFilters);

  let { faculty, totalCount } = await getPaginatedFaculty(where, normalizedFilters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (page > totalPages && totalCount > 0) {
    page = totalPages;
    normalizedFilters.page = page;
    ({ faculty, totalCount } = await getPaginatedFaculty(where, normalizedFilters));
  }

  const [stats, filterOptions] = await Promise.all([
    getFacultyStats(),
    getFilterOptions(normalizedFilters.entity),
  ]);

  return {
    faculty,
    stats,
    entities: filterOptions.entities,
    departments: filterOptions.departments,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      rowOffset: (page - 1) * pageSize,
    },
    filters: { ...normalizedFilters, page },
  };
}

export async function getFacultyMemberById(userId: string): Promise<FacultyMemberDetail | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...FACULTY_BASE_WHERE },
    select: {
      id: true,
      email: true,
      fullNameAr: true,
      fullNameEn: true,
      phone: true,
      academicTitle: true,
      entity: true,
      department: true,
      generalSpecialization: true,
      specificSpecialization: true,
      employeeNumber: true,
      appointmentYear: true,
      isActive: true,
      researcherProfile: {
        select: { avatarUrl: true, avatarData: true },
      },
      profileCv: {
        select: { gender: true, dateOfBirth: true },
      },
      academicDegrees: {
        select: {
          id: true,
          degree: true,
          graduationYear: true,
          majorGeneral: true,
          majorSpecific: true,
          university: true,
          country: true,
        },
        orderBy: { graduationYear: "desc" },
      },
    },
  });

  if (!user) return null;

  const { type: highestDegreeType, label: highestDegree } = getHighestDegree(user.academicDegrees);
  const avatarUrl = user.researcherProfile?.avatarData
    ? `/api/avatar/${user.id}`
    : resolvePublicUrl(user.researcherProfile?.avatarUrl);

  const dateOfBirth = user.profileCv?.dateOfBirth
    ? user.profileCv.dateOfBirth.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return {
    id: user.id,
    fullNameAr: user.fullNameAr,
    fullNameEn: user.fullNameEn,
    displayName: getDisplayName(user.fullNameAr, user.fullNameEn),
    email: user.email,
    phone: user.phone,
    academicTitle: user.academicTitle,
    entity: user.entity,
    department: user.department,
    generalSpecialization: user.generalSpecialization,
    specificSpecialization: user.specificSpecialization,
    employeeNumber: user.employeeNumber,
    appointmentYear: user.appointmentYear,
    gender: user.profileCv?.gender
      ? (GENDER_LABELS[user.profileCv.gender] ?? user.profileCv.gender)
      : null,
    avatarUrl,
    highestDegree,
    highestDegreeType,
    degreesCount: user.academicDegrees.length,
    profileCompletePercent: calcProfileCompletePercent(user),
    isActive: user.isActive,
    dateOfBirth,
    degrees: user.academicDegrees.map((d) => ({
      id: d.id,
      degreeLabel: DEGREE_LABELS[d.degree],
      graduationYear: d.graduationYear,
      majorGeneral: d.majorGeneral,
      majorSpecific: d.majorSpecific,
      university: d.university,
      country: d.country,
    })),
  };
}

export async function deleteFacultyMember(
  targetId: string,
  actorId: string
): Promise<{ ok: true } | { error: string }> {
  if (targetId === actorId) {
    return { error: "لا يمكنك حذف حسابك الخاص" };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      role: true,
      userRoles: { select: { role: { select: { name: true } } } },
    },
  });

  if (!target) {
    return { error: "التدريسي غير موجود" };
  }

  if (target.role !== "RESEARCHER") {
    return { error: "لا يمكن حذف هذا الحساب" };
  }

  const isAdmin = target.userRoles.some((entry) => entry.role.name === "ADMIN");
  if (isAdmin) {
    return { error: "لا يمكن حذف حساب إداري" };
  }

  try {
    await prisma.user.delete({ where: { id: targetId } });
    return { ok: true };
  } catch {
    return { error: "فشل حذف الحساب من قاعدة البيانات" };
  }
}
