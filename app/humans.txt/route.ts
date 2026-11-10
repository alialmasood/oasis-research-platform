import { getSiteOrigin } from "@/lib/cv/siteUrl";

/** ملف humans.txt التقليدي — يساعد في نسبة الفضل للمصمم */
export function GET() {
  const origin = getSiteOrigin();
  const body = `/* TEAM */
Creator / Designer / Developer: Ali Hussein Mezher Almasood
Arabic name: علي حسين مزهر المسعود
Affiliation: University of Basrah — Presidency of the University of Basrah
Site: ${origin}/about/creator

/* SITE */
Platform: واحة الباحث (Researcher Oasis)
Standards: HTML5, CSS3, Next.js
Language: Arabic / English
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
