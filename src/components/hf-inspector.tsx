import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Cloud, Copy, Cpu, Layers, Search } from "lucide-react";
import {
  evaluateHfArchitecture,
  KNOWN_HF_ARCHITECTURES,
  PRECISION_SPECS,
  type HfArchitecture,
  type PrecisionFormat,
  type WorkloadMode,
} from "@/lib/models/hf-architecture";
import type { KvQuant, Specs } from "@/lib/models/types";
import { inspectHuggingFaceRepo } from "@/lib/server/hf-inspect";
import { cn } from "@/lib/utils";

const QUICK_REPOS = [
  "Qwen/Qwen3-32B",
  "Qwen/Qwen3-30B-A3B",
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
  "meta-llama/Llama-3.3-70B-Instruct",
  "deepseek-ai/DeepSeek-R1",
];

const PRECISIONS: PrecisionFormat[] = [
  "IQ2_XS",
  "Q3_K_M",
  "EXL2_4.5",
  "Q4_K_M",
  "Q5_K_M",
  "Q8_0",
  "FP8",
  "BF16",
];

const CONTEXT_STEPS = [4, 8, 16, 32, 64, 128];
const BATCH_STEPS = [1, 2, 4, 8];

export function HfInspector({
  specs,
  defaultContextK = 8,
  defaultKvQuant = "fp16",
}: {
  specs: Specs;
  defaultContextK?: number;
  defaultKvQuant?: KvQuant;
}) {
  const [repoInput, setRepoInput] = useState("Qwen/Qwen3-32B");
  const [arch, setArch] = useState<HfArchitecture>(KNOWN_HF_ARCHITECTURES["Qwen/Qwen3-32B"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workload, setWorkload] = useState<WorkloadMode>("inference");
  const [precision, setPrecision] = useState<PrecisionFormat>("Q4_K_M");
  const [contextK, setContextK] = useState<number>(defaultContextK);
  const [kvQuant, setKvQuant] = useState<KvQuant>(defaultKvQuant);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [manualLayerRatio, setManualLayerRatio] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const breakdown = useMemo(
    () =>
      evaluateHfArchitecture(arch, specs, {
        precision,
        contextK,
        kvQuant,
        batchSize,
        workload,
        gpuLayerRatio: manualLayerRatio ?? undefined,
      }),
    [arch, specs, precision, contextK, kvQuant, batchSize, workload, manualLayerRatio],
  );

  async function handleInspect(targetRepo?: string) {
    const query = (targetRepo ?? repoInput).trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setManualLayerRatio(null);
    try {
      const res = await inspectHuggingFaceRepo({ data: { repoInput: query } });
      if (res.ok) {
        setArch(res.arch);
        setRepoInput(res.arch.repoId);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to inspect repository config.json.");
    } finally {
      setLoading(false);
    }
  }

  const commandText = useMemo(() => {
    const tokens = contextK * 1024;
    if (workload === "qlora" || workload === "lora") {
      const modeFlag = workload === "qlora" ? "--load_in_4bit true" : "--bf16 true";
      return `trl sft --model_name_or_path ${arch.repoId} ${modeFlag} --use_peft --per_device_train_batch_size ${batchSize} --max_seq_length ${tokens}`;
    }
    const kvFlag = kvQuant !== "fp16" ? ` -fa -ctk ${kvQuant} -ctv ${kvQuant}` : " -fa";
    if (precision === "FP8" || precision === "BF16") {
      const dtype = precision === "FP8" ? "--quantization fp8" : "--dtype bfloat16";
      const kvDtype = kvQuant !== "fp16" ? " --kv-cache-dtype fp8" : "";
      return `vllm serve ${arch.repoId} ${dtype} --max-model-len ${tokens} --max-num-seqs ${batchSize}${kvDtype}`;
    }
    return `llama-cli -hf ${arch.repoId} -ngl ${breakdown.gpuLayers} -c ${tokens} -np ${batchSize}${kvFlag}`;
  }, [arch.repoId, workload, precision, contextK, kvQuant, batchSize, breakdown.gpuLayers]);

  const gpuSharePct = Math.min(
    100,
    Math.round((breakdown.gpuAllocatedGb / Math.max(1, breakdown.totalMemoryGb)) * 100),
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-xs font-medium text-primary">
            Live Hugging Face config.json &amp; Training Calculator
          </div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-fg">
            Inspect any Hugging Face model or simulate QLoRA fine-tuning
          </h3>
          <p className="mt-1 text-xs text-muted">
            Pulls real layer count, GQA/MLA key-value heads, and expert geometry from Hugging Face Hub to size VRAM,
            concurrency batching, and exact GPU layer offload.
          </p>
        </div>
        <span className="font-mono text-xs text-dim">
          {arch.source === "hf-live" ? "Live Hub Config" : "Architecture Profile"}
        </span>
      </div>

      {/* Repo Fetch Input + Quick Presets */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleInspect();
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Paste Hugging Face repo ID or URL (e.g. Qwen/Qwen3-32B)"
            aria-label="Hugging Face repository ID"
            className="h-10 w-full rounded-lg border border-line bg-bg pr-3 pl-9 font-mono text-xs text-fg placeholder:text-dim focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-10 shrink-0 rounded-lg bg-primary px-4 text-xs font-semibold text-invert-fg transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Inspecting config.json…" : "Inspect HF Model"}
        </button>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-2xs text-dim">Quick inspect:</span>
        {QUICK_REPOS.map((repo) => (
          <button
            key={repo}
            type="button"
            onClick={() => {
              setRepoInput(repo);
              void handleInspect(repo);
            }}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-2xs transition-colors whitespace-nowrap shrink-0",
              arch.repoId.toLowerCase() === repo.toLowerCase()
                ? "border-primary/60 bg-primary/15 text-fg"
                : "border-line bg-bg text-muted hover:text-fg",
            )}
          >
            {repo}
          </button>
        ))}
      </div>

      {error ? (
        <div
          className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-fg"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Extracted Architecture Summary Strip */}
      <div className="mt-4 grid gap-2.5 rounded-lg border border-line bg-bg p-3.5 text-xs sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <div className="text-2xs text-dim">Repository</div>
          <div className="mt-0.5 truncate font-mono font-medium text-fg" title={arch.repoId}>
            {arch.repoId}
          </div>
        </div>
        <div>
          <div className="text-2xs text-dim">Parameters</div>
          <div className="mt-0.5 font-mono font-medium tabular-nums text-fg">
            {arch.totalParamsB}B {arch.isMoe ? `(${arch.activeParamsB}B active)` : "dense"}
          </div>
        </div>
        <div>
          <div className="text-2xs text-dim">Layers / Hidden</div>
          <div className="mt-0.5 font-mono font-medium tabular-nums text-fg">
            {arch.numHiddenLayers}L · {arch.hiddenSize}d
          </div>
        </div>
        <div>
          <div className="text-2xs text-dim">Attention / KV</div>
          <div className="mt-0.5 font-mono font-medium tabular-nums text-fg">
            {arch.isMla
              ? `MLA (rank ${arch.kvLoraRank})`
              : `GQA ${arch.numAttentionHeads}Q / ${arch.numKeyValueHeads}KV`}
          </div>
        </div>
        <div>
          <div className="text-2xs text-dim">Native Max Ctx</div>
          <div className="mt-0.5 font-mono font-medium tabular-nums text-fg">
            {Math.round(arch.maxPositionEmbeddings / 1024)}k tokens
          </div>
        </div>
        <div>
          <div className="text-2xs text-dim">Max VRAM-Native Ctx</div>
          <div
            className={cn(
              "mt-0.5 font-mono font-semibold tabular-nums",
              breakdown.maxSafeContextK > 0 ? "text-success" : "text-danger",
            )}
          >
            {breakdown.maxSafeContextK > 0 ? `${breakdown.maxSafeContextK}k tokens` : "0k (Needs Offload)"}
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-line bg-bg p-4">
          <div>
            <div className="text-xs font-medium text-muted">Workload Mode</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {[
                { id: "inference" as const, label: "Inference" },
                { id: "qlora" as const, label: "QLoRA 4-bit" },
                { id: "lora" as const, label: "LoRA 16-bit" },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWorkload(w.id)}
                  className={cn(
                    "h-9 rounded-md border px-2 font-mono text-xs transition-colors whitespace-nowrap",
                    workload === w.id
                      ? "border-primary bg-primary/15 text-fg font-medium"
                      : "border-line bg-surface text-muted hover:text-fg",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Weight Precision / Quant</span>
              <span className="font-mono text-2xs text-dim">
                {PRECISION_SPECS[precision].family} · {PRECISION_SPECS[precision].quality}/100
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {PRECISIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={workload !== "inference"}
                  onClick={() => setPrecision(p)}
                  className={cn(
                    "h-8 rounded-md border px-1.5 font-mono text-2xs transition-colors whitespace-nowrap",
                    workload !== "inference"
                      ? "border-line/40 text-dim/40 cursor-not-allowed"
                      : precision === p
                        ? "border-primary bg-primary/15 text-fg font-medium"
                        : "border-line bg-surface text-muted hover:text-fg",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-medium text-muted">Sequence Length</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {CONTEXT_STEPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContextK(c)}
                    className={cn(
                      "rounded-md border px-2 py-1 font-mono text-2xs transition-colors",
                      contextK === c
                        ? "border-primary bg-primary/15 text-fg font-medium"
                        : "border-line bg-surface text-muted hover:text-fg",
                    )}
                  >
                    {c}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted">Concurrent Batch</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {BATCH_STEPS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatchSize(b)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-2xs transition-colors",
                      batchSize === b
                        ? "border-primary bg-primary/15 text-fg font-medium"
                        : "border-line bg-surface text-muted hover:text-fg",
                    )}
                  >
                    {b}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted">KV Cache Quant</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(["fp16", "q8_0", "q4_0"] as KvQuant[]).map((kq) => (
                  <button
                    key={kq}
                    type="button"
                    disabled={workload !== "inference"}
                    onClick={() => setKvQuant(kq)}
                    className={cn(
                      "rounded-md border px-2 py-1 font-mono text-2xs uppercase transition-colors",
                      workload !== "inference"
                        ? "border-line/40 text-dim/40 cursor-not-allowed"
                        : kvQuant === kq
                          ? "border-primary bg-primary/15 text-fg font-medium"
                          : "border-line bg-surface text-muted hover:text-fg",
                    )}
                  >
                    {kq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {workload === "inference" ? (
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted">
                  GPU Offload Layers (<code className="font-mono">-ngl</code>)
                </span>
                <span className="font-mono text-fg tabular-nums">
                  {breakdown.gpuLayers} / {arch.numHiddenLayers} layers on GPU
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={arch.numHiddenLayers}
                step={1}
                value={breakdown.gpuLayers}
                onChange={(e) => setManualLayerRatio(Number(e.target.value) / Math.max(1, arch.numHiddenLayers))}
                aria-label="GPU offload layers"
                className="mt-2 w-full accent-primary"
              />
              <div className="mt-1 flex items-center justify-between text-2xs text-dim">
                <span>0 (CPU only)</span>
                <button
                  type="button"
                  onClick={() => setManualLayerRatio(null)}
                  className="text-primary hover:underline"
                >
                  Auto-fit layers
                </button>
                <span>{arch.numHiddenLayers} (Full GPU)</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Mathematical Footprint & Speed Breakdown */}
        <div className="flex flex-col justify-between rounded-lg border border-line bg-bg p-4">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="text-2xs text-dim">Total Memory Required</div>
                <div className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-fg">
                  {breakdown.totalMemoryGb} GB
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 font-mono text-xs font-medium",
                    breakdown.fit === "gpu"
                      ? "text-success"
                      : breakdown.fit === "hybrid" || breakdown.fit === "cpu"
                        ? "text-primary"
                        : "text-danger",
                  )}
                >
                  {breakdown.fit === "gpu" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : breakdown.fit === "no" ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" />
                  )}
                  {workload !== "inference"
                    ? breakdown.fit === "gpu"
                      ? "Viable in Pure VRAM"
                      : "Exceeds GPU VRAM (OOM)"
                    : breakdown.fit === "gpu"
                      ? "Fits Purely in VRAM"
                      : breakdown.fit === "hybrid"
                        ? "GPU + RAM Split"
                        : breakdown.fit === "cpu"
                          ? "CPU RAM Only"
                          : "Exceeds Local Hardware"}
                </span>
                <div className="mt-0.5 font-mono text-2xs text-dim tabular-nums">
                  {breakdown.headroomGb >= 0
                    ? `+${breakdown.headroomGb} GB ${workload !== "inference" ? "VRAM headroom" : "headroom"}`
                    : `${breakdown.headroomGb} GB ${workload !== "inference" ? "VRAM deficit" : "deficit"}`}
                </div>
              </div>
            </div>

            {/* Component Memory Audit Table */}
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Model Weights ({workload === "qlora" ? "NF4 4-bit" : workload === "lora" ? "BF16" : precision})</dt>
                <dd className="font-mono font-medium tabular-nums text-fg">{breakdown.weightsGb} GB</dd>
              </div>
              {workload === "inference" ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">
                    KV Cache ({contextK}k × {batchSize}x batch · {kvQuant.toUpperCase()})
                  </dt>
                  <dd className="font-mono font-medium tabular-nums text-fg">{breakdown.kvCacheGb} GB</dd>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">LoRA Adapters + Optimizer + Activations</dt>
                  <dd className="font-mono font-medium tabular-nums text-fg">{breakdown.trainingStateGb} GB</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted">CUDA / Metal Runtime &amp; Scratch Buffer</dt>
                <dd className="font-mono font-medium tabular-nums text-fg">{breakdown.runtimeOverheadGb} GB</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2">
                <dt className="text-muted">
                  {workload === "inference" ? `Estimated Speed (${specs.gpu})` : `Training Viability (${specs.gpu})`}
                </dt>
                <dd
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    workload !== "inference" && breakdown.fit !== "gpu" ? "text-danger" : "text-primary",
                  )}
                >
                  {workload === "inference"
                    ? `${breakdown.tokPerSecMin}–${breakdown.tokPerSecMax} tok/s · ${breakdown.ttftMs}ms TTFT`
                    : breakdown.fit === "gpu"
                      ? "Viable local fine-tune"
                      : "Reduce seq/batch or rent cloud"}
                </dd>
              </div>
            </dl>

            {/* GPU vs RAM Offload Split Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-2xs text-dim">
                <span>GPU Allocated: {breakdown.gpuAllocatedGb} GB</span>
                <span>System RAM Spill: {breakdown.ramOffloadedGb} GB</span>
              </div>
              <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="bg-success transition-all"
                  style={{ width: `${gpuSharePct}%` }}
                />
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${100 - gpuSharePct}%` }}
                />
              </div>
            </div>
          </div>

          {breakdown.cloudFallback ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-medium text-fg">
                    Cloud GPU Alternative: {breakdown.cloudFallback.name}
                  </div>
                  <div className="text-2xs text-muted">
                    Runs in pure VRAM ({breakdown.cloudFallback.providerHint})
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums text-primary whitespace-nowrap">
                ~${breakdown.cloudFallback.hourlyUsd.toFixed(2)}/hr
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              <Cpu className="h-4 w-4 shrink-0" />
              <span>Zero cloud rental needed — runs natively on your local {specs.gpu}.</span>
            </div>
          )}
        </div>
      </div>

      {/* Generated Launch / Fine-Tune Command */}
      <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-line bg-bg px-3.5 py-2.5">
        <code className="break-all font-mono text-xs text-fg">{commandText}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(commandText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-2xs text-muted hover:text-fg"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
