import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { searchSkills, type SkillHit } from "@/lib/server/skills";

export const Route = createFileRoute("/skills")({ component: SkillsPage });

const EXAMPLES = [
  "I want a skill that can work as my CMO",
  "act as a staff SRE during incidents",
  "product manager who writes PRDs",
  "security review for a web app",
  "technical writer for API docs",
];

function getRecommendedModel(tags: string[], role: string) {
  const t = tags.join(" ").toLowerCase() + " " + role.toLowerCase();
  if (t.includes("code") || t.includes("engineering") || t.includes("tdd") || t.includes("cto") || t.includes("sre")) {
    return { name: "Qwen 2.5 Coder 32B / 14B", task: "code" };
  }
  if (t.includes("reason") || t.includes("math") || t.includes("analyst") || t.includes("finance") || t.includes("cfo")) {
    return { name: "DeepSeek-R1-Distill-Qwen-14B / 32B", task: "reason" };
  }
  if (t.includes("vision") || t.includes("design") || t.includes("ui") || t.includes("frontend")) {
    return { name: "Qwen 2.5 VL 7B / 72B", task: "vision" };
  }
  if (t.includes("cmo") || t.includes("pm") || t.includes("copy") || t.includes("marketing") || t.includes("writer")) {
    return { name: "Llama 3.3 70B / Mistral Small 24B", task: "chat" };
  }
  return { name: "Llama 3.1 8B / Gemma 2 9B", task: "chat" };
}

function SkillsPage() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<SkillHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(query: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = await searchSkills({ data: { query } });
      setHits(rows);
    } catch {
      setError("Search failed. Showing nothing new.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run("");
  }, []);

  return (
    <SiteShell>
      <p className="text-2xs uppercase tracking-[0.28em] text-muted">find skill</p>
      <h1 className="mt-3 text-2xl sm:text-3xl">describe the job. get the skill.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Agent skills from GitHub, ranked by stars. Say what you want in plain language — “be my CMO”,
        “review this like appsec”, “write the PRD”. Each skill is paired with recommended local models that can run it reliably.
      </p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="I want a skill that can work as my CMO"
          className="min-h-12 flex-1 border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg disabled:opacity-50"
        >
          {busy ? "ranking…" : "rank skills"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="min-h-11 border border-line px-3 text-left text-xs text-muted hover:text-fg"
            onClick={() => {
              setQ(ex);
              run(ex);
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm">{error}</p> : null}

      <div className="mt-8 divide-y divide-line border border-line">
        {(hits ?? []).map((s, i) => {
          const rec = getRecommendedModel(s.tags, s.role);
          return (
            <article
              key={s.id}
              className="grid gap-2 px-4 py-4 hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:items-baseline"
            >
              <div className="text-2xs tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="text-sm">
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-fg">
                    {s.name}
                  </a>{" "}
                  <span className="text-muted">· {s.repo}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{s.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs uppercase tracking-widest text-dim">
                  <span>{s.origin}</span>
                  <span>·</span>
                  <span>{s.role}</span>
                  <span>·</span>
                  <span className="border border-line/60 px-1.5 py-0.5 text-fg">
                    Best with: {rec.name}
                  </span>
                  <Link to="/models" className="text-fg underline underline-offset-2 hover:opacity-80">
                    find models →
                  </Link>
                </div>
              </div>
              <div className="text-xs tabular-nums text-fg">{s.stars.toLocaleString()} stars</div>
            </article>
          );
        })}
      </div>
    </SiteShell>
  );
}

