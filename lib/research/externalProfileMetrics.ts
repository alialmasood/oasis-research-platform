/**
 * استخراج مؤشرات بحثية من روابط الباحث عبر مصادر مفتوحة موثوقة.
 * مرجع الهوية الأساسي (بتوجيه إدارة الجامعة): البريد الإلكتروني الرسمي.
 * ترتيب الاستخراج:
 * 1) ORCID من الروابط إن وُجد
 * 2) اكتشاف ORCID عبر البريد الرسمي (ORCID Public API)
 * 3) OpenAlex / Semantic Scholar
 * 4) بحث بالاسم كاحتياط أخير فقط (الأسماء تختلف بين الأبحاث)
 */

export type ExternalMetricSource =
  | "openalex"
  | "semanticscholar"
  | "orcid"
  | "email_orcid"
  | "name_search";

export type IdentityMatchStatus = "matched" | "mismatch" | "uncertain" | "unavailable";

export type ExternalPublication = {
  title: string;
  year: number | null;
  citedByCount: number;
  doi: string | null;
  openAlexUrl: string | null;
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
  "bint",
  "ibn",
  "von",
  "van",
  "de",
  "da",
  "dos",
  "del",
  "della",
  "der",
  "den",
  "la",
  "le",
  "the",
  "of",
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
  return {
    title: work.display_name || work.title || "بدون عنوان",
    year: work.publication_year ?? null,
    citedByCount: work.cited_by_count ?? 0,
    doi: work.doi ? work.doi.replace("https://doi.org/", "") : null,
    openAlexUrl: work.id ?? null,
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

async function fetchSemanticScholarByOrcid(orcid: string): Promise<{
  hIndex: number | null;
  paperCount: number | null;
  citationCount: number | null;
  url: string | null;
  name: string | null;
} | null> {
  const url = `https://api.semanticscholar.org/graph/v1/author/ORCID:${orcid}?fields=name,url,hIndex,citationCount,paperCount`;
  const data = await fetchJson<{
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
  };
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
}): Promise<ExternalProfileMetrics> {
  const links = args.links ?? {};
  const officialEmail = normalizeEmail(args.officialEmail);
  const platformName =
    pickPreferredPlatformName([...(args.nameCandidates ?? []), args.preferredName]) ?? null;

  const linksDetected = {
    hasOrcid: Boolean(links.orcid?.trim()),
    hasGoogleScholar: Boolean(links.googleScholar?.trim()),
    hasScopus: Boolean(links.scopus?.trim()),
    hasResearchGate: Boolean(links.researchGate?.trim()),
  };

  const notes: string[] = [];
  const sourcesUsed: ExternalMetricSource[] = [];

  notes.push(
    "مرجع الهوية المعتمد: البريد الإلكتروني الرسمي للباحث (حسب توجيه إدارة الجامعة)، لأن الأسماء قد تختلف بين الأبحاث."
  );

  if (linksDetected.hasGoogleScholar) {
    notes.push("رابط Google Scholar موجود، لكن لا يتم سحبه مباشرة؛ نعتمد البريد/ORCID ثم OpenAlex.");
  }
  if (linksDetected.hasResearchGate) {
    notes.push("رابط ResearchGate محفوظ للمرجع فقط.");
  }
  if (linksDetected.hasScopus) {
    notes.push("رابط Scopus محفوظ للمرجع؛ الاستخراج الحالي يعتمد OpenAlex/ORCID بدون مفتاح Scopus مدفوع.");
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
        notes.push(
          `عُثر على ORCID عبر البريد الرسمي، لكن تعذر جلب ملف OpenAlex له (${emailOrcid}).`
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

  // عند وجود ORCID موثوق: اختلاف كتابة الاسم لا يرفض النتيجة (الأسماء تتغير بين الأبحاث)
  if (author && (orcidResolvedViaEmail || extractOrcid(links.orcid))) {
    const compatibility = evaluateNameCompatibility(platformName, author.display_name);
    matchScore = matchScore ?? compatibility.score;
    if (!compatibility.compatible) {
      notes.push(
        `ملاحظة: اختلاف في كتابة الاسم («${platformName || "—"}» vs «${author.display_name || "—"}») — تم تجاهله لأن المرجع هو البريد/ORCID.`
      );
    } else {
      notes.push(compatibility.reason);
    }
    identityMatch = "matched";
  }

  // 3) احتياط أخير: بحث بالاسم فقط إن تعذر البريد/ORCID
  if (!author && platformName) {
    notes.push("الانتقال لاحتياط البحث بالاسم لأن البريد/ORCID لم يُنتجا ملفاً موثوقاً.");
    const candidates = await searchOpenAlexByName(platformName);
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
      return emptyResult({
        ok: false,
        message:
          "تعذر تأكيد الهوية بالبريد الرسمي أو ORCID. أضف ORCID في الروابط أو اربطه ببريدك الجامعي الظاهر.",
        platformName,
        displayName: candidates[0]?.display_name ?? null,
        identityMatch: "mismatch",
        matchScore: nearest?.score ?? 0,
        orcid,
        linksDetected,
        notes,
        sourcesUsed,
      });
    }
  }

  if (!author) {
    return emptyResult({
      ok: false,
      message: officialEmail
        ? "تعذر استخراج المؤشرات. اربط بريدك الرسمي بحساب ORCID (أو أضف ORCID في الروابط) ثم أعد المحاولة."
        : "تعذر استخراج المؤشرات. تأكد من وجود بريد رسمي على الحساب وأضف ORCID في الروابط.",
      platformName,
      orcid,
      identityMatch: "unavailable",
      linksDetected,
      notes,
      sourcesUsed,
    });
  }

  const openAlexId = author.id ?? null;
  const worksResult = openAlexId
    ? await fetchAllOpenAlexWorks(openAlexId)
    : { works: [] as ExternalPublication[], truncated: false, totalFetched: 0 };
  const recentWorks = worksResult.works;

  if (worksResult.truncated) {
    notes.push(
      `تم جلب ${worksResult.totalFetched} منشوراً كحد أقصى للأمان؛ قد يكون لدى المؤلف المزيد على OpenAlex.`
    );
  } else if (recentWorks.length > 0) {
    notes.push(`تم جلب جميع المنشورات المتاحة لهذا المؤلف من OpenAlex (${recentWorks.length}).`);
  }

  let hIndex = author.summary_stats?.h_index ?? null;
  let publications = author.works_count ?? null;
  let citedByCount = author.cited_by_count ?? null;
  let semanticScholarUrl: string | null = null;

  // إن وُجدت قائمة أعمال كاملة، طابق عدد المنشورات المعروض مع ما جُلب إن كان أعلى من الإحصاء
  if (publications == null || (recentWorks.length > 0 && recentWorks.length > (publications ?? 0))) {
    publications = Math.max(publications ?? 0, recentWorks.length);
  }

  if (orcid) {
    const ss = await fetchSemanticScholarByOrcid(orcid);
    if (ss) {
      // مع ORCID/البريد لا نرفض Semantic Scholar بسبب اختلاف الاسم
      sourcesUsed.push("semanticscholar");
      semanticScholarUrl = ss.url;
      if (hIndex == null && ss.hIndex != null) hIndex = ss.hIndex;
      if (publications == null && ss.paperCount != null) publications = ss.paperCount;
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

  return {
    ok: true,
    message: orcidResolvedViaEmail
      ? "تم استخراج المؤشرات بالاعتماد على البريد الرسمي وربطه بـ ORCID."
      : identityMatch === "uncertain"
        ? "تم استخراج مؤشرات بحذر (احتياط بالاسم). يُفضّل تأكيد الهوية عبر البريد/ORCID."
        : usedNameSearch
          ? "تم استخراج المؤشرات باحتياط الاسم؛ المرجع الأفضل هو البريد الرسمي المرتبط بـ ORCID."
          : "تم استخراج المؤشرات بنجاح مع اعتماد معرّف ثابت (ORCID/البريد).",
    platformName,
    displayName: author.display_name ?? platformName,
    identityMatch,
    matchScore,
    orcid: extractOrcid(author.orcid) ?? orcid,
    hIndex,
    i10Index: author.summary_stats?.i10_index ?? null,
    publications,
    citedByCount,
    twoYearMeanCitedness: author.summary_stats?.["2yr_mean_citedness"] ?? null,
    institutions: (author.last_known_institutions ?? [])
      .map((x) => x.display_name)
      .filter((x): x is string => Boolean(x))
      .slice(0, 5),
    topics: (author.topics ?? [])
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
