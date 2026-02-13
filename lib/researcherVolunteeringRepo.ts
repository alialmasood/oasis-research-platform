import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = prisma.volunteering;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل الأعمال الطوعية. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherVolunteeringInput = {
  title: string;
  type: "HELPING_POOR_NEEDY" | "ENVIRONMENTAL_PROTECTION" | "EMERGENCY_SUPPORT" | "CULTURAL_EDUCATIONAL_ACTIVITIES" | "HELPING_ELDERLY" | "SPORTS_ACTIVITIES" | "SOCIAL_ACTIVITIES" | "HOSPITALS_ORPHANAGES" | "EDUCATION_FIELD" | "COMMUNITY_DEVELOPMENT" | "HUMAN_RIGHTS" | "ARTS_CULTURE" | "TECHNOLOGY_COMMUNICATIONS" | "LAW_FIELD" | "HEALTH_FIELD" | "FIRST_AID" | "ANIMAL_WELFARE";
  role: "COORDINATOR" | "LEADER" | "PARTICIPANT" | "MEMBER" | "VOLUNTEER";
  organizationName: string;
  startDate: Date;
  endDate?: Date | null;
  isOngoing: boolean;
  durationYears: number;
  durationMonths: number;
  durationDays: number;
  durationUnit: "YEAR" | "MONTH" | "DAY";
  location?: string | null;
  beneficiaries?: string | null;
  certificates?: string | null;
  description?: string | null;
};

export type ResearcherVolunteeringFilters = {
  search?: string;
  type?: CreateResearcherVolunteeringInput["type"];
  role?: CreateResearcherVolunteeringInput["role"];
  year?: number;
};

export async function createResearcherVolunteering(
  researcherId: string,
  data: CreateResearcherVolunteeringInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      type: data.type,
      role: data.role,
      organizationName: data.organizationName.trim(),
      startDate: data.startDate,
      endDate: data.isOngoing ? null : (data.endDate || null),
      isOngoing: data.isOngoing,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      durationUnit: data.durationUnit,
      location: data.location?.trim() || null,
      beneficiaries: data.beneficiaries?.trim() || null,
      certificates: data.certificates?.trim() || null,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherVolunteering(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherVolunteeringInput>
) {
  const existing = await getResearcherVolunteeringById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.type !== undefined) payload.type = data.type;
  if (data.role !== undefined) payload.role = data.role;
  if (data.organizationName !== undefined) payload.organizationName = data.organizationName.trim();
  if (data.startDate !== undefined) payload.startDate = data.startDate;
  if (data.isOngoing !== undefined) {
    payload.isOngoing = data.isOngoing;
    if (data.isOngoing) {
      payload.endDate = null;
    } else if (data.endDate !== undefined) {
      payload.endDate = data.endDate;
    }
  } else if (data.endDate !== undefined) {
    payload.endDate = data.endDate;
  }
  if (data.durationYears !== undefined) payload.durationYears = data.durationYears;
  if (data.durationMonths !== undefined) payload.durationMonths = data.durationMonths;
  if (data.durationDays !== undefined) payload.durationDays = data.durationDays;
  if (data.durationUnit !== undefined) payload.durationUnit = data.durationUnit;
  if (data.location !== undefined) payload.location = data.location?.trim() || null;
  if (data.beneficiaries !== undefined) payload.beneficiaries = data.beneficiaries?.trim() || null;
  if (data.certificates !== undefined) payload.certificates = data.certificates?.trim() || null;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherVolunteering(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherVolunteeringById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherVolunteeringFilters) {
  const where: Prisma.VolunteeringWhereInput = {
    researcherId,
  };
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.role) {
    where.role = filters.role;
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.startDate = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { organizationName: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherVolunteerings(
  researcherId: string,
  filters?: ResearcherVolunteeringFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
}
