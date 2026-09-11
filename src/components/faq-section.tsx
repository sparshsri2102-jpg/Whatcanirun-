import { FAQS } from "@/lib/content/faq";

export function FaqSection() {
  return (
    <section aria-label="Frequently asked questions" className="mt-14 border-t border-line pt-8">
      <p className="text-2xs uppercase tracking-[0.24em] text-muted">answered once · cited everywhere</p>
      <h2 className="mt-2 text-xl sm:text-2xl">local LLM answers, no fluff.</h2>
      <div className="mt-6 grid gap-px border border-line bg-line md:grid-cols-2">
        {FAQS.map((f) => (
          <article
            key={f.q}
            id={`faq-${f.q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}`}
            className="bg-bg p-4"
          >
            <h3 className="text-sm font-medium leading-snug">{f.q}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">{f.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export type FieldGuide = { title: string; kind: string; url: string; note: string };

export const FIELD_GUIDES: FieldGuide[] = [
  {
    title: "Parasite SEO full course (Vasco's SEO Tips)",
    kind: "youtube · course",
    url: "https://www.youtube.com/watch?v=8_FG9JTSx9M",
    note: "On-page/off-page/technical pillars, schema + CTR, meta rewrites with reasoning.",
  },
  {
    title: "Parasite SEO in 2026 with AI (Vasco's SEO Tips)",
    kind: "youtube · playbook",
    url: "https://www.youtube.com/watch?v=iXBD2EPvmKs",
    note: "40-minute implementation walkthrough for parasite strategy this year.",
  },
  {
    title: "AEO course for beginners (Ahrefs)",
    kind: "youtube · course",
    url: "https://www.youtube.com/watch?v=uza9GX0E2mw",
    note: "Per-engine differences, citations, freshness, YouTube-for-AI visibility.",
  },
  {
    title: "Complete AI SEO guide: AEO, GEO, LLMO (Breaking B2B)",
    kind: "youtube · guide",
    url: "https://www.youtube.com/watch?v=e9ccLnRmeo0",
    note: "Bottom-of-funnel pages as sales reps + brand-mention flywheel for AI search.",
  },
  {
    title: "9 parasitic SEO techniques tested (WordsAtScale)",
    kind: "article · tests",
    url: "https://wordsatscale.com/parasitic-seo-techniques/",
    note: "9 techniques ranked S-tier to underground; Reddit 24-48h indexing data.",
  },
  {
    title: "GEO & AEO guide: rank in AI chatbots (Simon Ward)",
    kind: "article · guide",
    url: "https://simonward.net/the-ultimate-geo-aeo-guide-2026-how-to-rank-in-ai-chatbots/",
    note: "Question H2s, FAQ schema stacking, per-engine prefs, robots.txt bot list.",
  },
];

export function FieldGuides() {
  return (
    <section aria-label="Field guides" className="mt-10 border border-line bg-surface p-4">
      <p className="text-2xs uppercase tracking-[0.24em] text-muted">field guides · as chosen by operators</p>
      <h2 className="mt-2 text-lg">learn parasite SEO + AEO from the best walkthroughs.</h2>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {FIELD_GUIDES.map((g) => (
          <li key={g.url} className="border border-line bg-bg p-3">
            <a href={g.url} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4 hover:text-fg">
              {g.title}
            </a>
            <p className="mt-1 text-2xs uppercase tracking-widest text-dim">{g.kind}</p>
            <p className="mt-1 text-xs text-muted">{g.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
