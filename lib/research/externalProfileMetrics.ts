/**
 * استخراج مؤشرات بحثية ومنشورات مرتبطة بهوية الباحث.
 * مرجع الهوية الأساسي (بتوجيه إدارة الجامعة): البريد الإلكتروني الرسمي.
 *
 * المنشورات تُجمع من:
 * 1) البحوث المحلية المسجّلة على المنصة (SCOPUS / ISI / محلي)
 * 2) ORCID عبر الروابط أو عبر البريد الرسمي
 * 3) OpenAlex (ملف المؤلف + بحث اسم المؤلف المنشور)
 * 4) Semantic Scholar عبر ORCID
 *
 * ملاحظة: واجهات Scopus و Web of Science المدفوعة غير متاحة هنا؛
 * نعتمد التصنيف المحلي + المصادر المفتوحة المرتبطة بالبريد/الاسم/ORCID.
 */

export type ExternalMetricSource =
  | "openalex"
  | "semanticscholar"
  | "orcid"
  | "email_orcid"
  | "name_search"
  | "local";

export type PublicationSourceKind =
  | "openalex"
  | "orcid"
  | "semanticscholar"
  | "local";

export type IdentityMatchStatus = "matched" | "mismatch" | "uncertain" | "unavailable";

export type ExternalPublication = {
  title: string;
  year: number | null;
  citedByCount: number;
  doi: string | null;
  openAlexUrl: string | null;
  url: string | null;
  sources: PublicationSourceKind[];
  categories: string[];
};

export type LocalResearchInput = {
  title: string;
  year: number;
  doi?: string | null;
  researchUrl?: string | null;
  downloadUrl?: string | null;
  categories?: string[];
};

export type ExternalProfileMetrics = {
  ok: boolean;
  message: string;
  platformName: string | null;
  displayName: string | null;
  identityMatch: IdentityMatchStatus;
  matchScore: number | null;
  orcid: string | null;
  hIndex: number | null;
  i10Index: number | null;
  publications: number | null;
  citedByCount: number | null;
  twoYearMeanCitedness: number | null;
  institutions: string[];
  topics: string[];
  recentWorks: ExternalPublication[];
  sourcesUsed: ExternalMetricSource[];
  openAlexId: string | null;
  openAlexUrl: string | null;
  semanticScholarUrl: string | null;
  linksDetected: {
    hasOrcid: boolean;
    hasGoogleScholar: boolean;
    hasScopus: boolean;
    hasResearchGate: boolean;
  };
  notes: string[];
  fetchedAt: string;
};

type ResearcherLinksLike = {
  orcid?: string | null;
  googleScholar?: string | null;
  scopus?: string | null;
  researchGate?: string | null;
};

type OpenAlexAuthor = {
  id?: string;
  display_name?: string;
  orcid?: string | null;
  works_count?: number;
  cited_by_count?: number;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
    "2yr_mean_citedness"?: number;
  };
  last_known_institutions?: Array<{ display_name?: string }>;
  topics?: Array<{ display_name?: string }>;
};

type OpenAlexWork = {
  id?: string;
  title?: string;
  display_name?: string;
  publication_year?: number | null;
  cited_by_count?: number;
  doi?: string | null;
};

type NameCompatibility = {
  score: number;
  compatible: boolean;
  extraInExternal: string[];
  missingFromExternal: string[];
  reason: string;
};

const ORCID_RE = /\b(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\b/i;

const IGNORE_TOKENS = new Set([
  "al",
  "el",
  "bin",
  "ibn",
  "abu",
  "abd",
  "abdul",
  "dr",
  "prof",
  "professor",
  "eng",
  "mr",
  "mrs",
  "ms",
  "phd",
  "md",
]);

function mailtoParam() {
  const email = process.env.OPENALEX_MAILTO || "research-platform@uob.edu.iq";
  return `mailto=${encodeURIComponent(email)}`;
}

export function extractOrcid(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const match = raw.trim().match(ORCID_RE);
  return match?.[1]?.toUpperCase() ?? null;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeName(value: string): string[] {
  return normalizeName(value)
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !IGNORE_TOKENS.has(token));
}

export function evaluateNameCompatibility(
  platformName: string | null | undefined,
  externalName: string | null | undefined
): NameCompatibility {
  const platform = platformName?.trim() || "";
  const external = externalName?.trim() || "";

  if (!platform || !external) {
    return {
      score: 0,
      compatible: false,
      extraInExternal: [],
      missingFromExternal: [],
      reason: "لا يمكن التحقق من تطابق الاسم بسبب نقص البيانات.",
    };
  }

  const platformTokens = tokenizeName(platform);
  const externalTokens = tokenizeName(external);

  if (platformTokens.length === 0 || externalTokens.length === 0) {
    return {
      score: 0,
      compatible: false,
      extraInExternal: [],
      missingFromExternal: [],
      reason: "تعذر تفكيك الأسماء للمقارنة.",
    };
  }

  const platformSet = new Set(platformTokens);
  const externalSet = new Set(externalTokens);

  const missingFromExternal = platformTokens.filter((token) => !externalSet.has(token));
  const extraInExternal = externalTokens.filter((token) => !platformSet.has(token));

  const significantExtras = extraInExternal.filter((token) => token.length >= 4);
  if (significantExtras.length > 0) {
    return {
      score: Math.max(5, 40 - significantExtras.length * 15),
      compatible: false,
      extraInExternal: significantExtras,
      missingFromExternal,
      reason: `الاسم في المصدر يحتوي أجزاء غير موجودة في اسمك (${significantExtras.join("، ")}) — يُحتمل أنه باحث آخر.`,
    };
  }

  const significantMissing = missingFromExternal.filter((token) => token.length >= 4);
  if (significantMissing.length > 0) {
    return {
      score: Math.max(10, 55 - significantMissing.length * 15),
      compatible: false,
      extraInExternal,
      missingFromExternal: significantMissing,
      reason: `اسمك يحتوي أجزاء غير موجودة في المصدر (${significantMissing.join("، ")}) — المطابقة غير مؤكدة.`,
    };
  }

  const overlap = platformTokens.filter((token) => externalSet.has(token)).length;
  const coverage = overlap / Math.max(platformTokens.length, 1);
  const score = Math.round(coverage * 100);

  if (coverage < 0.75) {
    return {
      score,
      compatible: false,
      extraInExternal,
      missingFromExternal,
      reason: "نسبة تطابق الاسم منخفضة؛ لن نعرض مؤشرات باحث غير مؤكد.",
    };
  }

  return {
    score,
    compatible: true,
    extraInExternal,
    missingFromExternal,
    reason: "الاسم متوافق مع ملفك على المنصة.",
  };
}

function pickPreferredPlatformName(names: Array<string | null | undefined>): string | null {
  const cleaned = names.map((n) => n?.trim()).filter((n): n is string => Boolean(n));
  if (cleaned.length === 0) return null;
  return [...cleaned].sort((a, b) => b.length - a.length)[0] ?? null;
}

function pickLatinName(names: Array<string | null | undefined>): string | null {
  const latin = names
    .map((n) => n?.trim())
    .filter((n): n is string => Boolean(n && /[A-Za-z]/.test(n)));
  if (latin.length === 0) return null;
  return [...latin].sort((a, b) => b.length - a.length)[0] ?? null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "UoB-ResearchPlatform/1.0 (external-metrics)",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeEmail(raw?: string | null): string | null {
  const email = raw?.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

function normalizeDoi(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim() || null;
}

function normalizeTitleKey(title: string, year: number | null): string {
  const cleaned = title
    .toLowerCase()
    .replace(/^\s*\[?\s*retracted\s*\]?\s*[:\-–—]?\s*/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned}::${year ?? ""}`;
}

function mergeSourceLists(
  a: PublicationSourceKind[],
  b: PublicationSourceKind[]
): PublicationSourceKind[] {
  return Array.from(new Set([...a, ...b]));
}

function mergeCategoryLists(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

export function mergePublications(lists: ExternalPublication[][]): ExternalPublication[] {
  const byDoi = new Map<string, ExternalPublication>();
  const byTitle = new Map<string, ExternalPublication>();
  const noKey: ExternalPublication[] = [];

  const upsert = (item: ExternalPublication) => {
    const doi = normalizeDoi(item.doi);
    if (doi) {
      const existing = byDoi.get(doi);
      if (!existing) {
        byDoi.set(doi, { ...item, doi });
        return;
      }
      byDoi.set(doi, {
        ...existing,
        title: existing.title.length >= item.title.length ? existing.title : item.title,
        year: existing.year ?? item.year,
        citedByCount: Math.max(existing.citedByCount, item.citedByCount),
        openAlexUrl: existing.openAlexUrl ?? item.openAlexUrl,
        url: existing.url ?? item.url,
        sources: mergeSourceLists(existing.sources, item.sources),
        categories: mergeCategoryLists(existing.categories, item.categories),
      });
      return;
    }

    const titleKey = normalizeTitleKey(item.title, item.year);
    if (!titleKey.startsWith("::")) {
      const existing = byTitle.get(titleKey);
      if (!existing) {
        byTitle.set(titleKey, { ...item });
        return;
      }
      byTitle.set(titleKey, {
        ...existing,
        citedByCount: Math.max(existing.citedByCount, item.citedByCount),
        openAlexUrl: existing.openAlexUrl ?? item.openAlexUrl,
        url: existing.url ?? item.url,
        sources: mergeSourceLists(existing.sources, item.sources),
        categories: mergeCategoryLists(existing.categories, item.categories),
        doi: existing.doi ?? item.doi,
      });
      return;
    }

    noKey.push({ ...item });
  };

  for (const list of lists) {
    for (const item of list) {
      if (!item.title?.trim()) continue;
      upsert(item);
    }
  }

  // اربط عناصر العنوان بعناصر DOI إن تطابقت لاحقاً عبر العنوان
  for (const [titleKey, item] of byTitle) {
    const doi = normalizeDoi(item.doi);
    if (doi && byDoi.has(doi)) {
      const existing = byDoi.get(doi)!;
      byDoi.set(doi, {
        ...existing,
        sources: mergeSourceLists(existing.sources, item.sources),
        categories: mergeCategoryLists(existing.categories, item.categories),
        citedByCount: Math.max(existing.citedByCount, item.citedByCount),
        openAlexUrl: existing.openAlexUrl ?? item.openAlexUrl,
        url: existing.url ?? item.url,
      });
      byTitle.delete(titleKey);
    }
  }

  const merged = [...byDoi.values(), ...byTitle.values(), ...noKey];
  merged.sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return a.title.localeCompare(b.title, "en", { sensitivity: "base" });
  });
  return merged;
}

function mapLocalResearch(rows: LocalResearchInput[] | undefined): ExternalPublication[] {
  if (!rows?.length) return [];
  return rows
    .filter((row) => row.title?.trim())
    .map((row) => ({
      title: row.title.trim(),
      year: Number.isFinite(row.year) ? row.year : null,
      citedByCount: 0,
      doi: normalizeDoi(row.doi),
      openAlexUrl: null,
      url: row.researchUrl?.trim() || row.downloadUrl?.trim() || null,
      sources: ["local"] as PublicationSourceKind[],
      categories: Array.from(new Set(row.categories ?? [])),
    }));
}

async function fetchOpenAlexByOrcid(orcid: string): Promise<OpenAlexAuthor | null> {
  const url = `https://api.openalex.org/authors/https://orcid.org/${orcid}?${mailtoParam()}`;
  return fetchJson<OpenAlexAuthor>(url);
}

/**
 * يبحث عن ORCID مرتبط بالبريد الرسمي عبر واجهة ORCID العامة.
 * يعمل فقط إذا كان البريد ظاهراً/قابلاً للبحث في سجل ORCID.
 */
async function searchOrcidByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const url = `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(`email:${normalized}`)}`;
  const data = await fetchJson<{
    result?: Array<{
      "orcid-identifier"?: { path?: string; uri?: string };
    }>;
    "num-found"?: number;
  }>(url, {
    headers: {
      Accept: "application/vnd.orcid+json",
    },
  });

  const path = data?.result?.[0]?.["orcid-identifier"]?.path;
  return extractOrcid(path ?? null);
}

async function searchOpenAlexByName(name: string): Promise<OpenAlexAuthor[]> {
  const q = name.trim();
  if (q.length < 3) return [];
  const url = `https://api.openalex.org/authors?search=${encodeURIComponent(q)}&per_page=8&${mailtoParam()}`;
  const data = await fetchJson<{ results?: OpenAlexAuthor[] }>(url);
  return data?.results ?? [];
}

const OPENALEX_WORKS_PAGE_SIZE = 200;
/** سقف أمان لمنع انتهاء مهلة الطلب على الملفات الضخمة جداً */
const OPENALEX_WORKS_HARD_CAP = 1000;

function mapOpenAlexWork(work: OpenAlexWork): ExternalPublication {
  const openAlexUrl = work.id ?? null;
  return {
    title: work.display_name || work.title || "بدون عنوان",
    year: work.publication_year ?? null,
    citedByCount: work.cited_by_count ?? 0,
    doi: normalizeDoi(work.doi),
    openAlexUrl,
    url: openAlexUrl,
    sources: ["openalex"],
    categories: [],
  };
}

/**
 * يجلب كل أعمال المؤلف من OpenAlex عبر ترقيم الصفحات (cursor)،
 * مرتبة من الأحدث للأقدم — وليس أحدث 8 فقط.
 */
async function fetchAllOpenAlexWorks(
  authorId: string,
  options?: { maxWorks?: number }
): Promise<{ works: ExternalPublication[]; truncated: boolean; totalFetched: number }> {
  const id = authorId.replace("https://openalex.org/", "");
  const maxWorks = Math.min(
    Math.max(options?.maxWorks ?? OPENALEX_WORKS_HARD_CAP, 1),
    OPENALEX_WORKS_HARD_CAP
  );

  const works: ExternalPublication[] = [];
  let cursor: string | null = "*";
  let pages = 0;
  const maxPages = Math.ceil(maxWorks / OPENALEX_WORKS_PAGE_SIZE) + 1;

  while (cursor && works.length < maxWorks && pages < maxPages) {
    pages += 1;
    const currentCursor: string = cursor;
    const url: string =
      `https://api.openalex.org/works?filter=author.id:${encodeURIComponent(id)}` +
      `&sort=publication_year:desc&per_page=${OPENALEX_WORKS_PAGE_SIZE}` +
      `&cursor=${encodeURIComponent(currentCursor)}&${mailtoParam()}`;

    const data = await fetchJson<{
      results?: OpenAlexWork[];
      meta?: { next_cursor?: string | null; count?: number };
    }>(url);

    const batch = data?.results ?? [];
    if (batch.length === 0) break;

    for (const work of batch) {
      works.push(mapOpenAlexWork(work));
      if (works.length >= maxWorks) break;
    }

    const next = data?.meta?.next_cursor ?? null;
    cursor = next && next.length > 0 ? next : null;
  }

  const truncated = Boolean(cursor) || works.length >= maxWorks;
  return { works, truncated, totalFetched: works.length };
}

function buildRawAuthorNameVariants(name: string): string[] {
  const tokens = name
    .trim()
    .replace(/,/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length < 2) return tokens.length === 1 ? [tokens[0]] : [];

  const forward = tokens.join(" ");
  const reversed = [...tokens].reverse().join(" ");
  const firstLast = `${tokens[0]} ${tokens[tokens.length - 1]}`;
  const lastFirst = `${tokens[tokens.length - 1]} ${tokens[0]}`;
  const initialLast =
    tokens[0].length > 0
      ? `${tokens[0][0]} ${tokens[tokens.length - 1]}`
      : null;

  return Array.from(
    new Set(
      [forward, reversed, firstLast, lastFirst, initialLast]
        .filter((v): v is string => Boolean(v && v.trim().length >= 3))
        .map((v) => v.toLowerCase())
    )
  );
}

/**
 * يجلب أعمالاً عبر اسم المؤلف كما يظهر في المنشورات (يشمل أعمالاً قد تفوت ملف author.id).
 * يُستخدم كمكمل بعد تأكيد الهوية أو كاحتياط مع الاسم اللاتيني.
 */
async function fetchOpenAlexWorksByRawAuthorName(
  name: string,
  options?: { maxWorks?: number }
): Promise<ExternalPublication[]> {
  const variants = buildRawAuthorNameVariants(name);
  if (variants.length === 0) return [];

  const quoted = variants.map((v) => `"${v.replace(/"/g, "")}"`).join(" OR ");
  const maxWorks = Math.min(
    Math.max(options?.maxWorks ?? OPENALEX_WORKS_HARD_CAP, 1),
    OPENALEX_WORKS_HARD_CAP
  );

  const works: ExternalPublication[] = [];
  let cursor: string | null = "*";
  let pages = 0;
  const maxPages = Math.ceil(maxWorks / OPENALEX_WORKS_PAGE_SIZE) + 1;

  while (cursor && works.length < maxWorks && pages < maxPages) {
    pages += 1;
    const currentCursor: string = cursor;
    const filter = `raw_author_name.search:${quoted},type:!paratext`;
    const url: string =
      `https://api.openalex.org/works?filter=${encodeURIComponent(filter)}` +
      `&sort=publication_year:desc&per_page=${OPENALEX_WORKS_PAGE_SIZE}` +
      `&cursor=${encodeURIComponent(currentCursor)}&${mailtoParam()}`;

    const data = await fetchJson<{
      results?: OpenAlexWork[];
      meta?: { next_cursor?: string | null; count?: number };
    }>(url);

    const batch = data?.results ?? [];
    if (batch.length === 0) break;

    for (const work of batch) {
      works.push(mapOpenAlexWork(work));
      if (works.length >= maxWorks) break;
    }

    const next = data?.meta?.next_cursor ?? null;
    cursor = next && next.length > 0 ? next : null;
  }

  return works;
}

async function fetchOrcidWorks(orcid: string): Promise<ExternalPublication[]> {
  const url = `https://pub.orcid.org/v3.0/${orcid}/works`;
  const data = await fetchJson<{
    group?: Array<{
      "work-summary"?: Array<{
        title?: { title?: { value?: string } };
        "publication-date"?: { year?: { value?: string } };
        "external-ids"?: {
          "external-id"?: Array<{
            "external-id-type"?: string;
            "external-id-value"?: string;
            "external-id-url"?: { value?: string };
          }>;
        };
        url?: { value?: string };
      }>;
    }>;
  }>(url, {
    headers: {
      Accept: "application/vnd.orcid+json",
    },
  });

  if (!data?.group?.length) return [];

  const works: ExternalPublication[] = [];
  for (const group of data.group) {
    const summary = group["work-summary"]?.[0];
    if (!summary) continue;
    const title = summary.title?.title?.value?.trim();
    if (!title) continue;

    const yearRaw = summary["publication-date"]?.year?.value;
    const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;
    const externalIds = summary["external-ids"]?.["external-id"] ?? [];
    const doiEntry = externalIds.find((x) => x["external-id-type"]?.toLowerCase() === "doi");
    const doi = normalizeDoi(doiEntry?.["external-id-value"] ?? null);
    const urlValue =
      summary.url?.value ||
      doiEntry?.["external-id-url"]?.value ||
      (doi ? `https://doi.org/${doi}` : null);

    works.push({
      title,
      year: Number.isFinite(year) ? year : null,
      citedByCount: 0,
      doi,
      openAlexUrl: null,
      url: urlValue,
      sources: ["orcid"],
      categories: [],
    });
  }

  return works;
}

async function fetchSemanticScholarByOrcid(orcid: string): Promise<{
  hIndex: number | null;
  paperCount: number | null;
  citationCount: number | null;
  url: string | null;
  name: string | null;
  authorId: string | null;
} | null> {
  const url = `https://api.semanticscholar.org/graph/v1/author/ORCID:${orcid}?fields=name,url,hIndex,citationCount,paperCount,authorId`;
  const data = await fetchJson<{
    authorId?: string;
    name?: string;
    url?: string;
    hIndex?: number;
    citationCount?: number;
    paperCount?: number;
  }>(url);
  if (!data) return null;
  return {
    hIndex: typeof data.hIndex === "number" ? data.hIndex : null,
    paperCount: typeof data.paperCount === "number" ? data.paperCount : null,
    citationCount: typeof data.citationCount === "number" ? data.citationCount : null,
    url: data.url ?? null,
    name: data.name ?? null,
    authorId: data.authorId ?? null,
  };
}

async function fetchSemanticScholarPapers(orcid: string): Promise<ExternalPublication[]> {
  const works: ExternalPublication[] = [];
  let offset = 0;
  const limit = 100;
  const hardCap = OPENALEX_WORKS_HARD_CAP;

  while (works.length < hardCap) {
    const url =
      `https://api.semanticscholar.org/graph/v1/author/ORCID:${orcid}/papers` +
      `?fields=title,year,citationCount,externalIds,url&limit=${limit}&offset=${offset}`;
    const data = await fetchJson<{
      data?: Array<{
        title?: string;
        year?: number | null;
        citationCount?: number;
        url?: string;
        externalIds?: { DOI?: string };
      }>;
      next?: number | null;
    }>(url);

    const batch = data?.data ?? [];
    if (batch.length === 0) break;

    for (const paper of batch) {
      if (!paper.title?.trim()) continue;
      works.push({
        title: paper.title.trim(),
        year: typeof paper.year === "number" ? paper.year : null,
        citedByCount: typeof paper.citationCount === "number" ? paper.citationCount : 0,
        doi: normalizeDoi(paper.externalIds?.DOI ?? null),
        openAlexUrl: null,
        url: paper.url ?? null,
        sources: ["semanticscholar"],
        categories: [],
      });
      if (works.length >= hardCap) break;
    }

    if (data?.next == null || batch.length < limit) break;
    offset = data.next;
  }

  return works;
}

function emptyResult(
  partial: Partial<ExternalProfileMetrics> &
    Pick<ExternalProfileMetrics, "message" | "linksDetected" | "notes" | "identityMatch">
): ExternalProfileMetrics {
  return {
    ok: false,
    displayName: null,
    platformName: null,
    matchScore: null,
    orcid: null,
    hIndex: null,
    i10Index: null,
    publications: null,
    citedByCount: null,
    twoYearMeanCitedness: null,
    institutions: [],
    topics: [],
    recentWorks: [],
    sourcesUsed: [],
    openAlexId: null,
    openAlexUrl: null,
    semanticScholarUrl: null,
    fetchedAt: new Date().toISOString(),
    ...partial,
  };
}

export async function resolveExternalProfileMetrics(args: {
  links: ResearcherLinksLike | null | undefined;
  /** البريد الرسمي للباحث — مرجع الهوية الأساسي */
  officialEmail?: string | null;
  preferredName?: string | null;
  nameCandidates?: Array<string | null | undefined>;
  /** بحوث المنصة المحلية (سكوبس / ISI / محلي) */
  localPublications?: LocalResearchInput[];
}): Promise<ExternalProfileMetrics> {
  const links = args.links ?? {};
  const officialEmail = normalizeEmail(args.officialEmail);
  const platformName =
    pickPreferredPlatformName([...(args.nameCandidates ?? []), args.preferredName]) ?? null;
  const latinName =
    pickLatinName([...(args.nameCandidates ?? []), args.preferredName]) ?? null;

  const linksDetected = {
    hasOrcid: Boolean(links.orcid?.trim()),
    hasGoogleScholar: Boolean(links.googleScholar?.trim()),
    hasScopus: Boolean(links.scopus?.trim()),
    hasResearchGate: Boolean(links.researchGate?.trim()),
  };

  const notes: string[] = [];
  const sourcesUsed: ExternalMetricSource[] = [];
  const publicationBuckets: ExternalPublication[][] = [];

  const localWorks = mapLocalResearch(args.localPublications);
  if (localWorks.length > 0) {
    publicationBuckets.push(localWorks);
    sourcesUsed.push("local");
    notes.push(
      `أُضيفت ${localWorks.length} منشوراً من سجل البحوث على المنصة (بما فيها المصنّفة SCOPUS / ISI / محلي).`
    );
  }

  notes.push(
    "مرجع الهوية المعتمد: البريد الإلكتروني الرسمي للباحث (حسب توجيه إدارة الجامعة)، لأن الأسماء قد تختلف بين الأبحاث."
  );
  notes.push(
    "Scopus و Web of Science لا يوفران واجهة مجانية مباشرة؛ نعتمد البحوث المحلية المصنّفة لديهما مع المصادر المفتوحة المرتبطة بالبريد/الاسم/ORCID."
  );

  if (linksDetected.hasGoogleScholar) {
    notes.push("رابط Google Scholar موجود، لكن لا يتم سحبه مباشرة؛ نعتمد البريد/ORCID ثم OpenAlex.");
  }
  if (linksDetected.hasResearchGate) {
    notes.push("رابط ResearchGate محفوظ للمرجع فقط.");
  }
  if (linksDetected.hasScopus) {
    notes.push("رابط Scopus محفوظ للمرجع؛ الاستخراج الحالي يعتمد OpenAlex/ORCID/Semantic Scholar بدون مفتاح Scopus مدفوع.");
  }

  let orcid = extractOrcid(links.orcid);
  let orcidResolvedViaEmail = false;
  let author: OpenAlexAuthor | null = null;
  let usedNameSearch = false;
  let identityMatch: IdentityMatchStatus = "unavailable";
  let matchScore: number | null = null;

  // 1) ORCID من الروابط
  if (orcid) {
    author = await fetchOpenAlexByOrcid(orcid);
    if (author) {
      sourcesUsed.push("orcid", "openalex");
      identityMatch = "matched";
      matchScore = 100;
      notes.push("تم اعتماد ORCID المحفوظ في روابط الباحث كمعرّف ثابت.");
    } else {
      notes.push("تعذر إيجاد ملف مطابق في OpenAlex لـ ORCID المدخل.");
    }
  }

  // 2) اكتشاف ORCID عبر البريد الرسمي (مرجع الجامعة)
  if (!author && officialEmail) {
    const emailOrcid = await searchOrcidByEmail(officialEmail);
    if (emailOrcid) {
      orcid = emailOrcid;
      orcidResolvedViaEmail = true;
      author = await fetchOpenAlexByOrcid(emailOrcid);
      if (author) {
        sourcesUsed.push("email_orcid", "orcid", "openalex");
        identityMatch = "matched";
        matchScore = 100;
        notes.push(
          `تم ربط الهوية عبر البريد الرسمي (${officialEmail}) واكتشاف ORCID المطابق.`
        );
      } else {
        sourcesUsed.push("email_orcid", "orcid");
        identityMatch = "matched";
        matchScore = 100;
        notes.push(
          `عُثر على ORCID عبر البريد الرسمي (${emailOrcid})؛ سيُجلب الأعمال من ORCID/المصادر المفتوحة.`
        );
      }
    } else {
      notes.push(
        "لم يُعثر على ORCID عام مرتبط بالبريد الرسمي. تأكد أن البريد ظاهر/مرتبط في حساب ORCID، أو أضف ORCID يدوياً في الروابط."
      );
    }
  } else if (!author && !officialEmail) {
    notes.push("لا يوجد بريد رسمي على الحساب لاعتماده كمرجع هوية.");
  }

  // عند وجود ORCID موثوق: اختلاف كتابة الاسم لا يرفض النتيجة
  if ((author || orcid) && (orcidResolvedViaEmail || extractOrcid(links.orcid))) {
    if (author) {
      const compatibility = evaluateNameCompatibility(platformName, author.display_name);
      matchScore = matchScore ?? compatibility.score;
      if (!compatibility.compatible) {
        notes.push(
          `ملاحظة: اختلاف في كتابة الاسم («${platformName || "—"}» vs «${author.display_name || "—"}») — تم تجاهله لأن المرجع هو البريد/ORCID.`
        );
      } else {
        notes.push(compatibility.reason);
      }
    }
    identityMatch = "matched";
  }

  // 3) احتياط أخير: بحث بالاسم فقط إن تعذر البريد/ORCID
  if (!author && !orcid && platformName) {
    notes.push("الانتقال لاحتياط البحث بالاسم لأن البريد/ORCID لم يُنتجا ملفاً موثوقاً.");
    const candidates = await searchOpenAlexByName(latinName || platformName);
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        compatibility: evaluateNameCompatibility(platformName, candidate.display_name),
      }))
      .filter((row) => row.compatibility.compatible)
      .sort((a, b) => b.compatibility.score - a.compatibility.score);

    if (ranked.length > 0) {
      author = ranked[0].candidate;
      usedNameSearch = true;
      identityMatch = ranked[0].compatibility.score >= 90 ? "matched" : "uncertain";
      matchScore = ranked[0].compatibility.score;
      sourcesUsed.push("name_search", "openalex");
      notes.push(ranked[0].compatibility.reason);
      notes.push("يُفضّل لاحقاً ربط البريد الرسمي بـ ORCID لرفع موثوقية المطابقة.");
    } else if (candidates.length > 0) {
      const nearest = candidates
        .map((candidate) => evaluateNameCompatibility(platformName, candidate.display_name))
        .sort((a, b) => b.score - a.score)[0];
      notes.push(
        nearest?.reason ||
          "وُجدت نتائج بالاسم لكنها غير كافية كتأكيد هوية بدون بريد/ORCID."
      );
    }
  }

  const openAlexId = author?.id ?? null;

  // —— جلب المنشورات من كل المصادر المتاحة ——
  const fetchJobs: Array<Promise<void>> = [];

  if (openAlexId) {
    fetchJobs.push(
      (async () => {
        const worksResult = await fetchAllOpenAlexWorks(openAlexId);
        publicationBuckets.push(worksResult.works);
        if (worksResult.works.length > 0) sourcesUsed.push("openalex");
        if (worksResult.truncated) {
          notes.push(
            `تم جلب ${worksResult.totalFetched} منشوراً من OpenAlex كحد أقصى للأمان؛ قد يكون لدى المؤلف المزيد.`
          );
        } else if (worksResult.works.length > 0) {
          notes.push(
            `تم جلب جميع المنشورات المتاحة لهذا المؤلف من OpenAlex (${worksResult.works.length}).`
          );
        }
      })()
    );
  }

  if (orcid) {
    fetchJobs.push(
      (async () => {
        const orcidWorks = await fetchOrcidWorks(orcid!);
        if (orcidWorks.length > 0) {
          publicationBuckets.push(orcidWorks);
          sourcesUsed.push("orcid");
          notes.push(`أُضيفت ${orcidWorks.length} منشوراً من سجل ORCID.`);
        }
      })()
    );

    fetchJobs.push(
      (async () => {
        const ssPapers = await fetchSemanticScholarPapers(orcid!);
        if (ssPapers.length > 0) {
          publicationBuckets.push(ssPapers);
          sourcesUsed.push("semanticscholar");
          notes.push(`أُضيفت ${ssPapers.length} منشوراً من Semantic Scholar.`);
        }
      })()
    );
  }

  // بحث تكميلي باسم المؤلف المنشور — فقط بعد تأكيد الهوية (بريد/ORCID) لتفادي خلط باحثين آخرين
  const trustedIdentity = identityMatch === "matched" || Boolean(orcid);
  if (latinName && trustedIdentity) {
    fetchJobs.push(
      (async () => {
        const byName = await fetchOpenAlexWorksByRawAuthorName(latinName);
        if (byName.length > 0) {
          publicationBuckets.push(byName);
          sourcesUsed.push("openalex", "name_search");
          notes.push(
            `أُضيفت أعمال عبر مطابقة اسم المؤلف المنشور في OpenAlex (${byName.length}) للاسم: ${latinName}.`
          );
        }
      })()
    );
  }

  await Promise.all(fetchJobs);

  const recentWorks = mergePublications(publicationBuckets);

  let hIndex = author?.summary_stats?.h_index ?? null;
  let publications = author?.works_count ?? null;
  let citedByCount = author?.cited_by_count ?? null;
  let semanticScholarUrl: string | null = null;

  if (publications == null || (recentWorks.length > 0 && recentWorks.length > (publications ?? 0))) {
    publications = Math.max(publications ?? 0, recentWorks.length);
  } else if (recentWorks.length > 0) {
    publications = Math.max(publications ?? 0, recentWorks.length);
  }

  if (orcid) {
    const ss = await fetchSemanticScholarByOrcid(orcid);
    if (ss) {
      sourcesUsed.push("semanticscholar");
      semanticScholarUrl = ss.url;
      if (hIndex == null && ss.hIndex != null) hIndex = ss.hIndex;
      if (publications == null && ss.paperCount != null) {
        publications = Math.max(ss.paperCount, recentWorks.length);
      }
      if (citedByCount == null && ss.citationCount != null) citedByCount = ss.citationCount;
      if (ss.hIndex != null && hIndex != null && ss.hIndex !== hIndex) {
        notes.push(`فروقات مصادر طبيعية: H-Index OpenAlex=${hIndex} / Semantic Scholar=${ss.hIndex}.`);
      }
      if (ss.name && platformName) {
        const ssCompatibility = evaluateNameCompatibility(platformName, ss.name);
        if (!ssCompatibility.compatible) {
          notes.push(
            `اختلاف اسم في Semantic Scholar («${ss.name}») — مقبول لأن المرجع هو البريد/ORCID.`
          );
        }
      }
    }
  }

  const hasExternalIdentity = Boolean(author || orcid);
  const hasPublications = recentWorks.length > 0;

  if (!hasExternalIdentity && !hasPublications) {
    return emptyResult({
      ok: false,
      message: officialEmail
        ? "تعذر استخراج المؤشرات والمنشورات. اربط بريدك الرسمي بحساب ORCID (أو أضف ORCID في الروابط) وسجّل بحوثك المحلية ثم أعد المحاولة."
        : "تعذر استخراج المؤشرات. تأكد من وجود بريد رسمي على الحساب وأضف ORCID في الروابط.",
      platformName,
      orcid,
      identityMatch: identityMatch === "unavailable" ? "unavailable" : identityMatch,
      matchScore,
      linksDetected,
      notes,
      sourcesUsed: Array.from(new Set(sourcesUsed)),
      recentWorks: [],
    });
  }

  if (!hasExternalIdentity && hasPublications) {
    return {
      ok: true,
      message:
        "تم عرض المنشورات من سجل المنصة/البحث بالاسم. لرفع موثوقية المؤشرات الخارجية اربط البريد الرسمي بـ ORCID.",
      platformName,
      displayName: platformName,
      identityMatch: identityMatch === "unavailable" ? "uncertain" : identityMatch,
      matchScore,
      orcid,
      hIndex,
      i10Index: null,
      publications: recentWorks.length,
      citedByCount,
      twoYearMeanCitedness: null,
      institutions: [],
      topics: [],
      recentWorks,
      sourcesUsed: Array.from(new Set(sourcesUsed)),
      openAlexId: null,
      openAlexUrl: null,
      semanticScholarUrl,
      linksDetected,
      notes,
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    ok: true,
    message: orcidResolvedViaEmail
      ? "تم استخراج المؤشرات والمنشورات بالاعتماد على البريد الرسمي وربطه بـ ORCID، مع دمج البحوث المحلية."
      : identityMatch === "uncertain"
        ? "تم استخراج منشورات/مؤشرات بحذر (احتياط بالاسم). يُفضّل تأكيد الهوية عبر البريد/ORCID."
        : usedNameSearch
          ? "تم استخراج المنشورات باحتياط الاسم مع دمج السجل المحلي؛ المرجع الأفضل هو البريد الرسمي المرتبط بـ ORCID."
          : "تم استخراج المنشورات من المصادر المفتوحة والسجل المحلي مع اعتماد معرّف ثابت (ORCID/البريد).",
    platformName,
    displayName: author?.display_name ?? platformName,
    identityMatch,
    matchScore,
    orcid: extractOrcid(author?.orcid) ?? orcid,
    hIndex,
    i10Index: author?.summary_stats?.i10_index ?? null,
    publications,
    citedByCount,
    twoYearMeanCitedness: author?.summary_stats?.["2yr_mean_citedness"] ?? null,
    institutions: (author?.last_known_institutions ?? [])
      .map((x) => x.display_name)
      .filter((x): x is string => Boolean(x))
      .slice(0, 5),
    topics: (author?.topics ?? [])
      .map((x) => x.display_name)
      .filter((x): x is string => Boolean(x))
      .slice(0, 6),
    recentWorks,
    sourcesUsed: Array.from(new Set(sourcesUsed)),
    openAlexId,
    openAlexUrl: openAlexId,
    semanticScholarUrl,
    linksDetected,
    notes,
    fetchedAt: new Date().toISOString(),
  };
}
