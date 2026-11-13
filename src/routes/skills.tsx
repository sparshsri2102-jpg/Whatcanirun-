import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Search, Star } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { searchSkills, type SkillHit } from "@/lib/server/skills";
import { searchLocalSkills } from "@/lib/skills/catalog";
import { FieldGuides } from "@/components/faq-section";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skills")({ component: SkillsPage });

const EXAMPLES = [
  "I want a skill that can work as my CMO",
  "act as a staff SRE during incidents",
  "product manager who writes PRDs",
  "security review for a web app",
  "financial modeling and SaaS valuation",
  "superpowers TDD and refactoring",
  "technical writer for API docs",
  "data engineer with SQL and dbt",
];

const CATEGORIES = [
  { id: "all", label: "All Skills" },
  { id: "leadership", label: "C-Level & GTM" },
  { id: "engineering", label: "Code & TDD" },
  { id: "security", label: "AppSec & Audit" },
  { id: "devops", label: "SRE & DevOps" },
  { id: "design", label: "Frontend & UI" },
  { id: "data", label: "Data & RAG" },
  { id: "content", label: "SEO & Copy" },
  { id: "product", label: "PM & QA" },
];

function getRecommendedModel(tags: string[], role: string) {
  const t = `${tags.join(" ")} ${role}`.toLowerCase();
  if (t.includes("code") || t.includes("engineering") || t.includes("tdd") || t.includes("cto") || t.includes("sre") || t.includes("rust") || t.includes("python")) {
    return { name: "Qwen3-Coder 30B-A3B / Qwen3 14B", task: "Code Specialist", link: "/models?task=code" };
  }
  if (t.includes("reason") || t.includes("math") || t.includes("analyst") || t.includes("finance") || t.includes("cfo") || t.includes("valuation") || t.includes("security")) {
    return { name: "Magistral Small 24B / DeepSeek-R1 32B", task: "Reasoning & Logic", link: "/models?task=reason" };
  }
  if (t.includes("vision") || t.includes("design") || t.includes("ui") || t.includes("frontend") || t.includes("visual")) {
    return { name: "Qwen 2.5 VL 7B / Gemma 3n E4B", task: "Vision & UI Taste", link: "/models?task=vision" };
  }
  if (t.includes("cmo") || t.includes("pm") || t.includes("copy") || t.includes("marketing") || t.includes("writer") || t.includes("sales")) {
    return { name: "Llama 4 Maverick / Qwen3 14B", task: "Instruction & Writing", link: "/models?task=chat" };
  }
  return { name: "Qwen3 8B / Gemma 3n E4B", task: "Fast General Chat", link: "/models?task=chat" };
}

function SkillsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false);
  const [serverHits, setServerHits] = useState<SkillHit[] | null>(null);
  const [liveStarsMap, setLiveStarsMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const localHits = useMemo(() => {
    const hits = searchLocalSkills(q).map((s) => ({
      ...s,
      stars: liveStarsMap[s.repo] ?? s.stars,
      origin: "catalog" as const,
    }));
    if (category === "all") return hits;
    return hits.filter((h) => h.category === category);
  }, [q, category, liveStarsMap]);

  async function runServerSearch(queryText: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await searchSkills({ data: { query: queryText } });
      setServerHits(rows);
      const newStars: Record<string, number> = {};
      rows.forEach((r) => {
        newStars[r.repo] = r.stars;
      });
      setLiveStarsMap((prev) => ({ ...prev, ...newStars }));
    } catch {
      setError("Live search timed out. Showing curated local skill index.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void runServerSearch("");
  }, []);

  const displayHits = useMemo(() => {
    let list: SkillHit[] = serverHits ?? localHits;
    if (q.trim()) {
      list = localHits;
    }
    if (category !== "all") {
      list = list.filter((item) => item.category === category);
    }
    return list;
  }, [serverHits, localHits, q, category]);

  function copyRepo(id: string, repo: string) {
    try {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(`https://github.com/${repo}`);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="text-xs font-medium text-primary">Agent Skill Index</div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
            Describe the job. Pair the exact skill.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Open-source agent skill packs and role prompts matched by intent and paired with the best local model for your rig.
          </p>
        </div>

        <span className="font-mono text-xs tabular-nums text-dim">
          {displayHits.length} matched skills
        </span>
      </div>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void runServerSearch(q);
        }}
      >
        <div className="relative flex-1 flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Describe any role: e.g. act as staff SRE during incidents…"
            className="h-12 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-16 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 text-xs font-medium text-muted hover:text-fg"
            >
              Clear
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="h-12 whitespace-nowrap shrink-0 rounded-lg bg-primary px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Searching…" : "Find Best Skill"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              category === c.id ? "bg-primary text-bg" : "text-muted hover:text-fg",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-dim">Try prompt:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQ(ex);
              void runServerSearch(ex);
            }}
            className="rounded-md border border-line bg-surface px-2.5 py-1 text-left text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            {ex}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs text-muted">
          {error}
        </div>
      ) : null}

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {displayHits.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No exact skills matched &quot;{q}&quot;. Broaden the query or pick one of the suggested prompts above.
          </div>
        ) : (
          displayHits.map((s, i) => {
            const rec = getRecommendedModel(s.tags, s.role);
            return (
              <article
                key={s.id}
                className="grid gap-4 px-5 py-4 transition-colors hover:bg-elevated/50 sm:grid-cols-[auto_1fr_auto] sm:items-start"
              >
                <div className="pt-0.5 font-mono text-xs tabular-nums text-dim">
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-display text-base font-semibold text-fg hover:text-primary transition-colors"
                    >
                      {s.name}
                      <ExternalLink className="h-3.5 w-3.5 text-dim" />
                    </a>
                    <span className="font-mono text-xs text-dim">· {s.repo}</span>
                    {s.fresh ? (
                      <span
                        className="text-xs font-medium text-success"
                        title={`Published ${s.repoCreatedAt ?? "in the last 30 days"}`}
                      >
                        · Fresh &lt;30d
                      </span>
                    ) : null}
                    {s.matchReason ? (
                      <span className="text-xs text-primary">· {s.matchReason}</span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-fg">{s.role}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Recommended local model:{" "}
                      <span className="font-mono font-medium text-fg">{rec.name}</span>
                    </span>
                    <Link to={rec.link} className="font-medium text-primary hover:underline">
                      Verify fit
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:flex-col sm:items-end">
                  <div className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-fg">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    {s.stars.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRepo(s.id, s.repo)}
                    className="inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-bg px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-fg"
                  >
                    {copiedId === s.id ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedId === s.id ? "Copied" : "Copy Repo"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-12">
        <FieldGuides />
      </div>
    </SiteShell>
  );
}
