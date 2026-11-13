import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Search, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { MODELS } from "@/lib/models/catalog";
import { calcKvCacheGb, getMemoryPools } from "@/lib/models/match";
import type { Model, ModelTask, RunnerType, Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/models")({ component: ModelsPage });

const FILTERS: Array<{ id: "all" | ModelTask; label: string }> = [
  { id: "all", label: "All" },
  { id: "chat", label: "Chat" },
  { id: "code", label: "Code" },
  { id: "reason", label: "Reason" },
  { id: "vision", label: "Vision" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "embed", label: "Embed" },
  { id: "agent", label: "Agent" },
];

type SortMode = "quality" | "recent" | "vram_asc" | "params_desc";
type ArchFilter = "all" | "dense" | "moe";
type LicenseFilter = "all" | "permissive";

const PERMISSIVE_LICENSES = ["apache", "mit", "bsd"];

function checkModelCompatibility(model: Model, specs: Specs | null) {
  if (!specs) return null;
  const pools = getMemoryPools(specs);
  const kv8 = calcKvCacheGb(model, 8, "q8_0");

  const sorted = [...model.quants].sort((a, b) => a.vramGb - b.vramGb);
  const minQuant = sorted[0];
  const q4Quant = model.quants.find((q) => q.name === "Q4") || minQuant;

  const q4Need = q4Quant.vramGb + kv8;
  const minNeed = minQuant.vramGb + kv8;

  if (q4Need <= pools.gpu) {
    const headroom = Math.round((pools.gpu - q4Need) * 10) / 10;
    return {
      status: "gpu" as const,
      label: `Fits GPU (${q4Quant.name} · +${headroom} GB)`,
      tone: "text-success",
    };
  }
  if (minNeed <= pools.gpu) {
    return {
      status: "gpu" as const,
      label: `Fits GPU (${minQuant.name})`,
      tone: "text-success",
    };
  }
  if (minNeed <= pools.hybrid) {
    return {
      status: "hybrid" as const,
      label: `Hybrid Offload (${minQuant.name})`,
      tone: "text-primary",
    };
  }
  return {
    status: "no" as const,
    label: "Exceeds Rig",
    tone: "text-dim",
  };
}

function getRunnerCommand(model: Model, runner: RunnerType): string {
  const baseOllama = model.run.ollama ?? (model.ollama ? `ollama run ${model.ollama}` : `ollama run hf.co/${model.id}`);
  if (runner === "ollama") return baseOllama;
  if (runner === "lmstudio") return model.run.lmstudio ?? `lms get ${model.id}`;
  if (runner === "llamacpp") {
    return model.run.llamacpp ?? `llama-cli -hf ${model.hf.replace("https://huggingface.co/", "")} -c 8192 -ngl 99`;
  }
  if (runner === "mlx") {
    return model.run.mlx ?? `mlx_lm.generate --model ${model.hf.replace("https://huggingface.co/", "")} --prompt "Hello"`;
  }
  if (runner === "vllm") {
    return `vllm serve ${model.hf.replace("https://huggingface.co/", "")} --max-model-len 8192`;
  }
  return `jan models pull ${model.id}`;
}

function ModelsPage() {
  const [q, setQ] = useState("");
  const [task, setTask] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [arch, setArch] = useState<ArchFilter>("all");
  const [licenseMode, setLicenseMode] = useState<LicenseFilter>("all");
  const [sort, setSort] = useState<SortMode>("quality");
  const [vram, setVram] = useState<number>(0);
  const [userSpecs, setUserSpecs] = useState<Specs | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [drawerRunner, setDrawerRunner] = useState<RunnerType>("ollama");
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("whatcanirun_last_specs");
      if (saved) setUserSpecs(JSON.parse(saved));
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("task");
      if (t && FILTERS.some((f) => f.id === t)) {
        setTask(t as (typeof FILTERS)[number]["id"]);
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
      if (
        licenseMode === "permissive" &&
        !PERMISSIVE_LICENSES.some((l) => m.license.toLowerCase().includes(l))
      ) {
        return false;
      }
      if (vram && m.quants.every((x) => x.vramGb > vram)) return false;
      if (q) {
        const hay = `${m.name} ${m.org} ${m.summary} ${m.license} ${m.architecture ?? ""}`.toLowerCase();
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
  }, [q, task, arch, licenseMode, sort, vram]);

  function copyDrawerCommand(cmd: string) {
    try {
      void navigator.clipboard.writeText(cmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="text-xs font-medium text-primary">Open-Weight Index</div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
            Curated Local Model Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {MODELS.length} verified open-weight models for private offline LLM inference, with GGUF sizes, KV cache memory math, and runnable commands. Filter by VRAM ceiling, license, or architecture.
          </p>
          {userSpecs ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted">Active hardware profile:</span>
              <span className="font-mono font-medium text-fg">
                {userSpecs.gpuCount > 1 ? `${userSpecs.gpuCount}x ` : ""}
                {userSpecs.gpu} ·{" "}
                {userSpecs.unified
                  ? `${userSpecs.ramGb} GB Unified`
                  : `${userSpecs.vramGb * Math.max(1, userSpecs.gpuCount)} GB VRAM`}
              </span>
              <Link to="/" className="text-primary hover:underline">
                Change rig
              </Link>
            </div>
          ) : null}
        </div>

        <Link
          to="/"
          className="whitespace-nowrap shrink-0 rounded-lg border border-line-strong bg-surface px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-elevated"
        >
          Open Hardware Bench
        </Link>
      </div>

      {/* Controls */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search model, lab, architecture, or license…"
            className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-4 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
          />
        </div>

        <label className="flex h-11 items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs text-muted">
          <span className="shrink-0">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="bg-transparent font-medium text-fg focus:outline-none"
          >
            <option value="quality">Top Rated</option>
            <option value="recent">Newest Release</option>
            <option value="vram_asc">Lowest VRAM</option>
            <option value="params_desc">Largest Params</option>
          </select>
        </label>

        <label className="flex h-11 items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs text-muted">
          <span className="shrink-0">Max VRAM</span>
          <select
            value={vram}
            onChange={(e) => setVram(Number(e.target.value))}
            className="bg-transparent font-medium text-fg focus:outline-none"
          >
            <option value={0}>Any</option>
            <option value={8}>8 GB</option>
            <option value={12}>12 GB</option>
            <option value={16}>16 GB</option>
            <option value={24}>24 GB</option>
            <option value={32}>32 GB</option>
            <option value={64}>64 GB</option>
            <option value={128}>128 GB</option>
          </select>
        </label>

        <label className="flex h-11 items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs text-muted">
          <span className="shrink-0">License</span>
          <select
            value={licenseMode}
            onChange={(e) => setLicenseMode(e.target.value as LicenseFilter)}
            className="bg-transparent font-medium text-fg focus:outline-none"
          >
            <option value="all">All Open-Weight</option>
            <option value="permissive">Apache / MIT / BSD</option>
          </select>
        </label>
      </div>

      {/* Segmented filters */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTask(f.id)}
              className={cn(
                "whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                task === f.id
                  ? "bg-primary text-bg"
                  : "text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center rounded-lg border border-line bg-surface p-1">
          {(
            [
              { id: "all", label: "All Arch" },
              { id: "dense", label: "Dense" },
              { id: "moe", label: "MoE" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setArch(item.id)}
              className={cn(
                "whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                arch === item.id
                  ? "bg-elevated text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-muted">
        <span className="tabular-nums">{rows.length} matching models</span>
        <span>Click any model to inspect full quantization matrix</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-surface p-10 text-center">
          <p className="text-sm font-medium text-fg">No models match those constraints</p>
          <p className="mt-1 text-xs text-muted">
            Widen the VRAM ceiling or switch back to all tasks and licenses.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTask("all");
              setArch("all");
              setLicenseMode("all");
              setVram(0);
            }}
            className="mt-4 rounded-lg border border-line-strong bg-elevated px-4 py-2 text-xs font-medium text-fg hover:border-fg/40"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((m) => {
            const q4 = m.quants.find((x) => x.name === "Q4") ?? m.quants[0];
            const compatibility = checkModelCompatibility(m, userSpecs);

            return (
              <article
                key={m.id}
                className="grid gap-4 px-5 py-4 transition-colors hover:bg-elevated/50 sm:grid-cols-[1.35fr_0.65fr] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-fg">{m.org}</span>
                    <span aria-hidden="true">·</span>
                    <span>{m.architecture ?? (m.moe ? "MoE" : "Dense")}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{m.released}</span>
                    {m.isNew ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-primary">2025–2026 Release</span>
                      </>
                    ) : null}
                    {compatibility ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={cn("font-mono font-medium", compatibility.tone)}>
                          {compatibility.label}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedModel(m)}
                      className="text-left font-display text-base font-semibold text-fg hover:text-primary transition-colors"
                    >
                      {m.name}
                    </button>
                  </div>

                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.summary}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedModel(m)}
                      className="font-medium text-primary hover:underline"
                    >
                      Inspect Quant Matrix
                    </button>
                    <a
                      href={m.hf}
                      className="inline-flex items-center gap-1 text-muted hover:text-fg"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Hugging Face <ExternalLink className="h-3 w-3" />
                    </a>
                    {m.gguf ? (
                      <a
                        href={m.gguf}
                        className="inline-flex items-center gap-1 text-muted hover:text-fg"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GGUF download <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {m.run.ollama ? (
                      <code className="font-mono text-dim">{m.run.ollama}</code>
                    ) : null}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3 text-xs sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <div>
                    <dt className="text-dim">Params</dt>
                    <dd className="mt-0.5 font-mono font-medium text-fg">{m.params}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">License</dt>
                    <dd className="mt-0.5 font-medium text-fg">{m.license}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Q4 Footprint</dt>
                    <dd className="mt-0.5 font-mono tabular-nums font-medium text-fg">
                      {q4 ? `${q4.vramGb} GB` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-dim">Context</dt>
                    <dd className="mt-0.5 font-mono tabular-nums font-medium text-fg">
                      {m.contextK ? `${m.contextK}k` : "N/A"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-dim">Tasks</dt>
                    <dd className="mt-0.5 text-muted">{m.tasks.join(" · ")}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedModel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-inspector-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line-strong bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="text-xs text-muted">
                  {selectedModel.org} · {selectedModel.params} · {selectedModel.license}
                </div>
                <h2
                  id="model-inspector-title"
                  className="mt-1 font-display text-xl font-semibold text-fg"
                >
                  {selectedModel.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModel(null)}
                aria-label="Close inspector"
                className="rounded-lg border border-line p-2 text-muted hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{selectedModel.summary}</p>

            <div className="mt-5">
              <div className="text-xs font-medium text-fg">
                Quantization Memory Matrix (Weights + 8k FP16 KV Cache)
              </div>
              <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-bg">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-dim">
                      <th className="px-3.5 py-2 font-medium">Quant</th>
                      <th className="px-3.5 py-2 font-medium text-right">Weights</th>
                      <th className="px-3.5 py-2 font-medium text-right">8k KV</th>
                      <th className="px-3.5 py-2 font-medium text-right">Total Req.</th>
                      <th className="px-3.5 py-2 font-medium text-right">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono tabular-nums">
                    {selectedModel.quants.map((qt) => {
                      const kv = calcKvCacheGb(selectedModel, 8, "fp16");
                      const total = Math.round((qt.vramGb + kv) * 10) / 10;
                      return (
                        <tr key={qt.name} className="hover:bg-surface">
                          <td className="px-3.5 py-2 font-semibold text-fg">{qt.name}</td>
                          <td className="px-3.5 py-2 text-right text-muted">{qt.vramGb} GB</td>
                          <td className="px-3.5 py-2 text-right text-muted">{kv} GB</td>
                          <td className="px-3.5 py-2 text-right text-primary">{total} GB</td>
                          <td className="px-3.5 py-2 text-right text-muted">{qt.quality}/100</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-fg">Runner Launch Command</span>
                <div className="inline-flex rounded-lg border border-line bg-bg p-0.5">
                  {(["ollama", "lmstudio", "llamacpp", "mlx", "vllm", "jan"] as RunnerType[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDrawerRunner(r)}
                        className={cn(
                          "whitespace-nowrap rounded-md px-2 py-1 text-2xs font-medium transition-colors",
                          drawerRunner === r ? "bg-elevated text-fg" : "text-dim hover:text-fg",
                        )}
                      >
                        {r}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3.5 py-2.5">
                <code className="overflow-x-auto font-mono text-xs text-fg">
                  {getRunnerCommand(selectedModel, drawerRunner)}
                </code>
                <button
                  type="button"
                  onClick={() => copyDrawerCommand(getRunnerCommand(selectedModel, drawerRunner))}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:bg-elevated"
                >
                  {copiedCmd ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCmd ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* SEO / AEO VRAM requirements table */}
      <section aria-label="VRAM requirements table" className="mt-12 border-t border-line pt-10">
        <div className="text-xs font-medium text-primary">Reference Specification</div>
        <h2 className="mt-1.5 font-display text-xl font-semibold text-fg">
          Model VRAM requirements table — run locally
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          Each row lists params, the Q4 VRAM requirement in GB, the smallest quant that runs locally,
          and the copy-paste Ollama command with a GGUF download link. Compare rows to see which model is better for your rig. Sizes exclude KV cache — leave ~10% headroom.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-dim">
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Params</th>
                <th className="px-4 py-2.5 font-medium text-right">VRAM requirements (Q4)</th>
                <th className="px-4 py-2.5 font-medium text-right">Runs locally from</th>
                <th className="px-4 py-2.5 font-medium">Ollama command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MODELS.map((m) => {
                const q4 = m.quants.find((x) => x.name === "Q4") ?? m.quants[0];
                const min = [...m.quants].sort((a, b) => a.vramGb - b.vramGb)[0];
                return (
                  <tr key={m.id} className="hover:bg-elevated/40">
                    <td className="px-4 py-2.5 font-medium text-fg">{m.name}</td>
                    <td className="px-4 py-2.5 font-mono text-muted">{m.params}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-fg">
                      {q4.vramGb} GB
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted">
                      {min.vramGb} GB ({min.name})
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted">
                      {m.run.ollama ?? m.run.llamacpp ?? "see GGUF download"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
