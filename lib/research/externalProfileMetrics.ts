/**
 * استخراج مؤشرات بحثية ومنشورات مرتبطة بهوية الباحث.
 * مرجع الهوية الوحيد: حساب ORCID المحفوظ في /researcher/links.
 * لا يُستخدم الاسم للمطابقة أو الجلب.
 *
 * المصادر (مع إزالة التكرار بـ DOI/العنوان):
 * 1) ORCID → OpenAlex / سجل ORCID / Semantic Scholar
 * 2) Scopus و Web of Science من الروابط (عبر OpenAlex عند توفر المعرّف)
 * 3) البحوث المدخلة يدوياً في /researcher/activities/research
 */

export type ExternalMetricSource =
  | "openalex"
  | "semanticscholar"
  | "orcid"
  | "local"
  | "scopus"
  | "webofscience";

export type PublicationSourceKind =
  | "openalex"
  | "orcid"
  | "semanticscholar"
  | "local"
  | "scopus"
  | "webofscience";

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
    hasWebOfScience: boolean;
    hasResearchGate: boolean;
  };
  notes: string[];
  fetchedAt: string;
};

type ResearcherLinksLike = {
  orcid?: string | null;
  googleScholar?: string | null;
  scopus?: string | null;
  webOfScience?: string | null;
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

/** استخراج Scopus Author ID من الرابط المحفوظ في صفحة الروابط */
export function extractScopusAuthorId(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  const match =
    value.match(/authorid[=:](\d{6,})/i) ||
    value.match(/authorId[=:](\d{6,})/) ||
    value.match(/[?&]authorID=(\d{6,})/i) ||
    value.match(/authid\/detail\.uri\?[^#]*authorId=(\d{6,})/i);
  return match?.[1] ?? null;
}

/** استخراج ResearcherID من رابط Web of Science إن وُجد */
export function extractWebOfScienceResearcherId(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const match =
    raw.trim().match(/\b([A-Z]-\d{4}-\d{4})\b/i) ||
    raw.trim().match(/\/rid\/([A-Z]-\d{4}-\d{4})/i);
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
  const clean = orcid.trim();

  // 1) مسار المعرّف المباشر
  const direct = await fetchJson<OpenAlexAuthor>(
    `https://api.openalex.org/authors/https://orcid.org/${clean}?${mailtoParam()}`
  );
  if (direct?.id) return direct;

  // 2) صيغة orcid:XXXX
  const shorthand = await fetchJson<OpenAlexAuthor>(
    `https://api.openalex.org/authors/orcid:${clean}?${mailtoParam()}`
  );
  if (shorthand?.id) return shorthand;

  // 3) فلتر القائمة — الأكثر موثوقية عند فشل المسارات المباشرة
  const listed = await fetchJson<{ results?: OpenAlexAuthor[] }>(
    `https://api.openalex.org/authors?filter=orcid:${encodeURIComponent(clean)}&per_page=5&${mailtoParam()}`
  );
  const results = listed?.results ?? [];
  if (results.length === 0) return null;
  return [...results].sort((a, b) => (b.works_count ?? 0) - (a.works_count ?? 0))[0] ?? null;
}

/** حساب H-Index و i10 و Citations من قائمة المنشورات عند غياب إحصاءات الملف */
function computeCitationMetrics(works: ExternalPublication[]): {
  hIndex: number;
  i10Index: number;
  citedByCount: number;
} {
  const counts = works
    .map((w) => (typeof w.citedByCount === "number" && w.citedByCount > 0 ? w.citedByCount : 0))
    .sort((a, b) => b - a);

  let hIndex = 0;
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] >= i + 1) hIndex = i + 1;
    else break;
  }

  return {
    hIndex,
    i10Index: counts.filter((c) => c >= 10).length,
    citedByCount: counts.reduce((sum, c) => sum + c, 0),
  };
}

/**
 * OpenAlex أزال دعم تصفية المؤلفين بـ Scopus Author ID.
 * نُبقي الدالة للتوافق، وتعيد null دائماً مع الاعتماد على Elsevier API أو إثراء DOI.
 */
async function fetchOpenAlexByScopusId(_scopusAuthorId: string): Promise<OpenAlexAuthor | null> {
  return null;
}

/** إثراء المنشورات بعدد الاستشهادات عبر DOI من OpenAlex (عند غياب ملف مؤلف) */
async function enrichPublicationsWithOpenAlexCitations(
  works: ExternalPublication[]
): Promise<ExternalPublication[]> {
  const enriched: ExternalPublication[] = [];

  for (const work of works) {
    const doi = normalizeDoi(work.doi);
    if (!doi) {
      enriched.push(work);
      continue;
    }

    // لا نعيد الطلب إن كانت الاستشهادات موجودة مسبقاً من مصدر غني
    if (work.citedByCount > 0 && work.sources.includes("openalex")) {
      enriched.push(work);
      continue;
    }

    const data = await fetchJson<{
      id?: string;
      cited_by_count?: number;
      publication_year?: number | null;
      display_name?: string;
    }>(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?${mailtoParam()}`);

    if (!data) {
      enriched.push(work);
      continue;
    }

    enriched.push({
      ...work,
      title: work.title || data.display_name || work.title,
      year: work.year ?? data.publication_year ?? null,
      citedByCount: Math.max(work.citedByCount ?? 0, data.cited_by_count ?? 0),
      openAlexUrl: work.openAlexUrl ?? data.id ?? null,
      url: work.url ?? data.id ?? (doi ? `https://doi.org/${doi}` : null),
      sources: Array.from(new Set([...work.sources, "openalex" as PublicationSourceKind])),
    });
  }

  return enriched;
}

/**
 * مؤشرات Scopus الرسمية عبر Elsevier Author Retrieval (إن وُجد مفتاح API).
 * المتغيرات المدعومة: SCOPUS_API_KEY أو ELSEVIER_API_KEY
 */
async function fetchScopusAuthorMetrics(scopusAuthorId: string): Promise<{
  hIndex: number | null;
  citationCount: number | null;
  documentCount: number | null;
  name: string | null;
} | null> {
  const apiKey = process.env.SCOPUS_API_KEY || process.env.ELSEVIER_API_KEY;
  if (!apiKey?.trim()) return null;

  const id = scopusAuthorId.trim();
  const url = `https://api.elsevier.com/content/author/author_id/${encodeURIComponent(id)}?view=METRICS`;
  const data = await fetchJson<{
    "author-retrieval-response"?: Array<{
      "h-index"?: string | number;
      coredata?: {
        "citation-count"?: string | number;
        "cited-by-count"?: string | number;
        "document-count"?: string | number;
        "dc:identifier"?: string;
      };
      "author-profile"?: {
        "preferred-name"?: {
          "given-name"?: string;
          surname?: string;
        };
      };
    }>;
  }>(url, {
    headers: {
      Accept: "application/json",
      "X-ELS-APIKey": apiKey,
    },
  });

  const row = data?.["author-retrieval-response"]?.[0];
  if (!row) return null;

  const toNum = (value: string | number | undefined | null): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const given = row["author-profile"]?.["preferred-name"]?.["given-name"]?.trim() || "";
  const surname = row["author-profile"]?.["preferred-name"]?.surname?.trim() || "";
  const name = `${given} ${surname}`.trim() || null;

  return {
    hIndex: toNum(row["h-index"]),
    citationCount:
      toNum(row.coredata?.["citation-count"]) ?? toNum(row.coredata?.["cited-by-count"]),
    documentCount: toNum(row.coredata?.["document-count"]),
    name,
  };
}

function tagPublications(
  works: ExternalPublication[],
  source: PublicationSourceKind,
  categories: string[] = []
): ExternalPublication[] {
  return works.map((work) => ({
    ...work,
    sources: Array.from(new Set([...work.sources, source])),
    categories: Array.from(new Set([...work.categories, ...categories])),
  }));
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
  officialEmail?: string | null;
  preferredName?: string | null;
  nameCandidates?: Array<string | null | undefined>;
  /** بحوث المنصة المدخلة يدوياً في صفحة البحوث */
  localPublications?: LocalResearchInput[];
}): Promise<ExternalProfileMetrics> {
  const links = args.links ?? {};
  const platformName =
    pickPreferredPlatformName([...(args.nameCandidates ?? []), args.preferredName]) ?? null;

  const linksDetected = {
    hasOrcid: Boolean(links.orcid?.trim()),
    hasGoogleScholar: Boolean(links.googleScholar?.trim()),
    hasScopus: Boolean(links.scopus?.trim()),
    hasWebOfScience: Boolean(links.webOfScience?.trim()),
    hasResearchGate: Boolean(links.researchGate?.trim()),
  };

  const notes: string[] = [];
  const sourcesUsed: ExternalMetricSource[] = [];
  const publicationBuckets: ExternalPublication[][] = [];
  const seenOpenAlexAuthorIds = new Set<string>();

  notes.push(
    "المنشورات تُجلب عبر ORCID والبحوث اليدوية. أما H-Index و Citations و i10-Index فتعتمد على حساب Scopus في صفحة الروابط."
  );

  const localWorks = mapLocalResearch(args.localPublications);
  if (localWorks.length > 0) {
    publicationBuckets.push(localWorks);
    sourcesUsed.push("local");
    notes.push(
      `أُضيفت ${localWorks.length} منشوراً من البحوث المدخلة يدوياً في المنصة (بدون تكرار لاحقاً).`
    );
  }

  // —— بوابة الهوية: ORCID من صفحة الروابط حصراً ——
  const orcid = extractOrcid(links.orcid);
  if (!orcid) {
    const recentWorks = mergePublications(publicationBuckets);
    if (recentWorks.length > 0) {
      return {
        ok: true,
        message:
          "تم عرض البحوث المدخلة يدوياً فقط. لاستخراج H-Index والمنشورات الخارجية أضف رابط ORCID في صفحة الروابط.",
        platformName,
        displayName: platformName,
        identityMatch: "unavailable",
        matchScore: null,
        orcid: null,
        hIndex: null,
        i10Index: null,
        publications: recentWorks.length,
        citedByCount: null,
        twoYearMeanCitedness: null,
        institutions: [],
        topics: [],
        recentWorks,
        sourcesUsed: Array.from(new Set(sourcesUsed)),
        openAlexId: null,
        openAlexUrl: null,
        semanticScholarUrl: null,
        linksDetected,
        notes: [
          ...notes,
          "أضف ORCID من /researcher/links ثم اضغط تحديث.",
        ],
        fetchedAt: new Date().toISOString(),
      };
    }

    return emptyResult({
      ok: false,
      message:
        "تعذر الاستخراج: أضف حساب ORCID في صفحة الروابط (/researcher/links) لاعتماده كمرجع وحيد للهوية والبيانات البحثية.",
      platformName,
      identityMatch: "unavailable",
      linksDetected,
      notes,
      sourcesUsed: Array.from(new Set(sourcesUsed)),
      recentWorks: [],
    });
  }

  sourcesUsed.push("orcid");
  const identityMatch: IdentityMatchStatus = "matched";
  const matchScore = 100;
  notes.push(`تم اعتماد ORCID من روابط الباحث: ${orcid}`);

  // —— Scopus أولاً لمؤشرات H-Index / Citations / i10-Index ——
  const scopusAuthorId = extractScopusAuthorId(links.scopus);
  let scopusAuthor: OpenAlexAuthor | null = null;
  let scopusApiMetrics: Awaited<ReturnType<typeof fetchScopusAuthorMetrics>> = null;

  if (!linksDetected.hasScopus) {
    notes.push(
      "أضف رابط صفحة المؤلف في Scopus من /researcher/links لاعتماد H-Index و Citations و i10-Index."
    );
  } else if (!scopusAuthorId) {
    notes.push(
      "رابط Scopus موجود لكن تعذر استخراج Author ID. استخدم رابطاً مثل: https://www.scopus.com/authid/detail.uri?authorId=XXXXXXXX"
    );
  } else {
    notes.push(`تم رصد حساب Scopus من الروابط (Author ID: ${scopusAuthorId}) لاعتماد مؤشرات H/i10/Citations.`);
    sourcesUsed.push("scopus");
    scopusApiMetrics = await fetchScopusAuthorMetrics(scopusAuthorId);

    if (scopusApiMetrics) {
      notes.push(
        `مؤشرات Scopus الرسمية عبر Elsevier: H=${scopusApiMetrics.hIndex ?? "—"}, Citations=${scopusApiMetrics.citationCount ?? "—"}, Documents=${scopusApiMetrics.documentCount ?? "—"}.`
      );
    } else if (!process.env.SCOPUS_API_KEY && !process.env.ELSEVIER_API_KEY) {
      notes.push(
        "لا يوجد SCOPUS_API_KEY في .env — لا يمكن قراءة H-Index الرسمي من Scopus مباشرة. سيتم حساب المؤشرات من منشورات ORCID/المنصة بعد إثراء DOI."
      );
    } else {
      notes.push(
        "مفتاح Scopus موجود لكن الطلب فشل (صلاحية المفتاح/الحصة). تحقق من SCOPUS_API_KEY لدى Elsevier Developer Portal."
      );
    }

    // OpenAlex لم يعد يدعم ربط المؤلف بـ Scopus Author ID
    scopusAuthor = await fetchOpenAlexByScopusId(scopusAuthorId);
  }

  // ORCID لجلب المنشورات (وليس لمؤشرات H/i10/Citations)
  const [author, ssProfile] = await Promise.all([
    fetchOpenAlexByOrcid(orcid),
    fetchSemanticScholarByOrcid(orcid),
  ]);

  if (author?.id) {
    seenOpenAlexAuthorIds.add(author.id);
    sourcesUsed.push("openalex");
    notes.push("تم جلب ملف المؤلف من OpenAlex عبر ORCID لأغراض المنشورات.");
  } else {
    notes.push("تعذر جلب ملف OpenAlex عبر ORCID؛ سيتم الاعتماد على سجل ORCID وSemantic Scholar للمنشورات.");
  }

  if (ssProfile) {
    sourcesUsed.push("semanticscholar");
  }

  const fetchJobs: Array<Promise<void>> = [];

  if (author?.id) {
    const alreadyFromScopus = scopusAuthor?.id != null && author.id === scopusAuthor.id;
    if (!alreadyFromScopus) {
      const openAlexId = author.id;
      fetchJobs.push(
        (async () => {
          const worksResult = await fetchAllOpenAlexWorks(openAlexId);
          publicationBuckets.push(worksResult.works);
          if (worksResult.works.length > 0) sourcesUsed.push("openalex");
          if (worksResult.truncated) {
            notes.push(
              `تم جلب ${worksResult.totalFetched} منشوراً من OpenAlex (ORCID) كحد أقصى للأمان.`
            );
          } else if (worksResult.works.length > 0) {
            notes.push(
              `تم جلب منشورات OpenAlex المرتبطة بـ ORCID (${worksResult.works.length}).`
            );
          }
        })()
      );
    } else {
      notes.push("ملف ORCID يطابق ملف Scopus في OpenAlex — لا تكرار في جلب المنشورات.");
    }
  }

  fetchJobs.push(
    (async () => {
      const orcidWorks = await fetchOrcidWorks(orcid);
      if (orcidWorks.length > 0) {
        publicationBuckets.push(orcidWorks);
        sourcesUsed.push("orcid");
        notes.push(`أُضيفت ${orcidWorks.length} منشوراً من سجل ORCID.`);
      }
    })()
  );

  fetchJobs.push(
    (async () => {
      const ssPapers = await fetchSemanticScholarPapers(orcid);
      if (ssPapers.length > 0) {
        publicationBuckets.push(ssPapers);
        sourcesUsed.push("semanticscholar");
        notes.push(`أُضيفت ${ssPapers.length} منشوراً من Semantic Scholar عبر ORCID.`);
      }
    })()
  );

  // Web of Science من صفحة الروابط — مرجع + محاولة ربط محدودة عبر OpenAlex
  const wosRid = extractWebOfScienceResearcherId(links.webOfScience);
  if (linksDetected.hasWebOfScience) {
    if (wosRid) {
      notes.push(
        `تم حفظ حساب Web of Science (ResearcherID: ${wosRid}). واجهة Clarivate مدفوعة؛ الاعتماد الأساسي يبقى ORCID مع دمج المنشورات بلا تكرار.`
      );
      sourcesUsed.push("webofscience");
    } else {
      notes.push(
        "رابط Web of Science محفوظ في الروابط كمرجع. لا تتوفر واجهة مجانية لسحب المنشورات مباشرة من Clarivate؛ ORCID هو المصدر المعتمد."
      );
      sourcesUsed.push("webofscience");
    }
  }

  await Promise.all(fetchJobs);

  // إثراء DOI بالاستشهادات حتى تظهر H/i10/Citations عندما لا يتوفر ملف مؤلف في OpenAlex
  const mergedRaw = mergePublications(publicationBuckets);
  const recentWorks = await enrichPublicationsWithOpenAlexCitations(mergedRaw);
  const computedFromWorks = computeCitationMetrics(recentWorks);

  // H-Index / Citations من Scopus الرسمي إن وُجد المفتاح، وإلا من المنشورات المثرّاة
  let hIndex: number | null = scopusApiMetrics?.hIndex ?? null;
  let citedByCount: number | null = scopusApiMetrics?.citationCount ?? null;
  let i10Index: number | null = null;
  let publications: number | null = scopusApiMetrics?.documentCount ?? null;
  const semanticScholarUrl: string | null = ssProfile?.url ?? null;

  // i10 دائماً من المنشورات (Scopus API لا يوفّره عادةً)
  i10Index = computedFromWorks.i10Index;

  if (hIndex == null) hIndex = computedFromWorks.hIndex;
  if (citedByCount == null) citedByCount = computedFromWorks.citedByCount;

  if (scopusApiMetrics?.hIndex != null || scopusApiMetrics?.citationCount != null) {
    notes.push(
      `مؤشرات معتمدة من Scopus API: H=${hIndex ?? "—"}, Citations=${citedByCount ?? "—"} | i10 محسوب من المنشورات=${i10Index}.`
    );
  } else {
    notes.push(
      `مؤشرات محسوبة من المنشورات بعد إثراء DOI: H=${hIndex}, i10=${i10Index}, Citations=${citedByCount}. لإظهار أرقام Scopus الرسمية أضف SCOPUS_API_KEY في ملف .env.`
    );
  }

  if (recentWorks.length > 0) {
    publications = Math.max(publications ?? 0, recentWorks.length);
  } else if (publications == null) {
    publications = 0;
  }

  const openAlexId = scopusAuthor?.id ?? author?.id ?? null;

  return {
    ok: true,
    message: scopusAuthorId
      ? "تم اعتماد H-Index و Citations و i10-Index من حساب Scopus، مع جلب المنشورات عبر ORCID ودمج البحوث اليدوية بلا تكرار."
      : "تم جلب المنشورات عبر ORCID/البحوث اليدوية. أضف رابط Scopus في صفحة الروابط لإظهار H-Index و Citations و i10-Index.",
    platformName,
    displayName:
      scopusApiMetrics?.name ??
      scopusAuthor?.display_name ??
      author?.display_name ??
      ssProfile?.name ??
      platformName,
    identityMatch,
    matchScore,
    orcid: extractOrcid(author?.orcid) ?? orcid,
    hIndex,
    i10Index,
    publications,
    citedByCount,
    twoYearMeanCitedness: scopusAuthor?.summary_stats?.["2yr_mean_citedness"] ?? null,
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
