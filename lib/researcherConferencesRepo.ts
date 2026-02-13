import { prisma } from "@/lib/db";
import type { Prisma, ResearcherConferenceScope, ResearcherConferenceParticipationType } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).researcherConference;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل المؤتمرات. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherConferenceInput = {
  title: string;
  sponsor: string;
  date: Date;
  location: string;
  scope: ResearcherConferenceScope;
  isCommitteeMember: boolean;
  participationType: ResearcherConferenceParticipationType;
};

export type ResearcherConferenceFilters = {
  search?: string;
  scope?: ResearcherConferenceScope | string;
  participationType?: ResearcherConferenceParticipationType | string;
};

export async function createResearcherConference(
  researcherId: string,
  data: CreateResearcherConferenceInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      sponsor: data.sponsor.trim(),
      date: data.date,
      location: data.location.trim(),
      scope: data.scope as ResearcherConferenceScope,
      isCommitteeMember: data.isCommitteeMember,
      participationType: data.participationType as ResearcherConferenceParticipationType,
    },
  });
}

export async function updateResearcherConference(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherConferenceInput>
) {
  const existing = await getResearcherConferenceById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.sponsor !== undefined) payload.sponsor = data.sponsor.trim();
  if (data.date !== undefined) payload.date = data.date;
  if (data.location !== undefined) payload.location = data.location.trim();
  if (data.scope !== undefined) payload.scope = data.scope;
  if (data.isCommitteeMember !== undefined) payload.isCommitteeMember = data.isCommitteeMember;
  if (data.participationType !== undefined) payload.participationType = data.participationType;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherConference(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherConferenceById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherConferenceFilters) {
  const where: Prisma.ResearcherConferenceWhereInput = {
    researcherId,
  };
  if (filters?.scope) {
    where.scope = filters.scope as ResearcherConferenceScope;
  }
  if (filters?.participationType) {
    where.participationType = filters.participationType as ResearcherConferenceParticipationType;
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { sponsor: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherConferences(
  researcherId: string,
  filters?: ResearcherConferenceFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
