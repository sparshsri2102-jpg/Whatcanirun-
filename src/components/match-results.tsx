import { useState } from "react";
import type { MatchResult, ModelFit, QuantOption, RunnerType } from "@/lib/models/types";
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
          await navigator.clipboard.writeText(cmd);
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          /* ignore */
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
): string {
  const m = fit.model;
  const qLower = selectedQuant.toLowerCase();

  switch (runner) {
    case "ollama": {
      if (m.run.ollama) {
        if (qLower.includes("q8") || qLower === "q8") return `${m.run.ollama}:q8_0`;
        if (qLower.includes("q5")) return `${m.run.ollama}:q5_k_m`;
        if (qLower.includes("q4") || qLower === "q4") return m.run.ollama;
        return `${m.run.ollama}:${qLower}`;
      }
      return `ollama run hf.co/${m.hf}:${selectedQuant}`;
    }
    case "lmstudio": {
      return `lms load ${m.hf} --gpu=max -c ${contextK * 1024}`;
    }
    case "llamacpp": {
      if (m.run.llamacpp) return m.run.llamacpp;
      return `./llama-cli -hf ${m.hf} -ngl 99 -c ${contextK * 1024}`;
    }
    case "vllm": {
      return `vllm serve ${m.hf} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.90`;
    }
    case "jan": {
      return `jan run ${m.id} --quant ${selectedQuant}`;
    }
    default:
      return m.run.ollama || m.run.llamacpp || "";
  }
}

function PickCard({ fit, rank, contextK }: { fit: ModelFit; rank: number; contextK: number }) {
  const m = fit.model;
  const [selectedQuantName, setSelectedQuantName] = useState<string>(fit.quant.name);
  const [runner, setRunner] = useState<RunnerType>("ollama");

  const activeOption: QuantOption | undefined = fit.quantOptions?.find(
    (o) => o.quant.name === selectedQuantName
  );

  const currentQuant = activeOption ? activeOption.quant : fit.quant;
  const currentFit = activeOption ? activeOption.fit : fit.fit;
  const currentSpeed = activeOption ? activeOption.speed : fit.speed;
  const currentHeadroom = activeOption ? activeOption.headroomGb : fit.headroomGb;

  const weightsGb = currentQuant.vramGb;
  const kvCacheGb = fit.kvCacheGb ?? 0.5;
  const totalMem = Math.round((weightsGb + kvCacheGb) * 10) / 10;
  const cmd = generateRunCmd(runner, fit, currentQuant.name, contextK);

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
          <dt className="text-dim">speed</dt>
          <dd className="mt-0.5">{currentSpeed}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted">
        {fit.why}
      </p>

      {/* Multi-Engine Runner Switcher */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-dim mb-1.5">
          <span>run command ({runner}):</span>
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
          <code className="break-all text-xs">{cmd}</code>
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

  return (
    <section>
      <div className="border border-line p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="text-2xs uppercase tracking-[0.28em] text-muted">your rig</div>
          {onContextChange ? (
            <div className="flex items-center gap-1 text-2xs uppercase tracking-widest text-muted">
              <span>active context:</span>
              <span className="font-mono text-fg">{ctx}k</span>
            </div>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-dim">gpu</div>
            <div className="mt-1">{s.gpu}</div>
          </div>
          <div>
            <div className="text-dim">{s.unified ? "unified" : "vram"}</div>
            <div className="mt-1 tabular-nums">{s.unified ? `${s.ramGb} GB` : `${s.vramGb} GB`}</div>
          </div>
          <div>
            <div className="text-dim">system ram</div>
            <div className="mt-1 tabular-nums">{s.ramGb} GB</div>
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

      <h2 className="mt-8 text-sm uppercase tracking-[0.22em] text-muted">top fits</h2>
      <div className="mt-3 grid gap-4">
        {result.picks.map((p, i) => (
          <PickCard key={p.model.id} fit={p} rank={i + 1} contextK={ctx} />
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
                      · {p.quant.name} {p.quant.vramGb} GB
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

