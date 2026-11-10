import { prisma } from "@/lib/db";
import { resolvePublicUrl } from "@/lib/utils";
import { ensureUserProfileSlug } from "./slug";
import {
  arLabel,
  GENDER_AR,
  ASSIGNMENT_STATUS_AR,
  COMMITTEE_ROLE_AR,
  PARTICIPATION_AR,
  RESEARCH_STATUS_AR,
  PUBLISH_STATUS_AR,
  JOURNAL_ROLE_AR,
  DEGREE_TYPE_AR,
  PROJECT_STATUS_AR,
  REVIEWING_TYPE_AR,
  REVIEWING_STATUS_AR,
  VOLUNTEERING_ROLE_AR,
  FIELD_VISIT_TYPE_AR,
  THANKS_PARTICIPATION_AR,
} from "./labels";

export type CvListItem = {
  title: string;
  subtitle?: string;
  meta?: string;
  year?: string | number | null;
};

export type FullCvData = {
  userId: string;
  profileSlug: string | null;
  cvPublicEnabled: boolean;
  identity: {
    fullNameAr: string | null;
    fullNameEn: string | null;
    academicTitle: string | null;
    email: string;
    phone: string | null;
    entity: string | null;
    department: string | null;
    generalSpecialization: string | null;
    specificSpecialization: string | null;
    employeeNumber: string | null;
    appointmentYear: number | null;
    headline: string | null;
    bio: string | null;
    hasAvatar: boolean;
    /** مسار الصورة الجاهز للعرض */
    avatarSrc: string | null;
  };
  personal: {
    nationality: string | null;
    province: string | null;
    district: string | null;
    area: string | null;
    address: string | null;
    dateOfBirth: string | null;
    gender: string | null;
  };
  languages: Array<{ name: string; level: string }>;
  skills: Array<{ name: string; level: string }>;
  experiences: Array<{
    title: string;
    organization: string | null;
    period: string;
    description: string | null;
  }>;
  degrees: Array<{
    degree: string;
    university: string;
    country: string;
    year: number;
    majorGeneral: string;
    majorSpecific: string | null;
  }>;
  links: {
    googleScholar: string | null;
    researchGate: string | null;
    webOfScience: string | null;
    scopus: string | null;
    orcid: string | null;
    linkedIn: string | null;
    pubmed: string | null;
    github: string | null;
    personalWebsite: string | null;
    otherLinks: Array<{ label: string; url: string }>;
  } | null;
  activities: {
    research: CvListItem[];
    conferences: CvListItem[];
    positions: CvListItem[];
    seminars: CvListItem[];
    courses: CvListItem[];
    workshops: CvListItem[];
    assignments: CvListItem[];
    thanks: CvListItem[];
    committees: CvListItem[];
    certificates: CvListItem[];
    journals: CvListItem[];
    supervision: CvListItem[];
    reviewing: CvListItem[];
    volunteering: CvListItem[];
    fieldVisits: CvListItem[];
  };
};

const DEGREE_LABELS: Record<string, string> = {
  BACHELORS: "بكالوريوس",
  DIPLOMA: "دبلوم",
  HIGHER_DIPLOMA: "دبلوم عالي",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
  BOARD: "بورد",
};

const LANG_LABELS: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  NATIVE: "لغة أم",
};

const SKILL_LABELS: Record<string, string> = {
  LEVEL_1: "1/5",
  LEVEL_2: "2/5",
  LEVEL_3: "3/5",
  LEVEL_4: "4/5",
  LEVEL_5: "5/5",
};

function fmtDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return null;
  }
}

function yearOf(d: Date | null | undefined): string | null {
  if (!d) return null;
  return String(new Date(d).getFullYear());
}

function period(start: Date | null | undefined, end: Date | null | undefined, ongoing?: boolean) {
  const s = fmtDate(start) || "—";
  if (ongoing || !end) return `${s} – مستمر`;
  return `${s} – ${fmtDate(end)}`;
}

function durationLabel(y: number, m: number, d: number) {
  const parts: string[] = [];
  if (y) parts.push(`${y} سنة`);
  if (m) parts.push(`${m} شهر`);
  if (d) parts.push(`${d} يوم`);
  return parts.join(" · ") || undefined;
}

export async function getFullCvData(userId: string): Promise<FullCvData | null> {
  const profileSlug = await ensureUserProfileSlug(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      researcherProfile: {
        select: {
          bio: true,
          headline: true,
          avatarData: true,
          avatarUrl: true,
          phone: true,
          academicTitle: true,
        },
      },
      profileCv: {
        include: {
          languages: { orderBy: { createdAt: "asc" } },
          skills: { orderBy: { createdAt: "asc" } },
          experiences: { orderBy: { startDate: "desc" } },
        },
      },
      academicDegrees: { orderBy: { graduationYear: "desc" } },
      researcherLinks: true,
      research: { orderBy: { year: "desc" }, take: 50 },
      researcherConferences: { orderBy: { date: "desc" }, take: 40 },
      positions: { orderBy: { positionDate: "desc" }, take: 40 },
      seminars: { orderBy: { date: "desc" }, take: 40 },
      courses: { orderBy: { date: "desc" }, take: 40 },
      workshops: { orderBy: { date: "desc" }, take: 40 },
      assignments: { orderBy: { assignmentDate: "desc" }, take: 40 },
      thankYouLetters: { orderBy: { date: "desc" }, take: 40 },
      committees: { orderBy: { assignmentDate: "desc" }, take: 40 },
      certificates: { orderBy: { date: "desc" }, take: 40 },
      journals: { orderBy: { startDate: "desc" }, take: 40 },
      supervisions: { orderBy: { startDate: "desc" }, take: 40 },
      reviewings: { orderBy: { date: "desc" }, take: 40 },
      volunteerings: { orderBy: { startDate: "desc" }, take: 40 },
      fieldVisits: { orderBy: { activityDate: "desc" }, take: 40 },
    },
  });

  if (!user || !user.isActive) return null;

  const otherLinksRaw = user.researcherLinks?.otherLinks;
  const otherLinks: Array<{ label: string; url: string }> = Array.isArray(otherLinksRaw)
    ? (otherLinksRaw as Array<{ label?: string; url?: string }>)
        .filter((x) => x?.url?.trim())
        .map((x) => ({ label: x.label?.trim() || "رابط", url: x.url!.trim() }))
    : [];

  const hasAvatarData = Boolean(user.researcherProfile?.avatarData);
  const avatarFromUrl = resolvePublicUrl(user.researcherProfile?.avatarUrl);
  const avatarSrc = hasAvatarData
    ? `/api/avatar/${user.id}`
    : avatarFromUrl;

  const genderRaw = user.profileCv?.gender ?? user.gender ?? null;
  const genderAr = genderRaw
    ? arLabel(String(genderRaw), GENDER_AR) || String(genderRaw)
    : null;

  return {
    userId: user.id,
    profileSlug: profileSlug ?? user.profileSlug,
    cvPublicEnabled: user.cvPublicEnabled,
    identity: {
      fullNameAr: user.fullNameAr,
      fullNameEn: user.fullNameEn,
      academicTitle: user.researcherProfile?.academicTitle || user.academicTitle,
      email: user.email,
      phone: user.researcherProfile?.phone || user.phone,
      entity: user.entity,
      department: user.department,
      generalSpecialization: user.generalSpecialization,
      specificSpecialization: user.specificSpecialization,
      employeeNumber: user.employeeNumber,
      appointmentYear: user.appointmentYear,
      headline: user.researcherProfile?.headline ?? null,
      bio: user.researcherProfile?.bio ?? null,
      hasAvatar: Boolean(avatarSrc),
      avatarSrc,
    },
    personal: {
      nationality: user.profileCv?.nationality ?? null,
      province: user.profileCv?.province ?? null,
      district: user.profileCv?.district ?? null,
      area: user.profileCv?.area ?? null,
      address: user.profileCv?.address ?? null,
      dateOfBirth: fmtDate(user.profileCv?.dateOfBirth ?? user.dateOfBirth),
      gender: genderAr,
    },
    languages: (user.profileCv?.languages ?? []).map((l) => ({
      name: l.name,
      level: LANG_LABELS[l.level] || l.level,
    })),
    skills: (user.profileCv?.skills ?? []).map((s) => ({
      name: s.name,
      level: SKILL_LABELS[s.level] || s.level,
    })),
    experiences: (user.profileCv?.experiences ?? []).map((e) => ({
      title: e.title,
      organization: e.organization,
      period: period(e.startDate, e.endDate, !e.endDate),
      description: e.description,
    })),
    degrees: user.academicDegrees.map((d) => ({
      degree: DEGREE_LABELS[d.degree] || d.degree,
      university: d.university,
      country: d.country,
      year: d.graduationYear,
      majorGeneral: d.majorGeneral,
      majorSpecific: d.majorSpecific,
    })),
    links: user.researcherLinks
      ? {
          googleScholar: user.researcherLinks.googleScholar,
          researchGate: user.researcherLinks.researchGate,
          webOfScience: user.researcherLinks.webOfScience,
          scopus: user.researcherLinks.scopus,
          orcid: user.researcherLinks.orcid,
          linkedIn: user.researcherLinks.linkedIn,
          pubmed: user.researcherLinks.pubmed,
          github: user.researcherLinks.github,
          personalWebsite: user.researcherLinks.personalWebsite,
          otherLinks,
        }
      : null,
    activities: {
      research: user.research.map((r) => ({
        title: r.title,
        subtitle: [r.publisher, r.doi].filter(Boolean).join(" · ") || undefined,
        meta:
          arLabel(r.publishStatus ?? undefined, PUBLISH_STATUS_AR) ||
          arLabel(r.status, RESEARCH_STATUS_AR),
        year: r.year,
      })),
      conferences: user.researcherConferences.map((c) => ({
        title: c.title,
        subtitle: [c.sponsor, c.location].filter(Boolean).join(" · ") || undefined,
        meta: arLabel(c.participationType, PARTICIPATION_AR),
        year: yearOf(c.date),
      })),
      positions: user.positions.map((p) => ({
        title: p.title,
        subtitle: p.organization || undefined,
        meta: durationLabel(p.durationYears, p.durationMonths, p.durationDays),
        year: yearOf(p.positionDate),
      })),
      seminars: user.seminars.map((s) => ({
        title: s.title,
        subtitle: [s.beneficiary, s.location].filter(Boolean).join(" · ") || undefined,
        meta: arLabel(s.participationType, PARTICIPATION_AR),
        year: yearOf(s.date),
      })),
      courses: user.courses.map((c) => ({
        title: c.title,
        subtitle: [c.beneficiary, c.location].filter(Boolean).join(" · ") || undefined,
        meta: arLabel(c.participationType, PARTICIPATION_AR),
        year: yearOf(c.date),
      })),
      workshops: user.workshops.map((w) => ({
        title: w.title,
        subtitle: [w.beneficiary, w.location].filter(Boolean).join(" · ") || undefined,
        meta: arLabel(w.participationType, PARTICIPATION_AR),
        year: yearOf(w.date),
      })),
      assignments: user.assignments.map((a) => ({
        title: a.title,
        subtitle: arLabel(a.status, ASSIGNMENT_STATUS_AR),
        meta: a.completionDate ? `إنجاز: ${fmtDate(a.completionDate)}` : undefined,
        year: yearOf(a.assignmentDate),
      })),
      thanks: user.thankYouLetters.map((t) => ({
        title: t.issuingOrganization || "كتاب شكر",
        subtitle: t.reason || undefined,
        meta: arLabel(t.participationType ?? undefined, THANKS_PARTICIPATION_AR),
        year: yearOf(t.date),
      })),
      committees: user.committees.map((c) => ({
        title: c.title,
        subtitle: arLabel(c.role, COMMITTEE_ROLE_AR),
        meta: c.description?.slice(0, 80) || undefined,
        year: yearOf(c.assignmentDate),
      })),
      certificates: user.certificates.map((c) => ({
        title: c.title,
        subtitle: c.issuingOrganization || undefined,
        year: yearOf(c.date),
      })),
      journals: user.journals.map((j) => ({
        title: j.name,
        subtitle: arLabel(j.role, JOURNAL_ROLE_AR),
        meta: period(j.startDate, j.endDate, j.isActive),
        year: yearOf(j.startDate),
      })),
      supervision: user.supervisions.map((s) => ({
        title: s.studentName,
        subtitle: s.thesisTitle || undefined,
        meta:
          arLabel(s.degreeType, DEGREE_TYPE_AR) ||
          arLabel(s.status, PROJECT_STATUS_AR) ||
          period(s.startDate, s.endDate),
        year: yearOf(s.startDate),
      })),
      reviewing: user.reviewings.map((r) => ({
        title: r.title,
        subtitle: arLabel(r.type, REVIEWING_TYPE_AR),
        meta: arLabel(r.status, REVIEWING_STATUS_AR),
        year: yearOf(r.date),
      })),
      volunteering: user.volunteerings.map((v) => ({
        title: v.title,
        subtitle: v.organizationName || v.location || undefined,
        meta:
          arLabel(v.role, VOLUNTEERING_ROLE_AR) ||
          period(v.startDate, v.endDate, v.isOngoing),
        year: yearOf(v.startDate),
      })),
      fieldVisits: user.fieldVisits.map((f) => ({
        title: f.title || "زيارة ميدانية",
        subtitle: arLabel(f.type, FIELD_VISIT_TYPE_AR),
        meta: f.description?.slice(0, 80) || undefined,
        year: yearOf(f.activityDate),
      })),
    },
  };
}

export async function getFullCvDataBySlug(slug: string): Promise<FullCvData | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const user = await prisma.user.findFirst({
    where: {
      profileSlug: normalized,
      isActive: true,
      role: "RESEARCHER",
      cvPublicEnabled: true,
    },
    select: { id: true },
  });

  if (!user) return null;
  return getFullCvData(user.id);
}
