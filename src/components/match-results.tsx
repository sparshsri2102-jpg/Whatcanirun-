import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, ExternalLink, Layers, Share2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  KvQuant,
  MatchResult,
  Model,
  ModelFit,
  QuantOption,
  RunnerType,
  Specs,
} from "@/lib/models/types";
import { cn } from "@/lib/utils";
import { SimilarRigsStrip } from "./activity-ticker";
import { HfInspector } from "./hf-inspector";
import { RigCompare } from "./rig-compare";
import { StackPlanner } from "./stack-planner";
import { MethodologyNote, QuantGlossary, VramBar } from "./vram-math";

function siteUrl() {
  try {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  } catch {
    /* ssr */
  }
  return "https://myllmstack.vercel.app";
}

function FitStatus({ fit }: { fit: ModelFit["fit"] }) {
  const label =
    fit === "gpu"
      ? "GPU Native"
      : fit === "hybrid"
        ? "RAM Offload"
        : fit === "cpu"
          ? "CPU RAM"
          : "Exceeds";
  const tone =
    fit === "gpu"
      ? "text-success"
      : fit === "hybrid" || fit === "cpu"
        ? "text-primary"
        : "text-danger";

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs font-medium", tone)}>
      {fit === "gpu" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : fit === "hybrid" || fit === "cpu" ? (
        <Layers className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      )}
      {label}
    </span>
  );
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-2xs text-muted transition-colors hover:border-line-strong hover:text-fg"
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
          /* ignore */
        }
      }}
    >
      {done ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      <span>{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

function generateRunCmd(
  runner: RunnerType,
  fit: ModelFit,
  selectedQuant: string,
  contextK: number = 8,
  specs?: Specs,
  kvQuant: KvQuant = "fp16",
): string {
  const m = fit.model;
  const qLower = selectedQuant.toLowerCase();
  const gpuCount = specs?.gpuCount && specs.gpuCount > 1 ? specs.gpuCount : 1;

  switch (runner) {
    case "ollama": {
      const baseOllama = m.run.ollama ? m.run.ollama.replace(/^ollama run\s+/i, "") : `hf.co/${m.hf.replace("https://huggingface.co/", "")}`;
      let tag = "";
      if (!m.run.ollama) {
        tag = qLower.includes("q8") ? ":q8_0" : qLower.includes("q5") ? ":q5_k_m" : ":q4_k_m";
      } else if (qLower === "q8" && !baseOllama.includes(":")) {
        tag = ":q8_0";
      }
      const envParts: string[] = [];
      if (kvQuant !== "fp16") {
        envParts.push(`OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=${kvQuant}`);
      }
      if (gpuCount > 1 && !specs?.unified) {
        const devList = Array.from({ length: gpuCount }, (_, i) => i).join(",");
        envParts.push(`CUDA_VISIBLE_DEVICES=${devList}`);
      }
      const prefix = envParts.length ? `${envParts.join(" ")} ` : "";
      const ctxFlag = contextK !== 8 ? ` --num-ctx ${contextK * 1024}` : "";
      return `${prefix}ollama run ${baseOllama}${tag}${ctxFlag}`.trim();
    }
    case "lmstudio": {
      const repoRef = m.gguf?.replace("https://huggingface.co/", "") || m.hf.replace("https://huggingface.co/", "");
      const kvHint = kvQuant !== "fp16" ? ` --kv-cache ${kvQuant}` : "";
      if (gpuCount > 1) {
        return `lms load ${repoRef} --gpu=max --tensor-split ${Array(gpuCount).fill(1).join(",")} -c ${contextK * 1024}${kvHint}`;
      }
      return `lms load ${repoRef} --gpu=max -c ${contextK * 1024}${kvHint}`;
    }
    case "llamacpp": {
      const repoSlug = (m.gguf || m.hf).replace("https://huggingface.co/", "");
      const kvFlags = kvQuant !== "fp16" ? ` -fa -ctk ${kvQuant} -ctv ${kvQuant}` : " -fa";
      if (gpuCount > 1) {
        return `llama-cli -hf ${repoSlug}:${selectedQuant} -ngl 99 -sm row -c ${contextK * 1024}${kvFlags}`;
      }
      const base = m.run.llamacpp || `llama-cli -hf ${repoSlug}`;
      return `${base} -c ${contextK * 1024}${kvFlags}`;
    }
    case "vllm": {
      const repoSlug = m.hf.replace("https://huggingface.co/", "");
      const kvFlag = kvQuant !== "fp16" ? " --kv-cache-dtype fp8" : "";
      if (gpuCount > 1) {
        return `vllm serve ${repoSlug} --tensor-parallel-size ${gpuCount} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.92${kvFlag}`;
      }
      return `vllm serve ${repoSlug} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.90${kvFlag}`;
    }
    case "mlx": {
      if (m.run.mlx) {
        return `${m.run.mlx} --max-tokens 1024`;
      }
      return `mlx_lm.generate --model mlx-community/${m.name.replace(/\s+/g, "-")}-4bit --prompt "Hello"`;
    }
    case "jan": {
      return `jan run ${m.id} --quant ${selectedQuant} --ctx ${contextK * 1024}`;
    }
    default:
      return m.run.ollama || m.run.llamacpp || "";
  }
}

function ThroughputChart({ picks, also }: { picks: ModelFit[]; also: ModelFit[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    return [...picks, ...also.slice(0, 2)].slice(0, 6).map((p) => ({
      name: p.model.name.length > 18 ? `${p.model.name.slice(0, 16)}…` : p.model.name,
      tokPerSec: p.tokPerSecMin ?? 15,
      memoryGb: p.totalNeededGb ?? p.quant.vramGb,
    }));
  }, [picks, also]);

  if (!mounted || data.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-primary">Throughput &amp; Memory Footprint</div>
          <h3 className="mt-0.5 font-display text-base font-semibold text-fg">
            Estimated generation speed (tok/s) vs total memory allocated (GB)
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-primary" />
            Decode (tok/s)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-fg/80" />
            Memory (GB)
          </span>
        </div>
      </div>

      <div className="mt-4 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#A1A1AA", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111114",
                borderColor: "rgba(255,255,255,0.16)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FAFAFA",
              }}
            />
            <Bar dataKey="tokPerSec" name="Speed (tok/s)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="memoryGb" name="Total Memory (GB)" fill="#E4E4E7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SavingsVsApi() {
  const [tokensPerDay, setTokensPerDay] = useState(120_000);
  const pricePerM = 5;
  const monthlyTokens = tokensPerDay * 30;
  const monthlyCostApi = (monthlyTokens / 1_000_000) * pricePerM;
  const yearly = monthlyCostApi * 12;

  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-success">Cloud API Cost Offset</div>
          <h3 className="mt-0.5 font-display text-base font-semibold text-fg">
            At {(tokensPerDay / 1000).toFixed(0)}k tokens/day, local inference saves{" "}
            <span className="font-mono text-success">${monthlyCostApi.toFixed(0)}/mo</span> (
            <span className="font-mono text-fg">${yearly.toFixed(0)}/yr</span>)
          </h3>
        </div>
        <div className="font-mono text-xs text-muted">$0/token · Air-gapped</div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-xs text-dim shrink-0">Daily Volume</span>
          <input
            type="range"
            min={20_000}
            max={500_000}
            step={10_000}
            value={tokensPerDay}
            onChange={(e) => setTokensPerDay(Number(e.target.value))}
            aria-label="Daily token volume"
            className="flex-1 accent-primary"
          />
          <span className="w-20 text-right font-mono text-xs tabular-nums text-fg">
            {(tokensPerDay / 1000).toFixed(0)}k/day
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-line bg-bg px-3 py-2">
            <div className="text-2xs text-dim">Monthly Saved</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-success">
              ${monthlyCostApi.toFixed(0)}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-bg px-3 py-2">
            <div className="text-2xs text-dim">Annual Saved</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-fg">
              ${yearly.toFixed(0)}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-bg px-3 py-2">
            <div className="text-2xs text-dim">Data Egress</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-fg">0 bytes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PickCard({
  fit,
  rank,
  contextK,
  specs,
  kvQuant,
}: {
  fit: ModelFit;
  rank: number;
  contextK: number;
  specs: Specs;
  kvQuant: KvQuant;
}) {
  const m = fit.model;
  const [selectedQuantName, setSelectedQuantName] = useState<string>(fit.quant.name);
  const [runner, setRunner] = useState<RunnerType>(specs.unified && specs.os === "macOS" ? "mlx" : "ollama");

  useEffect(() => {
    setSelectedQuantName(fit.quant.name);
  }, [fit.quant.name]);

  const activeOption: QuantOption | undefined = fit.quantOptions?.find(
    (o) => o.quant.name === selectedQuantName,
  );

  const currentQuant = activeOption ? activeOption.quant : fit.quant;
  const currentFit = activeOption ? activeOption.fit : fit.fit;
  const currentSpeed = activeOption?.tokPerSec || activeOption?.speed || fit.tokPerSec || fit.speed;
  const currentHeadroom = activeOption ? activeOption.headroomGb : fit.headroomGb;
  const currentTtft = activeOption?.ttftMs ?? fit.ttftMs ?? 120;
  const currentPrefill = activeOption?.prefillTokS ?? fit.prefillTokS ?? 650;

  const weightsGb = currentQuant.vramGb;
  const kvCacheGb = fit.kvCacheGb ?? 0.5;
  const totalMem = Math.round((weightsGb + kvCacheGb) * 10) / 10;
  const cmd = generateRunCmd(runner, fit, currentQuant.name, contextK, specs, kvQuant);
  const poolCap = specs.unified
    ? Math.round(specs.ramGb * 0.72 * 10) / 10
    : Math.max(1, specs.vramGb * Math.max(1, specs.gpuCount || 1));

  const runners: RunnerType[] = specs.unified && specs.os === "macOS"
    ? ["mlx", "ollama", "lmstudio", "llamacpp", "jan"]
    : ["ollama", "lmstudio", "llamacpp", "vllm", "jan"];

  return (
    <article className="rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className="font-mono text-dim">{String(rank).padStart(2, "0")}</span>
            <span>·</span>
            <span className="font-medium text-fg">{m.org}</span>
            {m.architecture ? (
              <>
                <span>·</span>
                <span>{m.architecture}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{m.license}</span>
            {m.contextK > 0 ? (
              <>
                <span>·</span>
                <span className="font-mono">{m.contextK}k max ctx</span>
              </>
            ) : null}
          </div>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-fg">{m.name}</h3>
        </div>
        <div className="shrink-0">
          <FitStatus fit={currentFit} />
        </div>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-muted">{m.summary}</p>

      {/* Interactive Quantization Matrix */}
      {fit.quantOptions && fit.quantOptions.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-dim">
            <span>Quantization Format</span>
            <span className="font-mono text-muted">
              Active: {currentQuant.name} ({currentQuant.quality}/100 fidelity)
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fit.quantOptions.map((opt) => {
              const isSelected = opt.quant.name === currentQuant.name;
              const noFit = opt.fit === "no";
              return (
                <button
                  key={opt.quant.name}
                  type="button"
                  disabled={noFit}
                  title={noFit ? `Needs ~${opt.totalNeededGb} GB — exceeds available memory` : undefined}
                  onClick={() => setSelectedQuantName(opt.quant.name)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary/15 text-fg font-medium"
                      : noFit
                        ? "border-line/50 bg-transparent text-dim/50 cursor-not-allowed line-through"
                        : "border-line bg-bg text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {opt.quant.name} · {opt.quant.vramGb} GB
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Core Performance & Memory Metrics */}
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-bg p-3.5 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-dim">Total Footprint</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-fg">
            {totalMem} GB
          </dd>
          <dd className="mt-0.5 font-mono text-2xs text-dim tabular-nums whitespace-nowrap">
            {weightsGb}W + {kvCacheGb}KV · &le;{activeOption?.maxSafeContextK ?? fit.maxSafeContextK ?? 0}k ctx
          </dd>
        </div>
        <div>
          <dt className="text-dim">Decode Speed</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-primary">{currentSpeed}</dd>
          <dd className="mt-0.5 font-mono text-2xs text-dim tabular-nums">
            Prefill ~{currentPrefill} tok/s
          </dd>
        </div>
        <div>
          <dt className="text-dim">1k Prompt TTFT</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-fg">
            {currentTtft >= 1000 ? `${(currentTtft / 1000).toFixed(1)}s` : `${currentTtft} ms`}
          </dd>
          <dd className="mt-0.5 font-mono text-2xs text-dim">{m.params}</dd>
        </div>
        <div>
          <dt className="text-dim">Headroom</dt>
          <dd
            className={cn(
              "mt-1 font-mono font-semibold tabular-nums",
              currentHeadroom >= 2 ? "text-success" : currentHeadroom >= 0 ? "text-primary" : "text-danger",
            )}
          >
            {currentHeadroom > 0 ? `+${currentHeadroom} GB` : `${currentHeadroom} GB`}
          </dd>
          <dd className="mt-0.5 text-2xs text-dim capitalize">
            {currentFit !== "gpu" && fit.cloudFallback
              ? `Cloud: ${fit.cloudFallback.name} ~$${fit.cloudFallback.hourlyUsd.toFixed(2)}/hr`
              : m.tasks.slice(0, 3).join(", ")}
          </dd>
        </div>
      </dl>

      <VramBar fit={{ ...fit, quant: currentQuant, weightsGb }} capacityGb={poolCap} kvQuant={kvQuant} />

      {/* Multi-Runner Command Switcher */}
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">
            Launch Command{specs.gpuCount > 1 ? ` · ${specs.gpuCount}x Tensor Split` : ""}
          </span>
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-bg p-0.5">
            {runners.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunner(r)}
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-2xs uppercase transition-colors",
                  runner === r ? "bg-elevated text-fg font-medium" : "text-dim hover:text-muted",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-bg px-3.5 py-2.5">
          <code className="break-all font-mono text-xs text-fg">{cmd}</code>
          <CopyCmd cmd={cmd} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs">
        <a
          href={m.hf}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted hover:text-fg transition-colors"
        >
          <span>Hugging Face</span>
          <ExternalLink className="h-3 w-3" />
        </a>
        {m.gguf ? (
          <a
            href={m.gguf}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted hover:text-fg transition-colors"
          >
            <span>GGUF Weights</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {m.notes ? <span className="text-dim">{m.notes}</span> : null}
      </div>
    </article>
  );
}

function ViralityShareStrip({ result }: { result: MatchResult }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const s = result.specs;
  const top = result.picks[0];

  const shareUrl = useMemo(() => {
    const p = new URLSearchParams({
      gpu: s.gpu,
      vram: String(s.vramGb),
      ram: String(s.ramGb),
      cpu: s.cpu,
      os: s.os,
      unified: s.unified ? "1" : "0",
      gpus: String(s.gpuCount || 1),
      ctx: String(result.contextK ?? 8),
    });
    return `${siteUrl()}/share?${p.toString()}`;
  }, [s, result.contextK]);

  const tweetText = top
    ? `My ${s.gpu} runs ${top.model.name} at ${top.tokPerSec || top.speed} (${top.quant.name}, ${top.quant.vramGb} GB). Verified locally:`
    : `Verify what open-weight AI models fit your hardware:`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !top) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 880;
    const H = 460;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#09090B";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#111114";
    ctx.fillRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Header
    ctx.fillStyle = "#F59E0B";
    ctx.font = "600 12px JetBrains Mono";
    ctx.fillText("WHAT CAN I RUN  ·  VERIFIED HARDWARE COMPATIBILITY", 44, 58);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(44, 76);
    ctx.lineTo(W - 44, 76);
    ctx.stroke();

    const rigLine = s.unified
      ? `${s.ramGb} GB Unified Memory · ${s.gpu}`
      : `${s.gpuCount > 1 ? `${s.gpuCount}x ` : ""}${s.gpu} · ${s.vramGb * Math.max(1, s.gpuCount || 1)} GB VRAM`;
    ctx.fillStyle = "#FAFAFA";
    ctx.font = "700 24px Plus Jakarta Sans, sans-serif";
    ctx.fillText(rigLine.slice(0, 48), 44, 116);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = "13px JetBrains Mono";
    ctx.fillText(
      `${s.os} · ${s.ramGb} GB RAM · ${result.contextK ?? 8}k ctx (${(result.kvQuant ?? "fp16").toUpperCase()} KV) · ${top.bandwidthGbS || 900} GB/s`,
      44,
      142,
    );

    const fits = top.fit !== "no";
    ctx.fillStyle = fits ? "#10B981" : "#EF4444";
    ctx.font = "700 20px Plus Jakarta Sans, sans-serif";
    ctx.fillText(fits ? `PASS · ${top.model.name}` : `OFFLOAD · ${top.model.name}`, 44, 192);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = "13px JetBrains Mono";
    ctx.fillText(
      `${top.quant.name} (${top.quant.vramGb} GB) · ${top.tokPerSec || top.speed} · Quality ${top.model.quality}/100`,
      44,
      218,
    );

    let y = 264;
    ctx.fillStyle = "#71717A";
    ctx.font = "600 11px JetBrains Mono";
    ctx.fillText("TOP RECOMMENDED MODELS", 44, y);
    y += 20;

    result.picks.slice(0, 3).forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "rgba(245,158,11,0.10)" : "#18181B";
      ctx.fillRect(44, y - 14, W - 88, 32);
      ctx.fillStyle = "#FAFAFA";
      ctx.font = "500 13px DM Sans, sans-serif";
      ctx.fillText(`${i + 1}. ${p.model.name}`, 56, y + 6);
      ctx.fillStyle = "#F59E0B";
      ctx.font = "600 12px JetBrains Mono";
      ctx.fillText(p.quant.name, 360, y + 6);
      ctx.fillStyle = "#A1A1AA";
      ctx.font = "12px JetBrains Mono";
      ctx.fillText(`${p.quant.vramGb} GB  ·  ${p.tokPerSec || p.speed}`, 440, y + 6);
      ctx.fillStyle = p.fit === "gpu" ? "#10B981" : "#F59E0B";
      ctx.fillText(p.fit === "gpu" ? "GPU NATIVE" : p.fit.toUpperCase(), 730, y + 6);
      y += 40;
    });

    ctx.fillStyle = "#71717A";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText("whatcanirun · local AI hardware fit & KV cache calculator", 44, H - 36);
  }, [s, top, result.picks, result.contextK, result.kvQuant]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `whatcanirun-${s.gpu.replace(/\s+/g, "_")}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
    setCopied("dl");
    setTimeout(() => setCopied(null), 1600);
  };

  const copyImage = async () => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const blob: Blob | null = await new Promise((res) => c.toBlob((r) => res(r)));
      if (!blob) throw new Error("no blob");
      const item = new window.ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      setCopied("img");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      download();
    }
  };

  if (!top) return null;

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-primary">Shareable Fit Report</div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-fg">
            Export hardware compatibility badge
          </h3>
        </div>
        <a
          href={`/share?${shareUrl.split("?")[1] || ""}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg px-3 py-1.5 text-xs font-medium text-fg hover:border-fg/40"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Open Share Studio</span>
        </a>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-lg border border-line bg-bg p-2">
          <canvas
            ref={canvasRef}
            className="h-auto w-full"
            style={{ aspectRatio: "880/460" }}
            aria-label="Hardware compatibility summary card"
          />
        </div>
        <div className="flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyImage}
              className="h-10 rounded-lg bg-fg px-3 text-xs font-medium text-bg hover:opacity-90"
            >
              {copied === "img" ? "Copied Image" : "Copy Image"}
            </button>
            <button
              type="button"
              onClick={download}
              className="h-10 rounded-lg border border-line bg-bg px-3 text-xs text-fg hover:border-line-strong"
            >
              {copied === "dl" ? "Downloaded" : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={() => copy(shareUrl, "url")}
              className="h-10 rounded-lg border border-line bg-bg px-3 text-xs text-muted hover:text-fg"
            >
              {copied === "url" ? "Link Copied" : "Copy Link"}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-bg px-3 text-xs text-muted hover:text-fg"
            >
              Post on X
            </a>
          </div>
          <p className="text-xs leading-relaxed text-dim">
            Encoded parameters load dynamically via URL query — no server tracking or user account required.
          </p>
        </div>
      </div>
    </div>
  );
}

function BenchmarkCompare({ result }: { result: MatchResult }) {
  const top3 = result.picks.slice(0, 3);
  if (top3.length < 2) return null;

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-5">
      <div className="text-xs font-medium text-muted">Side-by-Side Comparison</div>
      <h3 className="mt-0.5 font-display text-lg font-semibold text-fg">
        Top 3 matched models on your rig
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-xs">
          <thead>
            <tr className="border-b border-line text-dim">
              <th className="pb-2.5 font-medium">Metric</th>
              {top3.map((p) => (
                <th key={p.model.id} className="px-4 pb-2.5 text-right font-semibold text-fg">
                  {p.model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="py-2.5 text-muted">Quality Score</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right font-mono tabular-nums text-fg">
                  {p.model.quality}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-muted">Decode Speed</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right font-mono tabular-nums text-primary">
                  {p.tokPerSec ?? p.speed ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-muted">Weights + Quant</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right font-mono tabular-nums text-fg">
                  {p.quant.vramGb} GB ({p.quant.name})
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-muted">1k Prompt TTFT</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right font-mono tabular-nums text-fg">
                  {p.ttftMs ? `${p.ttftMs} ms` : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-muted">License</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right text-muted">
                  {p.model.license}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-muted">Execution Mode</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-2.5 text-right">
                  <FitStatus fit={p.fit} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MatchResults({
  result,
  onContextChange,
  onBatchChange,
  onSelectRig,
}: {
  result: MatchResult;
  onContextChange?: (ctx: number) => void;
  onBatchChange?: (batch: number) => void;
  onSelectRig?: (specs: Specs) => void;
}) {
  const s = result.specs;
  const ctx = result.contextK ?? 8;
  const kvQuant: KvQuant = result.kvQuant ?? "fp16";
  const batchSize = result.batchSize ?? 1;
  const [commercialOnly, setCommercialOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"models" | "hf" | "stack" | "compare">("models");

  const isCommercial = (m: Model) => ["Apache-2.0", "MIT", "BSD"].includes(m.license);
  const picks = commercialOnly ? result.picks.filter((p) => isCommercial(p.model)) : result.picks;
  const also = commercialOnly ? result.also.filter((p) => isCommercial(p.model)) : result.also;

  const top = result.picks[0];
  const topFitsGpu = top?.fit === "gpu";
  const bandwidthGbS = top?.bandwidthGbS ?? 0;

  return (
    <section aria-label="Compatibility results">
      {/* Executive Rig KPI Strip */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-medium text-primary">Active Hardware Profile</div>
            <h2 className="mt-0.5 font-display text-xl font-semibold text-fg">
              {s.gpuCount > 1 && !s.unified ? `${s.gpuCount}x ` : ""}
              {s.gpu}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onContextChange ? (
              <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg p-1 text-xs">
                <span className="px-1.5 text-2xs text-dim">Ctx</span>
                {[4, 8, 32, 128].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onContextChange(c)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono transition-colors whitespace-nowrap",
                      ctx === c ? "bg-elevated text-fg font-medium" : "text-dim hover:text-muted",
                    )}
                  >
                    {c}k
                  </button>
                ))}
              </div>
            ) : null}

            {onBatchChange ? (
              <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg p-1 text-xs">
                <span className="px-1.5 text-2xs text-dim">Batch</span>
                {[1, 4, 8].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onBatchChange(b)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono transition-colors whitespace-nowrap",
                      batchSize === b ? "bg-elevated text-primary font-medium" : "text-dim hover:text-muted",
                    )}
                  >
                    {b}x
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line bg-bg p-3.5">
            <div className="text-xs text-dim">
              {s.unified ? "Unified Memory Pool" : "Usable GPU VRAM"}
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-fg">
              {result.effectivePoolGb ?? (s.unified ? Math.round(s.ramGb * 0.72) : s.vramGb)} GB
            </div>
            <div className="mt-0.5 font-mono text-2xs text-dim">
              {s.unified
                ? `${s.ramGb} GB total unified`
                : `${s.vramGb * Math.max(1, s.gpuCount || 1)} GB raw + ${s.ramGb} GB RAM`}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-bg p-3.5">
            <div className="text-xs text-dim">Memory Bandwidth</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-fg">
              {bandwidthGbS ? `${bandwidthGbS} GB/s` : "DDR System"}
            </div>
            <div className="mt-0.5 text-2xs text-dim truncate">
              {top?.busType || `${s.os} · ${s.cpu}`}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-bg p-3.5">
            <div className="text-xs text-dim">Top Verdict</div>
            <div
              className={cn(
                "mt-1 font-display text-xl font-semibold",
                topFitsGpu ? "text-success" : "text-primary",
              )}
            >
              {topFitsGpu ? "GPU Native" : top ? "Offload / CPU" : "Below Floor"}
            </div>
            <div className="mt-0.5 text-2xs text-dim truncate">
              {top ? `${top.model.name} (${top.quant.name})` : "Adjust context or quant"}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-bg p-3.5">
            <div className="text-xs text-dim">Context, KV &amp; Batch</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-fg">
              {ctx}k · {kvQuant.toUpperCase()} · {batchSize}x
            </div>
            <div className="mt-0.5 text-2xs text-dim">
              {kvQuant === "fp16" ? "Uncompressed KV cache" : "FlashAttention KV compressed"}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted">{result.blurb}</p>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Analysis views">
          {[
            { id: "models" as const, label: `Matched Models (${picks.length + also.length})` },
            { id: "hf" as const, label: "HF Repo Inspector & Fine-Tune" },
            { id: "stack" as const, label: "Co-Resident Stack Planner" },
            { id: "compare" as const, label: "Rig Upgrade & Cloud ROI" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                activeTab === tab.id
                  ? "border-primary/60 bg-primary/15 text-fg"
                  : "border-line bg-surface text-muted hover:text-fg",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "models" ? (
          <button
            type="button"
            onClick={() => setCommercialOnly(!commercialOnly)}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              commercialOnly
                ? "border-success/60 bg-success/10 text-success"
                : "border-line bg-surface text-muted hover:text-fg",
            )}
          >
            {commercialOnly ? "Commercial Licenses Only (Apache/MIT)" : "Filter: Apache / MIT Only"}
          </button>
        ) : null}
      </div>

      {activeTab === "models" ? (
        <div className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {picks.map((fit, idx) => (
              <PickCard
                key={fit.model.id}
                fit={fit}
                rank={idx + 1}
                contextK={ctx}
                specs={s}
                kvQuant={kvQuant}
              />
            ))}
          </div>

          <ThroughputChart picks={picks} also={also} />

          {also.length > 0 ? (
            <div className="mt-8 rounded-xl border border-line bg-surface p-5">
              <div className="text-xs font-medium text-muted">Additional Compatible Models</div>
              <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-bg">
                {also.map((f) => (
                  <div
                    key={f.model.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-medium text-fg">{f.model.name}</span>
                        <span className="text-xs text-dim">
                          · {f.model.org} · {f.quant.name} ({f.quant.vramGb} GB) · {f.model.license}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">{f.why}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs tabular-nums text-primary">{f.speed}</span>
                      <FitStatus fit={f.fit} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <BenchmarkCompare result={result} />
          <SimilarRigsStrip specs={s} />
          <QuantGlossary />
          <MethodologyNote />
          <ViralityShareStrip result={result} />
        </div>
      ) : null}

      {activeTab === "hf" ? (
        <div className="mt-6">
          <HfInspector specs={s} defaultContextK={ctx} defaultKvQuant={kvQuant} />
        </div>
      ) : null}

      {activeTab === "stack" ? (
        <div className="mt-6">
          <StackPlanner specs={s} contextK={ctx} kvQuant={kvQuant} />
        </div>
      ) : null}

      {activeTab === "compare" ? (
        <div className="mt-6">
          <RigCompare
            specs={s}
            contextK={ctx}
            kvQuant={kvQuant}
            onSelectTargetRig={onSelectRig}
          />
          <SavingsVsApi />
        </div>
      ) : null}
    </section>
  );
}
