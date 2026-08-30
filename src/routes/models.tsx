import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { MODELS } from "@/lib/models/catalog";
import type { ModelTask, Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/models")({ component: ModelsPage });

const FILTERS: Array<{ id: "all" | ModelTask; label: string }> = [
  { id: "all", label: "all" },
  { id: "chat", label: "chat" },
  { id: "code", label: "code" },
  { id: "reason", label: "reason" },
  { id: "vision", label: "vision" },
  { id: "image", label: "image" },
  { id: "audio", label: "audio" },
  { id: "agent", label: "agent" },
];

type SortMode = "quality" | "recent" | "vram_asc" | "params_desc";
type ArchFilter = "all" | "dense" | "moe";

function checkModelCompatibility(model: (typeof MODELS)[number], specs: Specs | null) {
  if (!specs) return null;
  const pool = specs.unified
    ? specs.ramGb * 0.72
    : specs.vramGb * 0.9;
  const hybridPool = specs.unified
    ? specs.ramGb * 0.72
    : specs.vramGb * 0.9 + specs.ramGb * 0.5;

  const minQuant = [...model.quants].sort((a, b) => a.vramGb - b.vramGb)[0];
  const q4Quant = model.quants.find((q) => q.name === "Q4") || minQuant;

  if (q4Quant.vramGb <= pool) {
    const headroom = Math.round((pool - q4Quant.vramGb) * 10) / 10;
    return { status: "gpu", label: `✓ fits GPU (${q4Quant.name} · +${headroom}GB)`, color: "border-fg text-fg" };
  }
  if (minQuant.vramGb <= pool) {
    return { status: "gpu", label: `✓ fits GPU (${minQuant.name})`, color: "border-fg text-fg" };
  }
  if (minQuant.vramGb <= hybridPool) {
    return { status: "hybrid", label: `⚠ offload to RAM (${minQuant.name})`, color: "border-line text-muted" };
  }
  return { status: "no", label: `✕ exceeds rig`, color: "border-line/50 text-dim" };
}

function ModelsPage() {
  const [q, setQ] = useState("");
  const [task, setTask] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [arch, setArch] = useState<ArchFilter>("all");
  const [sort, setSort] = useState<SortMode>("quality");
  const [vram, setVram] = useState<number>(0);
  const [userSpecs, setUserSpecs] = useState<Specs | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("whatcanirun_last_specs");
      if (saved) {
        setUserSpecs(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const rows = useMemo(() => {
    return MODELS.filter((m) => {
      if (task !== "all" && !m.tasks.includes(task)) return false;
      if (arch === "moe" && !m.moe) return false;
      if (arch === "dense" && m.moe) return false;
      if (vram && m.quants.every((x) => x.vramGb > vram)) return false;
      if (q) {
        const hay = `${m.name} ${m.org} ${m.summary} ${m.license}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === "recent") {
        return (Date.parse(b.released) || 0) - (Date.parse(a.released) || 0);
      }
      if (sort === "vram_asc") {
        const aMin = Math.min(...a.quants.map((x) => x.vramGb));
        const bMin = Math.min(...b.quants.map((x) => x.vramGb));
        return aMin - bMin;
      }
      if (sort === "params_desc") {
        return (b.totalParamsB || b.paramsB) - (a.totalParamsB || a.paramsB);
      }
      return b.quality - a.quality;
    });
  }, [q, task, arch, sort, vram]);

  return (
    <SiteShell>
      <p className="text-2xs uppercase tracking-[0.28em] text-muted">catalog</p>
      <h1 className="mt-3 text-2xl sm:text-3xl">every model we match against</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Curated open-weight catalog with GGUF sizes. Live Hugging Face noise lives on drops. Filter by
        VRAM ceiling to see what a card can hold at Q4.
        {userSpecs ? (
          <span className="mt-1 block font-mono text-fg text-xs">
            ⚡ Matched to your active rig: {userSpecs.gpu} ({userSpecs.unified ? `${userSpecs.ramGb}GB Unified` : `${userSpecs.vramGb}GB VRAM`})
          </span>
        ) : null}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search name, org, license"
          className="min-h-12 flex-1 border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
        />
        <label className="flex min-h-12 items-center gap-3 border border-line bg-surface px-3 text-xs text-muted">
          sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="bg-transparent text-fg focus:outline-none"
          >
            <option value="quality">top rated</option>
            <option value="recent">newest release</option>
            <option value="vram_asc">lowest VRAM</option>
            <option value="params_desc">largest params</option>
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 border border-line bg-surface px-3 text-xs text-muted">
          max VRAM
          <select
            value={vram}
            onChange={(e) => setVram(Number(e.target.value))}
            className="bg-transparent text-fg focus:outline-none"
          >
            <option value={0}>any</option>
            <option value={8}>8 GB</option>
            <option value={12}>12 GB</option>
            <option value={16}>16 GB</option>
            <option value={24}>24 GB</option>
            <option value={32}>32 GB</option>
            <option value={64}>64 GB</option>
            <option value={128}>128 GB</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTask(f.id)}
              className={cn(
                "min-h-11 border px-3 text-xs uppercase tracking-widest",
                task === f.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-line bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => setArch("all")}
            className={cn("px-2.5 py-1 text-2xs uppercase tracking-wider", arch === "all" ? "bg-fg text-bg" : "text-muted hover:text-fg")}
          >
            all arch
          </button>
          <button
            type="button"
            onClick={() => setArch("dense")}
            className={cn("px-2.5 py-1 text-2xs uppercase tracking-wider", arch === "dense" ? "bg-fg text-bg" : "text-muted hover:text-fg")}
          >
            dense
          </button>
          <button
            type="button"
            onClick={() => setArch("moe")}
            className={cn("px-2.5 py-1 text-2xs uppercase tracking-wider", arch === "moe" ? "bg-fg text-bg" : "text-muted hover:text-fg")}
          >
            MoE
          </button>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted">{rows.length} models</div>
      <div className="mt-3 divide-y divide-line border border-line">
        {rows.map((m) => {
          const q4 = m.quants.find((x) => x.name === "Q4") ?? m.quants[0];
          const compatibility = checkModelCompatibility(m, userSpecs);

          return (
            <article key={m.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-start">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-2xs uppercase tracking-widest text-muted">{m.org}</div>
                  {compatibility ? (
                    <span className={cn("border px-2 py-0.5 text-2xs uppercase tracking-widest font-mono", compatibility.color)}>
                      {compatibility.label}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 text-base">{m.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.summary}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a href={m.hf} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                    huggingface
                  </a>
                  {m.gguf ? (
                    <a href={m.gguf} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                      GGUF download
                    </a>
                  ) : null}
                  {m.run.ollama ? <code className="text-muted">{m.run.ollama}</code> : null}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-dim">params</dt>
                  <dd>{m.params}</dd>
                </div>
                <div>
                  <dt className="text-dim">license</dt>
                  <dd>{m.license}</dd>
                </div>
                <div>
                  <dt className="text-dim">Q4-ish</dt>
                  <dd className="tabular-nums">{q4 ? `${q4.vramGb} GB` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-dim">context</dt>
                  <dd>{m.contextK ? `${m.contextK}k` : "n/a"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-dim">tasks</dt>
                  <dd>{m.tasks.join(" · ")}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </SiteShell>
  );
}

