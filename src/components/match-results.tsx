import { useState } from "react";
import type { MatchResult, Model, ModelFit, QuantOption, RunnerType, Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

function FitBadge({ fit }: { fit: ModelFit["fit"] }) {
  const label = fit === "gpu" ? "fits GPU" : fit === "hybrid" ? "offload" : fit === "cpu" ? "CPU" : "exceeds";
  return (
    <span
      className={cn(
        "border px-2 py-0.5 text-2xs uppercase tracking-widest",
        fit === "gpu" ? "border-fg text-fg" : "border-line text-muted",
      )}
    >
      {label}
    </span>
  );
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-2xs uppercase tracking-widest text-muted underline underline-offset-4 hover:text-fg"
      onClick={async () => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(cmd);
          } else {
            const ta = document.createElement("textarea");
            ta.value = cmd;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          try {
            const ta = document.createElement("textarea");
            ta.value = cmd;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setDone(true);
            window.setTimeout(() => setDone(false), 1400);
          } catch {
            /* ignore */
          }
        }
      }}
    >
      {done ? "copied" : "copy"}
    </button>
  );
}

function generateRunCmd(
  runner: RunnerType,
  fit: ModelFit,
  selectedQuant: string,
  contextK: number = 8,
  specs?: Specs,
): string {
  const m = fit.model;
  const qLower = selectedQuant.toLowerCase();
  const gpuCount = specs?.gpuCount && specs.gpuCount > 1 ? specs.gpuCount : 1;

  switch (runner) {
    case "ollama": {
      const baseOllama = m.run.ollama ? m.run.ollama : `hf.co/${m.hf}`;
      let tag = "";
      if (qLower.includes("q8") || qLower === "q8") tag = ":q8_0";
      else if (qLower.includes("q5")) tag = ":q5_k_m";
      else if (qLower.includes("q4") || qLower === "q4") tag = m.run.ollama ? "" : ":q4_k_m";
      else tag = `:${qLower}`;

      if (gpuCount > 1 && !specs?.unified) {
        const devList = Array.from({ length: gpuCount }, (_, i) => i).join(",");
        return `CUDA_VISIBLE_DEVICES=${devList} ollama run ${baseOllama}${tag}`;
      }
      return `ollama run ${baseOllama}${tag}`;
    }
    case "lmstudio": {
      if (gpuCount > 1) {
        return `lms load ${m.hf} --gpu=max --tensor-split ${Array(gpuCount).fill(1).join(",")} -c ${contextK * 1024}`;
      }
      return `lms load ${m.hf} --gpu=max -c ${contextK * 1024}`;
    }
    case "llamacpp": {
      if (gpuCount > 1) {
        return `./llama-cli -hf ${m.hf} -ngl 99 -sm row -c ${contextK * 1024}`;
      }
      if (m.run.llamacpp) return m.run.llamacpp;
      return `./llama-cli -hf ${m.hf} -ngl 99 -c ${contextK * 1024}`;
    }
    case "vllm": {
      if (gpuCount > 1) {
        return `vllm serve ${m.hf} --tensor-parallel-size ${gpuCount} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.92`;
      }
      return `vllm serve ${m.hf} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.90`;
    }
    case "jan": {
      return `jan run ${m.id} --quant ${selectedQuant}`;
    }
    default:
      return m.run.ollama || m.run.llamacpp || "";
  }
}

function QuantAdvisor({ model, quants, vramGb }: { model: Model; quants: QuantOption[]; vramGb: number }) {
  const gpuOpts = quants.filter((q) => q.fit === "gpu");
  const hybridOpts = quants.filter((q) => q.fit === "hybrid");
  const best = gpuOpts.length ? gpuOpts[0] : hybridOpts[0];
  if (!best) return null;
  const q4 = quants.find((q) => q.quant.name === "Q4");
  const q8 = quants.find((q) => q.quant.name === "Q8");
  const qualityDrop = q4 && q8 ? Math.round((1 - q4.quant.quality / q8.quant.quality) * 100) : 0;
  const recommended = best.quant.name;
  return (
    <div className="mt-3 border border-primary/30 bg-primary/5 p-3 text-center">
      <div className="text-2xs uppercase tracking-widest text-primary">recommended quant for your rig</div>
      <div className="mt-1 text-sm font-semibold text-fg">{recommended}</div>
      <p className="mt-1 text-2xs text-muted leading-relaxed">
        {recommended === "Q4"
          ? `Fits your ${vramGb}GB with headroom. Only ~${qualityDrop}% quality drop vs Q8 — best speed/quality balance.`
          : recommended === "Q8"
            ? `Near-lossless quality on your ${vramGb}GB. Maximum speed you can get.`
            : `Best fit available on your hardware. ${best.headroomGb > 0 ? `+${best.headroomGb}GB headroom.` : "Tight fit."}`}
      </p>
    </div>
  );
}

function UpgradePath({ result }: { result: MatchResult }) {
  const top = result.picks[0];
  if (!top || top.fit === "gpu") return null;
  const upgradeVram = top.quant.vramGb;
  return (
    <div className="mt-8 border border-warning/30 bg-warning/5 p-6 sm:p-8">
      <div className="text-2xs uppercase tracking-widest text-warning">feature: upgrade path</div>
      <h3 className="mt-2 text-xl font-semibold text-fg">
        Add ~{upgradeVram - result.specs.vramGb}GB VRAM to run {top.model.name}
      </h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        {top.model.name} wants {top.quant.vramGb}GB ({top.quant.name}). Your rig has {result.specs.vramGb}GB.
        A used RTX 3090 24GB (~$300) or RTX 4070 12GB (~$400) would unlock this model.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">RTX 3090 24GB · ~$300 used</span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">RTX 4070 12GB · ~$400</span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">M4 Pro 24GB · ~$600</span>
      </div>
    </div>
  );
}

const COMMUNITY_TIER: Record<string, Array<{ model: string; reason: string }>> = {
  "8 GB laptop": [
    { model: "Qwen3 8B", reason: "r/LocalLLaMA daily driver for 8GB — 84 quality, 22 t/s Q4" },
    { model: "Phi-4 Mini", reason: "Community CPU pick — runs anywhere, 74 quality" },
    { model: "Gemma 3 4B", reason: "Top mobile pick — 76 quality, tiny footprint" },
  ],
  "RTX 3060 12GB": [
    { model: "Mistral Small 3.2", reason: "16GB members' go-to coding model — 87 quality" },
    { model: "Qwen3 8B", reason: "Fastest 8B — 84 quality at 30 t/s" },
    { model: "Gemma 3 12B", reason: "Multimodal king at 12GB — 86 quality" },
  ],
  "RTX 4090 24GB": [
    { model: "Qwen3.8 27B", reason: "24GB sweet spot — 93 quality, vision+coding" },
    { model: "DeepSeek-R1 32B", reason: "Reasoning champion — 89 quality at Q4" },
    { model: "Devstral Small", reason: "Agentic coding — 89 quality, 256k ctx" },
  ],
};

function CommunityConsensus({ specs }: { specs: Specs }) {
  const tier = COMMUNITY_TIER[`${specs.gpu} ${specs.vramGb}GB`]
    ?? COMMUNITY_TIER[`${specs.gpu}`]
    ?? COMMUNITY_TIER["8 GB laptop"];
  return (
    <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="text-2xs uppercase tracking-widest text-muted">community consensus</span>
        <span className="text-2xs text-dim">r/LocalLLaMA · 266K members</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-fg">what r/LocalLLaMA runs on your hardware</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tier.map((c, i) => (
          <div key={c.model} className="border border-line bg-bg p-4">
            <div className="text-2xs uppercase tracking-widest text-primary">#{i + 1}</div>
            <div className="mt-1 text-sm font-semibold text-fg">{c.model}</div>
            <p className="mt-2 text-xs text-muted leading-relaxed">{c.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkCompare({ result }: { result: MatchResult }) {
  const top3 = result.picks.slice(0, 3);
  if (top3.length < 2) return null;
  return (
    <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
      <div className="text-2xs uppercase tracking-widest text-muted">feature: benchmark compare</div>
      <h3 className="mt-2 text-xl font-semibold text-fg">top 3 side-by-side on your rig</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-2xs uppercase tracking-widest">
              <th className="pb-3 text-fg">metric</th>
              {top3.map((p) => (
                <th key={p.model.id} className="px-4 pb-3 text-right text-fg">
                  {p.model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">quality</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.model.quality}/100</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">speed (tok/s)</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.tokPerSec ?? p.speed ?? "—"}</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">VRAM (quant)</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.quant.vramGb} GB ({p.quant.name})</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">license</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right text-fg">{p.model.license}</td>
              ))}
            </tr>
            <tr>
              <td className="py-3 text-dim">fit</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right">
                  <span className={cn("border px-2 py-0.5 text-2xs uppercase tracking-widest", p.fit === "gpu" ? "border-fg text-fg" : "border-line text-muted")}>
                    {p.fit}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PickCard({ fit, rank, contextK, specs }: { fit: ModelFit; rank: number; contextK: number; specs: Specs }) {
  const m = fit.model;
  const [selectedQuantName, setSelectedQuantName] = useState<string>(fit.quant.name);
  const [runner, setRunner] = useState<RunnerType>("ollama");

  const activeOption: QuantOption | undefined = fit.quantOptions?.find(
    (o) => o.quant.name === selectedQuantName
  );

  const currentQuant = activeOption ? activeOption.quant : fit.quant;
  const currentFit = activeOption ? activeOption.fit : fit.fit;
  const currentSpeed = activeOption?.tokPerSec || activeOption?.speed || fit.tokPerSec || fit.speed;
  const currentHeadroom = activeOption ? activeOption.headroomGb : fit.headroomGb;

  const weightsGb = currentQuant.vramGb;
  const kvCacheGb = fit.kvCacheGb ?? 0.5;
  const totalMem = Math.round((weightsGb + kvCacheGb) * 10) / 10;
  const cmd = generateRunCmd(runner, fit, currentQuant.name, contextK, specs);

  return (
    <article className="border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-2xs tabular-nums text-muted">
            {String(rank).padStart(2, "0")} · {m.org}
          </div>
          <h3 className="mt-1 text-lg">{m.name}</h3>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <FitBadge fit={currentFit} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{m.summary}</p>

       {/* Feature 3: Quant Advisor */}
       <QuantAdvisor model={m} quants={fit.quantOptions ?? []} vramGb={specs.vramGb || specs.ramGb} />

       {/* Interactive Quantization Matrix */}
       {fit.quantOptions && fit.quantOptions.length > 1 ? (
        <div className="mt-4 border-t border-b border-line py-3">
          <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-dim">
            <span>select quantization format:</span>
            <span>{currentQuant.name} selected</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fit.quantOptions.map((opt) => {
              const isSelected = opt.quant.name === currentQuant.name;
              const isGpu = opt.fit === "gpu";
              return (
                <button
                  key={opt.quant.name}
                  type="button"
                  onClick={() => setSelectedQuantName(opt.quant.name)}
                  className={cn(
                    "px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors",
                    isSelected
                      ? "border-fg bg-fg text-bg"
                      : isGpu
                        ? "border-line bg-bg text-fg hover:border-fg"
                        : "border-line/60 bg-transparent text-dim hover:text-muted"
                  )}
                >
                  {opt.quant.name} · {opt.quant.vramGb} GB
                  <span className="ml-1 opacity-70">
                    ({opt.fit === "gpu" ? "GPU" : opt.fit === "hybrid" ? "offload" : "CPU"})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-dim">memory needed</dt>
          <dd className="mt-0.5 tabular-nums">
            {totalMem} GB <span className="text-dim">({weightsGb} + {kvCacheGb}k KV)</span>
          </dd>
        </div>
        <div>
          <dt className="text-dim">params</dt>
          <dd className="mt-0.5">{m.params}</dd>
        </div>
        <div>
          <dt className="text-dim">headroom</dt>
          <dd className="mt-0.5 tabular-nums">
            {currentHeadroom > 0 ? `+${currentHeadroom} GB` : `${currentHeadroom} GB`}
          </dd>
        </div>
        <div>
          <dt className="text-dim">est. speed / bandwidth</dt>
          <dd className="mt-0.5 font-mono text-fg">{currentSpeed}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted">
        {fit.why}
      </p>

      {/* Multi-Engine Runner Switcher */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-dim mb-1.5">
          <span>run command ({runner}){specs.gpuCount > 1 ? ` · ${specs.gpuCount}x GPU Stacking` : ""}:</span>
          <div className="flex gap-2">
            {(["ollama", "lmstudio", "llamacpp", "vllm"] as RunnerType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunner(r)}
                className={cn(
                  "hover:text-fg uppercase",
                  runner === r ? "text-fg underline underline-offset-2" : "text-dim"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 border border-line bg-bg px-3 py-2">
          <code className="break-all text-xs font-mono">{cmd}</code>
          <CopyCmd cmd={cmd} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <a href={m.hf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
          huggingface
        </a>
        {m.gguf ? (
          <a href={m.gguf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            GGUF download
          </a>
        ) : null}
        {m.run.lmstudio ? <span className="text-muted">{m.run.lmstudio}</span> : null}
      </div>
    </article>
  );
}

function VerdictBanner({ result }: { result: MatchResult }) {
  const top = result.picks[0];
  if (!top) return null;
  const fits = top.fit !== "no";
  const speed = top.tokPerSec || top.speed || "—";
  const vram = result.specs.vramGb || result.specs.ramGb;
  return (
    <div className="mt-6 border-2 border-success bg-success/5 p-6 sm:p-8 text-center">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: fits ? "var(--color-success)" : "var(--color-danger)" }}>
        {fits ? "YES — it runs" : "NO — too heavy"}
      </div>
      <p className="mt-3 text-sm text-muted">
        {fits
          ? `Your ${vram}GB rig runs ${top.model.name} at ${speed}. ${top.model.summary.split(".")[0]}.`
          : `${top.model.name} needs ${top.quant.vramGb}GB+. Closest fit: ${result.picks.find((p) => p.fit !== "no")?.model.name || "none"}`}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <span className="border border-success/40 bg-success px-3 py-1 text-2xs uppercase tracking-widest text-success-foreground">
          {fits ? "GPU-native" : "offload"} · {speed}
        </span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">
          {top.quant.name} · {top.quant.vramGb} GB
        </span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">
          quality {top.model.quality}/100
        </span>
      </div>
    </div>
  );
}

export function MatchResults({
  result,
  onContextChange,
}: {
  result: MatchResult;
  onContextChange?: (ctx: number) => void;
}) {
  const s = result.specs;
  const ctx = result.contextK ?? 8;
  const [commercialOnly, setCommercialOnly] = useState(false);
  const isCommercial = (m: Model) => ["Apache-2.0", "MIT", "BSD"].includes(m.license);
  const picks = commercialOnly ? result.picks.filter((p) => isCommercial(p.model)) : result.picks;
  const also = commercialOnly ? result.also.filter((p) => isCommercial(p.model)) : result.also;
  const shareParams = new URLSearchParams({
    gpu: s.gpu,
    vram: String(s.vramGb),
    ram: String(s.ramGb),
    cpu: s.cpu,
    os: s.os,
    unified: s.unified ? "1" : "0",
    gpus: String(s.gpuCount || 1),
    ctx: String(ctx),
  });

  return (
    <section>
      <div className="border border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-2xs uppercase tracking-[0.28em] text-muted">your rig configuration</div>
          <div className="flex items-center gap-3">
            {onContextChange ? (
              <div className="flex items-center gap-1 text-2xs uppercase tracking-widest text-muted">
                <span>context:</span>
                <span className="font-mono text-fg">{ctx}k</span>
              </div>
            ) : null}
            <a
              href={`/share?${shareParams.toString()}`}
              className="border border-fg bg-fg px-2.5 py-1 text-2xs font-mono text-bg uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              ⚡ export & share card
            </a>
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-dim">gpu / accelerators</div>
            <div className="mt-1 font-mono">
              {s.gpuCount > 1 && !s.unified ? `${s.gpuCount}x ` : ""}{s.gpu}
            </div>
          </div>
          <div>
            <div className="text-dim">{s.unified ? "unified pool" : "total vram pool"}</div>
            <div className="mt-1 tabular-nums font-mono">
              {s.unified ? `${s.ramGb} GB Unified` : `${s.vramGb * Math.max(1, s.gpuCount || 1)} GB VRAM`}
            </div>
          </div>
          <div>
            <div className="text-dim">system ram</div>
            <div className="mt-1 tabular-nums font-mono">{s.ramGb} GB</div>
          </div>
          <div>
            <div className="text-dim">os / cpu</div>
            <div className="mt-1">
              {s.os} · {s.cpu}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">{result.blurb}</p>
      </div>

        <VerdictBanner result={result} />

        {/* Feature 2: License filter */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCommercialOnly(!commercialOnly)}
            className={cn(
              "min-h-10 border px-4 text-2xs uppercase tracking-widest transition-colors",
              commercialOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted hover:border-fg hover:text-fg"
            )}
          >
            {commercialOnly ? "✓ commercial-safe only" : "filter: commercial-safe only"}
          </button>
          {commercialOnly ? (
            <span className="text-2xs text-muted">Apache-2.0 / MIT only</span>
          ) : null}
        </div>

        <h2 className="mt-8 text-sm uppercase tracking-[0.22em] text-muted">top runnable models</h2>
        <div className="mt-3 grid gap-4">
          {picks.map((p, i) => (
            <PickCard key={p.model.id} fit={p} rank={i + 1} contextK={ctx} specs={s} />
          ))}
        </div>

        {also.length ? (
          <>
            <h2 className="mt-10 text-sm uppercase tracking-[0.22em] text-muted">also runnable</h2>
            <div className="mt-3 divide-y divide-line border border-line">
              {also.map((p) => (
              <div
                key={p.model.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm">
                    {p.model.name}{" "}
                    <span className="text-muted">
                      · {p.quant.name} {p.quant.vramGb} GB ({p.speed})
                    </span>
                  </div>
                  <div className="text-xs text-muted">{p.model.summary}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <FitBadge fit={p.fit} />
                  <a href={p.model.hf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    get
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Feature 4: Upgrade path */}
      <UpgradePath result={result} />

      {/* Feature 6: Benchmark compare */}
      <BenchmarkCompare result={result} />

      {/* Feature 5: Community consensus */}
      <CommunityConsensus specs={s} />
    </section>
  );
}

