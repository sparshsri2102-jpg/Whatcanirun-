import { useState } from "react";
import type { MatchResult, ModelFit, QuantOption, RunnerType, Specs } from "@/lib/models/types";
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

export function MatchResults({
  result,
  onContextChange,
}: {
  result: MatchResult;
  onContextChange?: (ctx: number) => void;
}) {
  const s = result.specs;
  const ctx = result.contextK ?? 8;

  // Build query string for sharing
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

      <h2 className="mt-8 text-sm uppercase tracking-[0.22em] text-muted">top runnable models</h2>
      <div className="mt-3 grid gap-4">
        {result.picks.map((p, i) => (
          <PickCard key={p.model.id} fit={p} rank={i + 1} contextK={ctx} specs={s} />
        ))}
      </div>

      {result.also.length ? (
        <>
          <h2 className="mt-10 text-sm uppercase tracking-[0.22em] text-muted">also runnable</h2>
          <div className="mt-3 divide-y divide-line border border-line">
            {result.also.map((p) => (
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
    </section>
  );
}

