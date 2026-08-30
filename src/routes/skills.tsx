import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { searchSkills, type SkillHit } from "@/lib/server/skills";
import { searchLocalSkills } from "@/lib/skills/catalog";
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
  { id: "all", label: "all skills" },
  { id: "leadership", label: "c-level / gtm" },
  { id: "engineering", label: "code & tdd" },
  { id: "security", label: "appsec & audit" },
  { id: "devops", label: "sre & devops" },
  { id: "design", label: "frontend / ui" },
  { id: "data", label: "data & rag" },
  { id: "content", label: "seo & copy" },
  { id: "product", label: "pm & qa" },
];

function getRecommendedModel(tags: string[], role: string) {
  const t = tags.join(" ").toLowerCase() + " " + role.toLowerCase();
  if (t.includes("code") || t.includes("engineering") || t.includes("tdd") || t.includes("cto") || t.includes("sre") || t.includes("rust") || t.includes("python")) {
    return { name: "Qwen 2.5 Coder 32B / 14B", task: "Code Specialist", link: "/models?task=code" };
  }
  if (t.includes("reason") || t.includes("math") || t.includes("analyst") || t.includes("finance") || t.includes("cfo") || t.includes("valuation") || t.includes("security")) {
    return { name: "DeepSeek-R1-Distill-Qwen-14B", task: "Reasoning & Logic", link: "/models?task=reason" };
  }
  if (t.includes("vision") || t.includes("design") || t.includes("ui") || t.includes("frontend") || t.includes("visual")) {
    return { name: "Qwen 2.5 VL 7B / 72B", task: "Vision & UI Taste", link: "/models?task=vision" };
  }
  if (t.includes("cmo") || t.includes("pm") || t.includes("copy") || t.includes("marketing") || t.includes("writer") || t.includes("sales")) {
    return { name: "Llama 3.3 70B / Mistral Small 24B", task: "Instruction & Writing", link: "/models?task=chat" };
  }
  return { name: "Llama 3.1 8B / Gemma 2 9B", task: "Fast General Chat", link: "/models?task=chat" };
}

function SkillsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false);
  const [serverHits, setServerHits] = useState<SkillHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute immediate local matches for instant zero-lag feedback
  const localHits = useMemo(() => {
    const hits = searchLocalSkills(q).map((s) => ({ ...s, origin: "catalog" as const }));
    if (category === "all") return hits;
    return hits.filter((h) => h.category === category);
  }, [q, category]);

  async function runServerSearch(queryText: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await searchSkills({ data: { query: queryText } });
      setServerHits(rows);
    } catch {
      setError("Live search timed out. Displaying curated skills instantly.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Initial fetch
    void runServerSearch("");
  }, []);

  // Display server hits if available, filtered by category, or local fallback
  const displayHits = useMemo(() => {
    let list: SkillHit[] = serverHits ?? localHits;
    if (q.trim()) {
      // If user typed something, localHits has instant high-precision scoring
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
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-[0.28em] text-muted">skill discovery engine</p>
        <span className="text-2xs uppercase tracking-widest text-dim">
          {displayHits.length} matched skills
        </span>
      </div>

      <h1 className="mt-3 text-2xl sm:text-3xl">describe the job. get the exact skill.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Open-source agent skill packs and role prompts from GitHub, matched by semantic intent.
        Say what you want in plain language — <span className="text-fg font-mono">“be my CMO”</span>,{" "}
        <span className="text-fg font-mono">“act as staff SRE during incidents”</span>, or{" "}
        <span className="text-fg font-mono">“write rigorous PRDs”</span>.
      </p>

      {/* Search Input Box */}
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void runServerSearch(q);
        }}
      >
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
            }}
            placeholder="Type any role or job: e.g. I want a skill that can work as my CMO…"
            className="min-h-12 w-full border border-line bg-surface px-4 text-sm focus:border-fg focus:outline-none"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase text-muted hover:text-fg"
            >
              clear
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 bg-fg px-6 text-sm uppercase tracking-widest text-bg transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          {busy ? "searching…" : "find best skill"}
        </button>
      </form>

      {/* Filter Category Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-widest text-muted mr-1">filter:</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "border px-2.5 py-1 text-2xs uppercase tracking-wider transition-colors",
              category === c.id
                ? "border-fg bg-fg text-bg"
                : "border-line bg-surface text-muted hover:text-fg hover:border-fg/50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Suggested Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-widest text-muted mr-1">try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="border border-line/60 bg-surface/50 px-2.5 py-1 text-left text-2xs text-muted hover:border-fg hover:text-fg transition-colors"
            onClick={() => {
              setQ(ex);
              void runServerSearch(ex);
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-xs text-dim">{error}</p> : null}

      {/* Skills Result Stream */}
      <div className="mt-8 divide-y divide-line border border-line">
        {displayHits.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            No exact skills matched &quot;{q}&quot;. Try broadening your role request or pick one of the suggested prompts above.
          </div>
        ) : (
          displayHits.map((s, i) => {
            const rec = getRecommendedModel(s.tags, s.role);
            return (
              <article
                key={s.id}
                className="grid gap-3 px-4 py-4 hover:bg-surface transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-start"
              >
                <div className="text-2xs tabular-nums text-muted pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium underline underline-offset-4 hover:text-fg"
                    >
                      {s.name}
                    </a>
                    <span className="text-xs text-muted">· {s.repo}</span>
                    {s.matchReason ? (
                      <span className="border border-line bg-surface px-1.5 py-0.5 text-2xs text-fg">
                        {s.matchReason}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-muted max-w-3xl">
                    {s.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs uppercase tracking-widest text-dim">
                    <span className="border border-line px-1.5 py-0.5 text-muted">
                      {s.role}
                    </span>
                    <span>·</span>
                    <span className="text-fg font-medium">
                      Best local model: {rec.name}
                    </span>
                    <Link
                      to={rec.link}
                      className="text-fg underline underline-offset-2 hover:opacity-80"
                    >
                      verify fit →
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:flex-col sm:items-end">
                  <div className="text-xs tabular-nums text-fg">
                    {s.stars.toLocaleString()} ★
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRepo(s.id, s.repo)}
                    className="border border-line px-2 py-0.5 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg"
                  >
                    {copiedId === s.id ? "✓ copied" : "copy link"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </SiteShell>
  );
}
