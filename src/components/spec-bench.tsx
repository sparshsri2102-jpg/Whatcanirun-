import { useEffect, useRef, useState } from "react";
import { Check, Cpu, Image as ImageIcon, Sliders, Sparkles, Terminal } from "lucide-react";
import { PRESETS } from "@/lib/models/catalog";
import { detectSystemHardware } from "@/lib/models/detect-hardware";
import type { KvQuant, MatchResult, ModelTask, Specs } from "@/lib/models/types";
import { matchHardware } from "@/lib/server/match";
import { createWatcher } from "@/lib/server/watchers";
import { cn } from "@/lib/utils";
import { bumpStreak, StreakBadge } from "./activity-ticker";
import { MatchResults } from "./match-results";
import { OomFixer } from "./oom-fixer";
import { TerminalProcessing } from "./terminal-processing";

const POPULAR_CHECKS: Array<{ label: string; href: string; note: string }> = [
  { label: "RTX 4060 8GB → Qwen3 8B", href: "/can/qwen3-8b-on-rtx-3060", note: "8 GB baseline" },
  { label: "RTX 4090 24GB → Qwen3.8 27B", href: "/can/qwen3.8-27b-on-rtx-4090", note: "24 GB sweet spot" },
  { label: "RTX 5080 16GB → Qwen3 14B", href: "/can/qwen3-14b-on-rtx-5080", note: "16 GB Blackwell" },
  { label: "RTX 4070 12GB → Gemma 3 12B", href: "/can/gemma3-12b-on-rtx-4070", note: "12 GB vision" },
  { label: "Mac M4 16GB → Phi-4 Mini", href: "/can/phi-4-mini-on-m4-16", note: "16 GB unified" },
  { label: "Dual 3090 (48GB) → Llama 3.3 70B", href: "/can/llama-3.3-70b-on-dual-rtx-3090", note: "Multi-GPU" },
];

function loadHistory(): Specs[] {
  try {
    const raw = localStorage.getItem("whatcanirun_history");
    const arr = raw ? (JSON.parse(raw) as Specs[]) : [];
    return Array.isArray(arr)
      ? arr.filter((s) => s && typeof s.vramGb === "number").slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

function pushHistory(specs: Specs) {
  try {
    const prev = loadHistory().filter(
      (s) => s.gpu !== specs.gpu || s.vramGb !== specs.vramGb || s.ramGb !== specs.ramGb,
    );
    localStorage.setItem("whatcanirun_history", JSON.stringify([specs, ...prev].slice(0, 4)));
    window.dispatchEvent(new Event("whatcanirun:history"));
  } catch {
    /* ignore */
  }
}

const TASKS: Array<{ id: ModelTask | "any"; label: string }> = [
  { id: "any", label: "All Tasks" },
  { id: "chat", label: "Chat" },
  { id: "code", label: "Coding" },
  { id: "reason", label: "Reasoning" },
  { id: "vision", label: "Vision" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "agent", label: "Agents" },
];

const CONTEXT_OPTIONS = [
  { id: 4, label: "4k" },
  { id: 8, label: "8k" },
  { id: 32, label: "32k" },
  { id: 128, label: "128k" },
];

const KV_OPTIONS: Array<{ id: KvQuant; label: string; note: string }> = [
  { id: "fp16", label: "FP16", note: "Default" },
  { id: "q8_0", label: "Q8_0", note: "-45% KV" },
  { id: "q4_0", label: "Q4_0", note: "-70% KV" },
];

const PLACEHOLDER = `Paste dxdiag, nvidia-smi, About This Mac, or inxi output:

GPU: NVIDIA GeForce RTX 5080
VRAM: 16 GB GDDR7
System RAM: 32 GB DDR5
CPU: AMD Ryzen 7 9800X3D`;

const EXAMPLE_PRESET_ID = "rtx-5080";
const EXAMPLE_RAW = `GPU: NVIDIA GeForce RTX 5080 16GB
VRAM: 16 GB
RAM: 32 GB
CPU: AMD Ryzen 7 9800X3D
OS: Windows 11`;

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}

const PRESET_GROUPS = [
  {
    title: "NVIDIA Blackwell & Ada",
    ids: ["rtx-4070", "rtx-5080", "rtx-4090", "rtx-5090", "dual-rtx-3090", "rtx-pro-6000"],
  },
  {
    title: "Apple Silicon & Strix Halo Unified",
    ids: ["m4-16", "m4-pro-24", "m4-max-64", "strix-halo-128", "studio-128", "m3-ultra-512"],
  },
  {
    title: "AMD Radeon & Entry / CPU",
    ids: ["rx-9070-xt", "rtx-3060", "8gb-laptop", "cpu-32"],
  },
];

export function SpecBench() {
  const [inputMode, setInputMode] = useState<"paste" | "builder" | "screenshot">("paste");
  const [text, setText] = useState("");
  const [task, setTask] = useState<ModelTask | "any">("any");
  const [contextK, setContextK] = useState<number>(8);
  const [kvQuant, setKvQuant] = useState<KvQuant>("fp16");
  const [batchSize, setBatchSize] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Hardware Builder State
  const [builderPresetId, setBuilderPresetId] = useState("rtx-5080");
  const [builderVram, setBuilderVram] = useState(16);
  const [builderRam, setBuilderRam] = useState(32);
  const [builderGpuCount, setBuilderGpuCount] = useState(1);
  const [builderUnified, setBuilderUnified] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [shotName, setShotName] = useState<string | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [activeSummary, setActiveSummary] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Specs[]>([]);

  useEffect(() => {
    try {
      setHistory(loadHistory());
      const onHist = () => setHistory(loadHistory());
      window.addEventListener("whatcanirun:history", onHist);
      const saved = localStorage.getItem("whatcanirun_last_specs");
      if (saved) {
        const specs = JSON.parse(saved) as Specs;
        if (specs && typeof specs.vramGb === "number") {
          void matchHardware({
            data: { presetSpecs: specs, contextK: 8, kvQuant: "fp16" },
          })
            .then((res) => {
              if (!("error" in res)) setResult(res);
            })
            .catch(() => {
              /* ignore initial cache load error */
            });
        }
      }
      return () => window.removeEventListener("whatcanirun:history", onHist);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (result && !busy) {
      try {
        localStorage.setItem("whatcanirun_last_specs", JSON.stringify(result.specs));
        pushHistory(result.specs);
        setHistory(loadHistory());
      } catch {
        /* ignore */
      }
    }
  }, [result, busy]);

  async function run(opts?: {
    preset?: Specs;
    image?: string;
    ctx?: number;
    kv?: KvQuant;
    batch?: number;
    preferTask?: ModelTask | "any";
    skipScroll?: boolean;
  }) {
    setBusy(true);
    setError(null);
    const activeCtx = opts?.ctx ?? contextK;
    const activeKv = opts?.kv ?? kvQuant;
    const activeBatch = opts?.batch ?? batchSize;
    const activeTask = opts?.preferTask ?? task;

    const summary = opts?.preset?.gpu
      ? `${opts.preset.gpu} (${opts.preset.vramGb} GB VRAM / ${opts.preset.ramGb} GB RAM)`
      : shotName
        ? `Screenshot: ${shotName}`
        : text.trim()
          ? text.trim().slice(0, 72)
          : "Custom hardware specification";
    setActiveSummary(summary);

    try {
      const [res] = await Promise.all([
        matchHardware({
          data: {
            text: opts?.preset ? undefined : text,
            imageDataUrl: opts?.image ?? shotUrl ?? undefined,
            prefer: activeTask === "any" ? undefined : activeTask,
            presetSpecs: opts?.preset,
            contextK: activeCtx,
            kvQuant: activeKv,
            batchSize: activeBatch,
          },
        }),
        new Promise((resolve) => setTimeout(resolve, 260)),
      ]);

      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
        bumpStreak();
        if (!opts?.skipScroll) {
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 80);
        }
      }
    } catch {
      setError("Could not compute compatibility. Paste GPU + RAM specs or pick a hardware preset.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAutoDetect() {
    setDetecting(true);
    setError(null);
    try {
      const detected = await detectSystemHardware();
      if (!detected) {
        setError("Browser WebGPU/WebGL detection unavailable on this device.");
        return;
      }
      setText(detected.specs.raw || detected.summary);
      await run({ preset: detected.specs, ctx: contextK, kv: kvQuant });
    } catch {
      setError("Automatic hardware detection was blocked by browser settings.");
    } finally {
      setDetecting(false);
    }
  }

  function handleApplyBuilder() {
    const basePreset = PRESETS.find((p) => p.id === builderPresetId);
    const baseGpu = basePreset?.specs.gpu ?? "Custom Accelerator";
    const gpuName =
      builderGpuCount > 1 && !builderUnified ? `${builderGpuCount}x ${baseGpu}` : baseGpu;

    const customSpecs: Specs = {
      gpu: gpuName,
      vramGb: builderUnified ? builderRam : builderVram,
      ramGb: builderRam,
      cpu: basePreset?.specs.cpu ?? "Custom CPU",
      os: builderUnified && baseGpu.includes("Apple") ? "macOS" : "Linux / Windows",
      unified: builderUnified,
      gpuCount: builderUnified ? 1 : builderGpuCount,
      source: "preset",
      raw: `Configured: ${gpuName} | ${builderUnified ? `${builderRam}GB Unified` : `${builderGpuCount}x ${builderVram}GB VRAM`} | ${builderRam}GB RAM`,
    };
    void run({ preset: customSpecs, ctx: contextK, kv: kvQuant });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG, JPG, or WebP screenshot.");
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setShotUrl(url);
      setShotName(file.name);
      await run({ image: url, ctx: contextK, kv: kvQuant });
    } catch {
      setError("Could not read image file.");
    }
  }

  return (
    <div>
      {/* Editorial Hero + Dual-Column Workbench */}
      <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-medium text-primary">Local Inference Sizing Engine</span>
            <span>·</span>
            <span>49 Open-Weight Models</span>
            <StreakBadge />
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            Know what runs locally before you download 40 GB.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Compute exact weights, FlashAttention KV cache footprints, prefill latency, and tokens/sec across NVIDIA Blackwell/Ada, Apple Silicon, AMD Strix Halo, and CPU-only laptops.
          </p>

          {/* Hardware Input Workbench Card */}
          <div className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
            {/* Input Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-bg p-0.5">
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={cn(
                    "inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    inputMode === "paste" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span>Paste Specs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("builder")}
                  className={cn(
                    "inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    inputMode === "builder" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <Sliders className="h-3.5 w-3.5 shrink-0" />
                  <span>GPU Builder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("screenshot")}
                  className={cn(
                    "inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    inputMode === "screenshot" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Screenshot</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={detecting || busy}
                  onClick={handleAutoDetect}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-primary/60 disabled:opacity-50"
                >
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span>{detecting ? "Detecting…" : "Auto-detect GPU"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const preset = PRESETS.find((p) => p.id === EXAMPLE_PRESET_ID)?.specs;
                    if (preset) {
                      setText(EXAMPLE_RAW);
                      setInputMode("paste");
                      void run({ preset: { ...preset, source: "preset", raw: EXAMPLE_RAW } });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Try RTX 5080</span>
                </button>
              </div>
            </div>

            {inputMode === "paste" ? (
              <div className="mt-4">
                <label className="block">
                  <span className="sr-only">Hardware specifications</span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (!busy) void run();
                      }
                    }}
                    rows={5}
                    placeholder={PLACEHOLDER}
                    aria-label="Hardware specifications"
                    className="min-h-[132px] w-full resize-y rounded-lg border border-line bg-bg px-3.5 py-3 font-mono text-xs leading-relaxed text-fg placeholder:text-dim focus:border-primary focus:outline-none"
                  />
                </label>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-2xs text-dim">
                  <span>Accepts Windows dxdiag, Task Manager, About This Mac, nvidia-smi, or plain text</span>
                  <span className="hidden sm:inline font-mono">Cmd/Ctrl + Enter to match</span>
                </div>
              </div>
            ) : null}

            {inputMode === "builder" ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted">Base Accelerator Architecture</span>
                    <select
                      value={builderPresetId}
                      onChange={(e) => {
                        const p = PRESETS.find((x) => x.id === e.target.value);
                        setBuilderPresetId(e.target.value);
                        if (p) {
                          setBuilderVram(p.specs.vramGb || 8);
                          setBuilderRam(p.specs.ramGb);
                          setBuilderUnified(p.specs.unified);
                          setBuilderGpuCount(Math.max(1, p.specs.gpuCount || 1));
                        }
                      }}
                      className="mt-1.5 h-10 w-full rounded-lg border border-line bg-bg px-3 text-xs text-fg focus:border-primary focus:outline-none"
                    >
                      {PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} ({p.hint})
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <span className="text-xs text-muted">Accelerator Count</span>
                    <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {[1, 2, 4, 8].map((count) => (
                        <button
                          key={count}
                          type="button"
                          disabled={builderUnified}
                          onClick={() => setBuilderGpuCount(count)}
                          className={cn(
                            "h-10 rounded-lg border font-mono text-xs transition-colors",
                            builderUnified
                              ? "border-line bg-bg/40 text-dim/40 cursor-not-allowed"
                              : builderGpuCount === count
                                ? "border-primary bg-primary/15 text-fg font-medium"
                                : "border-line bg-bg text-muted hover:text-fg",
                          )}
                        >
                          {count}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">
                        {builderUnified ? "Unified Memory" : "VRAM per GPU"}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-fg">
                        {builderUnified ? builderRam : builderVram} GB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={192}
                      step={4}
                      disabled={builderUnified}
                      value={builderVram}
                      onChange={(e) => setBuilderVram(Number(e.target.value))}
                      className="mt-2.5 w-full accent-primary"
                    />
                  </div>
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">System RAM</span>
                      <span className="font-mono font-semibold tabular-nums text-fg">
                        {builderRam} GB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={512}
                      step={8}
                      value={builderRam}
                      onChange={(e) => setBuilderRam(Number(e.target.value))}
                      className="mt-2.5 w-full accent-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderUnified}
                      onChange={(e) => setBuilderUnified(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>Unified memory architecture (Apple Silicon / AMD Strix Halo / GB10)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyBuilder}
                    className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-invert-fg transition-opacity hover:opacity-90"
                  >
                    Simulate {builderUnified ? `${builderRam} GB Unified` : `${builderGpuCount}x ${builderVram} GB`}
                  </button>
                </div>
              </div>
            ) : null}

            {inputMode === "screenshot" ? (
              <div className="mt-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                  }}
                  className="flex min-h-[132px] flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-bg p-6 text-center transition-colors hover:border-primary/60"
                >
                  <ImageIcon className="h-6 w-6 text-muted" />
                  <p className="mt-2 text-xs font-medium text-fg">
                    {shotName ? `Selected: ${shotName}` : "Click to upload Task Manager, GPU-Z, or About This Mac screenshot"}
                  </p>
                  <p className="mt-1 text-2xs text-dim">
                    Vision parser extracts GPU, dedicated VRAM, and host RAM automatically
                  </p>
                </div>
                {shotName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShotName(null);
                      setShotUrl(null);
                    }}
                    className="mt-2 text-xs text-muted underline underline-offset-4 hover:text-fg"
                  >
                    Clear selected image
                  </button>
                ) : null}
              </div>
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />

            {/* Workload, Context & KV Quantization Bar */}
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {TASKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTask(t.id);
                        if (result) {
                          void run({
                            preset: result.specs,
                            preferTask: t.id,
                            skipScroll: true,
                          });
                        }
                      }}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs transition-colors",
                        task === t.id
                          ? "border-primary/70 bg-primary/15 font-medium text-fg"
                          : "border-line bg-bg text-muted hover:text-fg",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 rounded-lg border border-line bg-bg p-0.5 text-xs">
                    <span className="px-2 text-2xs text-dim">Context</span>
                    {CONTEXT_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setContextK(c.id);
                          if (result) {
                            void run({ preset: result.specs, ctx: c.id, skipScroll: true });
                          }
                        }}
                        className={cn(
                          "rounded-md px-2 py-1 font-mono text-2xs transition-colors",
                          contextK === c.id ? "bg-elevated font-medium text-fg" : "text-muted hover:text-fg",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 rounded-lg border border-line bg-bg p-0.5 text-xs">
                    <span className="px-2 text-2xs text-dim">KV Cache</span>
                    {KV_OPTIONS.map((kv) => (
                      <button
                        key={kv.id}
                        type="button"
                        title={kv.note}
                        onClick={() => {
                          setKvQuant(kv.id);
                          if (result) {
                            void run({ preset: result.specs, kv: kv.id, skipScroll: true });
                          }
                        }}
                        className={cn(
                          "rounded-md px-2 py-1 font-mono text-2xs transition-colors",
                          kvQuant === kv.id ? "bg-elevated font-medium text-primary" : "text-muted hover:text-fg",
                        )}
                      >
                        {kv.label}
                      </button>
                    ))}
                  </div>
                </div>

                {inputMode !== "builder" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run()}
                    className="h-10 rounded-lg bg-fg px-5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Analyzing Rig…" : "Analyze Compatibility"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div
              className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs"
              role="alert"
              aria-live="polite"
            >
              <div className="font-medium text-fg">{error}</div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {PRESETS.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      void run({ preset: { ...p.specs, source: "preset", raw: p.label } })
                    }
                    className="rounded-md border border-line bg-bg px-2.5 py-1 text-2xs text-muted hover:text-fg"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Quick Hardware Presets & Recent Rigs */}
        <aside className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-display text-sm font-semibold text-fg">Reference Hardware Presets</h2>
            <span className="font-mono text-2xs text-dim">1-Click Benchmark</span>
          </div>

          <div className="mt-4 space-y-4">
            {PRESET_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-2xs font-medium text-dim">{group.title}</div>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {group.ids.map((id) => {
                    const p = PRESETS.find((x) => x.id === id);
                    if (!p) return null;
                    const isActive = result?.specs.gpu === p.specs.gpu && result?.specs.ramGb === p.specs.ramGb;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          void run({ preset: { ...p.specs, source: "preset" }, ctx: contextK, kv: kvQuant })
                        }
                        className={cn(
                          "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          isActive
                            ? "border-primary/70 bg-primary/10 text-fg"
                            : "border-line bg-bg text-muted hover:border-line-strong hover:text-fg",
                        )}
                      >
                        <span className="font-medium text-fg leading-snug">{p.label}</span>
                        <span className="font-mono text-2xs text-dim leading-snug">{p.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {history.length > 0 ? (
            <div className="mt-5 border-t border-line pt-4">
              <div className="text-2xs font-medium text-dim">Recent Local Checks</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <button
                    key={`${h.gpu}-${h.vramGb}-${i}`}
                    type="button"
                    onClick={() => void run({ preset: { ...h, source: "preset" } })}
                    className="rounded-md border border-line bg-bg px-2.5 py-1 font-mono text-2xs text-muted hover:text-fg"
                  >
                    {h.gpuCount > 1 && !h.unified ? `${h.gpuCount}x ` : ""}
                    {h.gpu} · {h.unified ? `${h.ramGb}GB` : `${h.vramGb}GB`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Results & Diagnostics Area */}
      {busy ? (
        <div aria-live="polite" aria-busy="true">
          <TerminalProcessing specsSummary={activeSummary} contextK={contextK} />
        </div>
      ) : result ? (
        <div className="enter-up mt-10" ref={resultRef}>
          <MatchResults
            result={result}
            onContextChange={(ctx) => {
              setContextK(ctx);
              void run({ preset: result.specs, ctx, skipScroll: true });
            }}
            onBatchChange={(batch) => {
              setBatchSize(batch);
              void run({ preset: result.specs, batch, skipScroll: true });
            }}
            onSelectRig={(targetSpecs) => {
              void run({ preset: targetSpecs, ctx: contextK, kv: kvQuant, batch: batchSize });
            }}
          />
          <WatcherCTA specs={result.specs} />
        </div>
      ) : null}

      <OomFixer />

      {/* Popular Checks Grid */}
      <section className="mt-10 rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-medium text-primary">Popular Hardware Benchmarks</div>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-fg">
              Instant compatibility guides by GPU tier
            </h2>
          </div>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_CHECKS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className="group flex items-center justify-between rounded-lg border border-line bg-bg px-3.5 py-3 transition-colors hover:border-line-strong"
            >
              <div>
                <div className="text-xs font-medium text-fg group-hover:text-primary transition-colors">
                  {c.label}
                </div>
                <div className="mt-0.5 text-2xs text-dim">{c.note}</div>
              </div>
              <span className="font-mono text-xs text-dim group-hover:text-fg">→</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function WatcherCTA({ specs }: { specs: Specs }) {
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const vramTier = specs.unified ? specs.ramGb : specs.vramGb * Math.max(1, specs.gpuCount || 1);

  async function submit() {
    if (!contact.trim()) {
      setStatus("Enter an email address or Discord webhook URL.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await createWatcher({
        data: {
          rig: {
            gpu: specs.gpu,
            vramGb: specs.vramGb,
            ramGb: specs.ramGb,
            unified: specs.unified,
            gpuCount: specs.gpuCount,
          },
          contact: contact.trim(),
        },
      });
      if (res && (res as { ok: boolean }).ok) {
        setDone(true);
        setStatus(
          (res as { already?: boolean }).already
            ? "Already subscribed for this hardware tier."
            : "Alert active. We will notify you when new GGUF weights fit your rig.",
        );
      } else {
        setStatus((res as { error?: string })?.error || "Could not save alert — try again.");
      }
    } catch {
      setStatus("Could not save alert — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success">
        <Check className="h-4 w-4 shrink-0" />
        <span>{status}</span>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-end">
      <div className="flex-1">
        <div className="text-xs font-medium text-fg">
          Model Drop Alerts for ≤ {vramTier} GB Memory
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Receive a ping when new open-weight releases or GGUF quantizations fit your hardware tier.
        </p>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@domain.com or https://discord.com/api/webhooks/..."
          className="mt-2.5 h-10 w-full rounded-lg border border-line bg-bg px-3 font-mono text-xs text-fg placeholder:text-dim focus:border-primary focus:outline-none"
        />
        {status ? <div className="mt-2 text-xs text-primary">{status}</div> : null}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="h-10 shrink-0 rounded-lg bg-fg px-4 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Notify Me"}
      </button>
    </div>
  );
}
