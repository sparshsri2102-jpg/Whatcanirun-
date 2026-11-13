import { FAQS } from "@/lib/content/faq";

export function FaqSection() {
  return (
    <section aria-label="Frequently asked questions" className="mt-14 border-t border-line pt-10">
      <div className="text-xs font-medium text-primary">Reference &amp; Methodology</div>
      <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-fg">
        Local LLM sizing, quantization, and hardware answers
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {FAQS.map((f) => (
          <article
            key={f.q}
            id={`faq-${f.q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}`}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <h3 className="font-display text-sm font-semibold leading-snug text-fg">{f.q}</h3>
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
    kind: "Course · YouTube",
    url: "https://www.youtube.com/watch?v=8_FG9JTSx9M",
    note: "On-page/off-page/technical pillars, schema + CTR, meta rewrites with reasoning.",
  },
  {
    title: "Parasite SEO in 2026 with AI (Vasco's SEO Tips)",
    kind: "Playbook · YouTube",
    url: "https://www.youtube.com/watch?v=iXBD2EPvmKs",
    note: "40-minute implementation walkthrough for parasite strategy this year.",
  },
  {
    title: "AEO course for beginners (Ahrefs)",
    kind: "Course · YouTube",
    url: "https://www.youtube.com/watch?v=uza9GX0E2mw",
    note: "Per-engine differences, citations, freshness, YouTube-for-AI visibility.",
  },
  {
    title: "Complete AI SEO guide: AEO, GEO, LLMO (Breaking B2B)",
    kind: "Guide · YouTube",
    url: "https://www.youtube.com/watch?v=e9ccLnRmeo0",
    note: "Bottom-of-funnel pages as sales reps + brand-mention flywheel for AI search.",
  },
  {
    title: "9 parasitic SEO techniques tested (WordsAtScale)",
    kind: "Tests · Article",
    url: "https://wordsatscale.com/parasitic-seo-techniques/",
    note: "9 techniques ranked S-tier to underground; Reddit 24-48h indexing data.",
  },
  {
    title: "GEO & AEO guide: rank in AI chatbots (Simon Ward)",
    kind: "Guide · Article",
    url: "https://simonward.net/the-ultimate-geo-aeo-guide-2026-how-to-rank-in-ai-chatbots/",
    note: "Question H2s, FAQ schema stacking, per-engine prefs, robots.txt bot list.",
  },
];

export function FieldGuides() {
  return (
    <section aria-label="Field guides" className="mt-10 rounded-xl border border-line bg-surface p-5">
      <div className="text-xs font-medium text-primary">Operator Field Guides</div>
      <h2 className="mt-1 font-display text-lg font-semibold text-fg">
        Search &amp; AI visibility playbooks
      </h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {FIELD_GUIDES.map((g) => (
          <li key={g.url} className="rounded-lg border border-line bg-bg p-4">
            <a
              href={g.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-fg underline underline-offset-4 hover:text-primary"
            >
              {g.title}
            </a>
            <p className="mt-1 text-2xs text-dim">{g.kind}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{g.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
