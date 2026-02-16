import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

export type ResearcherLinksPayload = {
  googleScholar?: string | null;
  researchGate?: string | null;
  webOfScience?: string | null;
  scopus?: string | null;
  orcid?: string | null;
  linkedIn?: string | null;
  pubmed?: string | null;
  github?: string | null;
  personalWebsite?: string | null;
  otherLinks?: Array<{ label: string; url: string }> | null;
};

function emptyLinks() {
  return {
    googleScholar: null,
    researchGate: null,
    webOfScience: null,
    scopus: null,
    orcid: null,
    linkedIn: null,
    pubmed: null,
    github: null,
    personalWebsite: null,
    otherLinks: null,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.researcherLinks.findUnique({
    where: { userId: user.id },
  });

  if (!row) {
    return NextResponse.json(emptyLinks());
  }

  return NextResponse.json({
    googleScholar: row.googleScholar,
    researchGate: row.researchGate,
    webOfScience: row.webOfScience,
    scopus: row.scopus,
    orcid: row.orcid,
    linkedIn: row.linkedIn,
    pubmed: row.pubmed,
    github: row.github,
    personalWebsite: row.personalWebsite,
    otherLinks: Array.isArray(row.otherLinks) ? row.otherLinks : null,
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ResearcherLinksPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const otherLinks = body.otherLinks;
  const validatedOther =
    Array.isArray(otherLinks) &&
    otherLinks.every(
      (x) => typeof x === "object" && x !== null && typeof x.label === "string" && typeof x.url === "string"
    )
      ? otherLinks.filter((x) => (x as { label: string; url: string }).url?.trim())
      : undefined;

  const data = {
    googleScholar: typeof body.googleScholar === "string" ? body.googleScholar.trim() || null : undefined,
    researchGate: typeof body.researchGate === "string" ? body.researchGate.trim() || null : undefined,
    webOfScience: typeof body.webOfScience === "string" ? body.webOfScience.trim() || null : undefined,
    scopus: typeof body.scopus === "string" ? body.scopus.trim() || null : undefined,
    orcid: typeof body.orcid === "string" ? body.orcid.trim() || null : undefined,
    linkedIn: typeof body.linkedIn === "string" ? body.linkedIn.trim() || null : undefined,
    pubmed: typeof body.pubmed === "string" ? body.pubmed.trim() || null : undefined,
    github: typeof body.github === "string" ? body.github.trim() || null : undefined,
    personalWebsite: typeof body.personalWebsite === "string" ? body.personalWebsite.trim() || null : undefined,
    otherLinks: validatedOther ?? undefined,
  };

  const updated = await prisma.researcherLinks.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({
    googleScholar: updated.googleScholar,
    researchGate: updated.researchGate,
    webOfScience: updated.webOfScience,
    scopus: updated.scopus,
    orcid: updated.orcid,
    linkedIn: updated.linkedIn,
    pubmed: updated.pubmed,
    github: updated.github,
    personalWebsite: updated.personalWebsite,
    otherLinks: Array.isArray(updated.otherLinks) ? updated.otherLinks : null,
  });
}
