import { useEffect, useRef, useState } from "react";
import { PRESETS } from "@/lib/models/catalog";
import { matchHardware } from "@/lib/server/match";
import type { MatchResult, ModelTask, Specs } from "@/lib/models/types";
import { MatchResults } from "./match-results";
import { TerminalProcessing } from "./terminal-processing";
import { detectSystemHardware } from "@/lib/models/detect-hardware";
import { createWatcher } from "@/lib/server/watchers";
import { bumpStreak, StreakBadge } from "./activity-ticker";
import { OomFixer } from "./oom-fixer";
import { cn } from "@/lib/utils";

const POPULAR_CHECKS: Array<{ label: string; href: string; note: string }> = [
  { label: "RTX 4060 8GB → Qwen3 8B", href: "/can/qwen3-8b-on-rtx-3060", note: "most-asked 8GB" },
  { label: "RTX 4090 24GB → 27B all-rounder", href: "/can/qwen3.8-27b-on-rtx-4090", note: "24GB sweet spot" },
  { label: "RTX 4070 12GB → Gemma 3 12B", href: "/can/gemma3-12b-on-rtx-4070", note: "12GB vision" },
  { label: "Mac M4 16GB → Phi-4 Mini", href: "/can/phi-4-mini-on-m4-16", note: "unified" },
  { label: "8GB laptop → CPU picks", href: "/can/qwen3-8b-on-8gb-laptop", note: "no GPU?" },
  { label: "70B on dual 3090?", href: "/can/llama-3.3-70b-on-dual-rtx-3090", note: "48GB stacking" },
];

function loadHistory(): Specs[] {
  try {
    const raw = localStorage.getItem("whatcanirun_history");
    const arr = raw ? (JSON.parse(raw) as Specs[]) : [];
    return Array.isArray(arr) ? arr.filter((s) => s && typeof s.vramGb === "number").slice(0, 5) : [];
  } catch { return []; }
}
function pushHistory(specs: Specs) {
  try {
    const prev = loadHistory().filter((s) => s.gpu !== specs.gpu || s.vramGb !== specs.vramGb || s.ramGb !== specs.ramGb);
    localStorage.setItem("whatcanirun_history", JSON.stringify([specs, ...prev].slice(0, 5)));
    window.dispatchEvent(new Event("whatcanirun:history"));
  } catch { /* ignore */ }
}

const TASKS: Array<{ id: ModelTask | "any"; label: string }> = [
  { id: "any", label: "anything" },
  { id: "chat", label: "chat" },
  { id: "code", label: "code" },
  { id: "reason", label: "reason" },
  { id: "vision", label: "vision" },
  { id: "image", label: "image" },
  { id: "agent", label: "agent" },
];

const CONTEXT_OPTIONS = [
  { id: 4, label: "4k ctx" },
  { id: 8, label: "8k ctx" },
  { id: 32, label: "32k ctx" },
  { id: 128, label: "128k ctx" },
];

const PLACEHOLDER = `paste anything:

GPU: NVIDIA GeForce RTX 4070
Dedicated video memory: 12.0 GB
Installed physical memory: 32.0 GB
Processor: AMD Ryzen 7 5800X

or a screenshot of Task Manager / About This Mac / neofetch`;

const EXAMPLE_PRESET_ID = "rtx-4070";
const EXAMPLE_RAW = `GPU: NVIDIA GeForce RTX 4070 12GB
VRAM: 12 GB
RAM: 32 GB
CPU: AMD Ryzen 7 5800X
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

export function SpecBench() {
  const [text, setText] = useState("");
  const [task, setTask] = useState<ModelTask | "any">("any");
  const [contextK, setContextK] = useState<number>(8);
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showTuner, setShowTuner] = useState(false);
  const [tunerVram, setTunerVram] = useState(16);
  const [tunerRam, setTunerRam] = useState(32);
  const [tunerGpuCount, setTunerGpuCount] = useState(1);
  const [tunerUnified, setTunerUnified] = useState(false);
  const [tunerGpu] = useState("Custom Rig");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [shotName, setShotName] = useState<string | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [activeSummary, setActiveSummary] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Specs[]>([]);

  // Load last active specs on mount if present
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
            data: {
              presetSpecs: specs,
              contextK: 8,
            },
          }).then((res) => {
            if ("error" in res) {
              setError(res.error);
            } else {
              setResult(res);
            }
          }).catch(() => {
            /* ignore initial load error */
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

  async function run(opts?: { preset?: Specs; image?: string; ctx?: number; skipScroll?: boolean }) {
    setBusy(true);
    setError(null);
    const activeCtx = opts?.ctx ?? contextK;
    const summary = opts?.preset?.gpu 
      ? `${opts.preset.gpu} (${opts.preset.vramGb} GB VRAM / ${opts.preset.ramGb} GB RAM)` 
      : shotName 
        ? `Screenshot: ${shotName}` 
        : text.trim() 
          ? text.trim().slice(0, 80) 
          : "System hardware telemetry buffer";
    setActiveSummary(summary);

    try {
      const [res] = await Promise.all([
        matchHardware({
          data: {
            text: opts?.preset ? undefined : text,
            imageDataUrl: opts?.image ?? shotUrl ?? undefined,
            prefer: task === "any" ? undefined : task,
            presetSpecs: opts?.preset,
            contextK: activeCtx,
          },
        }),
        new Promise((resolve) => setTimeout(resolve, 600)),
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
          }, 100);
        }
      }
    } catch {
      setError("Match failed. Try a shorter paste, or pick a preset rig.");
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
        setError("Browser WebGPU/WebGL detection unavailable.");
        return;
      }
      setText(detected.specs.raw || detected.summary);
      await run({ preset: detected.specs, ctx: contextK });
    } catch {
      setError("Could not automatically detect hardware.");
    } finally {
      setDetecting(false);
    }
  }

  function handleApplyTuner() {
    const isMulti = tunerGpuCount > 1 && !tunerUnified;
    const gpuName = tunerUnified
      ? `Apple Silicon / APU (${tunerRam}GB Unified)`
      : isMulti
        ? `${tunerGpuCount}x Custom GPU (${tunerVram * tunerGpuCount}GB Total VRAM)`
        : `${tunerGpu} (${tunerVram}GB VRAM)`;

    const customSpecs: Specs = {
      gpu: gpuName,
      vramGb: tunerUnified ? tunerRam : tunerVram,
      ramGb: tunerRam,
      cpu: "Custom CPU",
      os: tunerUnified ? "macOS" : "Windows / Linux",
      unified: tunerUnified,
      gpuCount: tunerUnified ? 1 : tunerGpuCount,
      source: "preset",
      raw: `Tuned: ${tunerUnified ? `${tunerRam}GB Unified` : `${tunerGpuCount}x ${tunerVram}GB VRAM (${tunerGpuCount * tunerVram}GB Total) / ${tunerRam}GB RAM`}`,
    };
    run({ preset: customSpecs, ctx: contextK });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That is not an image.");
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setShotUrl(url);
      setShotName(file.name);
      await run({ image: url, ctx: contextK });
    } catch {
      setError("Could not read that screenshot.");
    }
  }

  const [tamTab, setTamTab] = useState<'laptop'|'private'|'free'>('laptop');

  return (
    <div>
      {/* TAM hero tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-4 mb-6">
        {[
          { id: 'laptop' as const, label: 'Can my laptop run it?', desc: '8GB? We find a CPU fit' },
          { id: 'private' as const, label: 'Private · Offline', desc: 'No cloud bill' },
          { id: 'free' as const, label: 'Free forever', desc: 'Open weights only' },
        ].map(t=> (
          <button key={t.id} type="button" onClick={()=> setTamTab(t.id)} className={cn("border px-3 py-2 text-left flex-1 min-w-[140px]", tamTab===t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg")}>
            <div className="text-xs uppercase tracking-widest">{t.label}</div>
            <div className={cn("text-2xs", tamTab===t.id ? "text-bg/70" : "text-dim")}>{t.desc}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-2xs uppercase tracking-[0.28em] text-muted">step 1 · hardware {tamTab==='laptop' ? '· laptop first' : tamTab==='private' ? '· stays on device' : '· no paywall'}</p>
            <StreakBadge />
          </div>
          <h1 className="mt-3 text-2xl leading-tight sm:text-3xl">
            {tamTab==='laptop' ? 'your laptop can run an LLM.' : tamTab==='private' ? 'your data stays on device.' : 'paste your specs.'}
            <br />
            {tamTab==='laptop' ? 'we prove it.' : tamTab==='private' ? 'find the private fit.' : 'get the models that fit.'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {tamTab==='laptop' ? '8GB iGPU? 16GB MacBook? We rank open-weight models by CPU offload + VRAM — most laptops run a 7B at 8 t/s with no GPU.' : tamTab==='private' ? 'No signup. No cloud. We compute VRAM + KV headroom locally to find offline models that run 100% on your hardware.' : 'No signup. Auto-detect your rig via WebGPU, copy dxdiag/neofetch, or drop a screenshot. We compute VRAM and KV cache headroom to rank open-weight models you can actually run.'}
          </p>
        </div>
        <div className="text-xs leading-relaxed text-muted lg:pt-8">
          <div className="border border-line p-4">
            <div className="text-2xs uppercase tracking-widest text-fg">how to copy specs</div>
            <ul className="mt-3 space-y-2">
              <li>Windows — Win+R, type dxdiag, copy the text. Or screenshot Task Manager → Performance.</li>
              <li>macOS — Apple menu → About This Mac. Screenshot is enough.</li>
              <li>Linux — neofetch or inxi -F. Paste the lot.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preset bar + Auto-Detect */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={detecting || busy}
          onClick={handleAutoDetect}
          className="min-h-11 border border-fg bg-surface px-3 py-2 text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg disabled:opacity-50"
        >
          {detecting ? "detecting rig…" : "⚡ auto-detect my rig"}
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => run({ preset: { ...p.specs, source: "preset" }, ctx: contextK })}
            className="min-h-11 border border-line px-3 py-2 text-xs text-muted hover:border-fg hover:text-fg"
          >
            {p.label}
            <span className="ml-2 text-dim"> {p.hint}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowTuner(!showTuner)}
          className={cn(
            "min-h-11 border px-3 py-2 text-xs uppercase tracking-widest",
            showTuner ? "border-fg text-fg bg-surface" : "border-line text-muted hover:border-fg hover:text-fg"
          )}
        >
          {showTuner ? "hide rig tuner" : "⚙ tune rig"}
        </button>
      </div>

      {/* Interactive Rig Tuner Drawer */}
      {showTuner ? (
        <div className="mt-4 border border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="text-2xs uppercase tracking-[0.28em] text-muted">rig tuner & multi-gpu what-if simulator</div>
            <div className="text-2xs font-mono text-dim">
              {tunerUnified
                ? `${tunerRam} GB Unified Pool`
                : `${tunerGpuCount}x GPU (${tunerVram * tunerGpuCount} GB Total VRAM)`}
            </div>
          </div>

          {/* Multi-GPU Count Selector */}
          {!tunerUnified ? (
            <div className="mt-3 flex items-center gap-2 border-b border-line pb-3">
              <span className="text-2xs uppercase tracking-widest text-dim">GPU Quantity:</span>
              {[1, 2, 4, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTunerGpuCount(count)}
                  className={cn(
                    "px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors",
                    tunerGpuCount === count
                      ? "border-fg bg-fg text-bg"
                      : "border-line text-muted hover:text-fg"
                  )}
                >
                  {count === 1 ? "1x Single" : count === 2 ? "2x Dual" : count === 4 ? "4x Quad" : "8x Cluster"}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-dim">{tunerUnified ? "Unified Memory" : "VRAM per GPU"}</span>
                <span className="font-mono text-fg">{tunerUnified ? tunerRam : tunerVram} GB</span>
              </div>
              <input
                type="range"
                min={4}
                max={128}
                step={2}
                disabled={tunerUnified}
                value={tunerVram}
                onChange={(e) => setTunerVram(Number(e.target.value))}
                className="mt-2 w-full accent-fg"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-dim">System RAM</span>
                <span className="font-mono text-fg">{tunerRam} GB</span>
              </div>
              <input
                type="range"
                min={8}
                max={256}
                step={8}
                value={tunerRam}
                onChange={(e) => setTunerRam(Number(e.target.value))}
                className="mt-2 w-full accent-fg"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={tunerUnified}
                  onChange={(e) => setTunerUnified(e.target.checked)}
                  className="accent-fg"
                />
                Unified Memory (Apple M / APU)
              </label>
              <button
                type="button"
                onClick={handleApplyTuner}
                className="mt-3 min-h-9 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg hover:opacity-90 font-mono"
              >
                apply {tunerUnified ? `${tunerRam}GB unified` : `${tunerGpuCount}x ${tunerVram}GB vram`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Repeat loop: last rigs, one click */}
      {history.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-line bg-surface px-3 py-2">
          <span className="text-2xs uppercase tracking-widest text-dim">your recent rigs:</span>
          {history.map((h, i) => (
            <button
              key={`${h.gpu}-${h.vramGb}-${i}`}
              type="button"
              onClick={() => run({ preset: { ...h, source: "preset" } })}
              className="border border-line bg-bg px-2.5 py-1 font-mono text-2xs text-muted hover:border-fg hover:text-fg"
              title={`${h.gpu} · ${h.vramGb}GB VRAM · ${h.ramGb}GB RAM`}
            >
              {h.gpuCount > 1 && !h.unified ? `${h.gpuCount}x ` : ""}{h.gpu} · {h.unified ? `${h.ramGb}U` : `${h.vramGb}GB`}
            </button>
          ))}
          <span className="text-2xs text-dim">saved on this device only</span>
        </div>
      ) : null}

      {/* Task & Context selector filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TASKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTask(t.id)}
              className={cn(
                "min-h-11 border px-3 py-2 text-xs uppercase tracking-widest",
                task === t.id
                  ? "border-fg bg-fg text-bg"
                  : "border-line text-muted hover:border-fg hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* KV Cache Context Length selector */}
        <div className="flex items-center gap-1.5 border border-line bg-surface p-1 text-xs">
          <span className="px-2 text-2xs uppercase tracking-widest text-dim">Context:</span>
          {CONTEXT_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setContextK(c.id);
                if (result) {
                  run({ preset: result.specs, ctx: c.id, skipScroll: true });
                }
              }}
              className={cn(
                "px-2.5 py-1 text-2xs uppercase tracking-wider",
                contextK === c.id ? "bg-fg text-bg" : "text-muted hover:text-fg"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* First-time demo: show value in 2s without paste */}
      {!result && !busy ? (
        <div className="mt-6 border border-primary/20 bg-primary/[0.06] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xs uppercase tracking-[0.24em] text-primary">new here? see it work in 2s</div>
              <p className="mt-2 text-sm leading-relaxed text-fg">Try an example — RTX 4070 12GB + 32GB RAM — no paste needed. See runnable models instantly.</p>
              <p className="mt-1 font-mono text-2xs text-muted">GPU: RTX 4070 12GB · RAM: 32GB · OS: Windows 11 · {EXAMPLE_RAW.split("\n").length} lines parsed in demo</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const preset = PRESETS.find((p) => p.id === EXAMPLE_PRESET_ID)?.specs;
                if (preset) {
                  setText(EXAMPLE_RAW);
                  run({ preset: { ...preset, source: "preset", raw: EXAMPLE_RAW } });
                }
              }}
              className="shrink-0 min-h-11 bg-fg px-5 text-sm uppercase tracking-widest text-bg hover:opacity-90 transition-opacity"
            >
              ▸ try example →
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-2xs">
            <span className="border border-line bg-bg px-2 py-1 text-muted">✓ no signup</span>
            <span className="border border-line bg-bg px-2 py-1 text-muted">✓ results in ~600ms</span>
            <span className="border border-line bg-bg px-2 py-1 text-muted">✓ or paste your own below</span>
          </div>
        </div>
      ) : null}

      <label className="mt-6 block">
        <span className="sr-only">Hardware specifications</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              if (!busy) run();
            }
          }}
          rows={7}
          placeholder={PLACEHOLDER}
          aria-label="Hardware specifications"
          className="min-h-[180px] sm:min-h-44 w-full resize-y border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-fg placeholder:text-dim focus:border-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-fg/20"
        />
        <div className="mt-2 flex items-center justify-between text-2xs text-dim">
          <span>paste dxdiag / neofetch / About This Mac text</span>
          <span className="hidden sm:inline font-mono">⌘+Enter to match</span>
        </div>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => run()}
          className="min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "matching…" : "match models"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-12 border border-line px-5 text-sm uppercase tracking-widest text-fg hover:bg-surface"
        >
          {shotName ? `screenshot · ${shotName}` : "drop a screenshot"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {shotName ? (
          <button
            type="button"
            className="text-xs text-muted underline underline-offset-4"
            onClick={() => {
              setShotName(null);
              setShotUrl(null);
            }}
          >
            clear image
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 border border-amber-900/30 bg-amber-950/10 p-4" role="alert" aria-live="polite">
          <div className="text-sm text-fg">{error}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted">Closest alternatives — try one click:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.slice(0,4).map(p=> (
              <button key={p.id} type="button" onClick={()=> run({ preset: { ...p.specs, source:"preset", raw: p.label } })} className="border border-line bg-bg px-3 py-1.5 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg">{p.label}</button>
            ))}
          </div>
        </div>
      ) : null}

      {busy ? (
        <div aria-live="polite" aria-busy="true">
          <TerminalProcessing specsSummary={activeSummary} contextK={contextK} />
          <div className="mt-6 grid gap-4">
            {[1,2,3].map(i=> (
              <div key={i} className="border border-line bg-surface p-4 sm:p-5 animate-pulse">
                <div className="h-3 w-20 bg-line" />
                <div className="mt-3 h-5 w-48 bg-line" />
                <div className="mt-3 h-3 w-full bg-line/60" />
                <div className="mt-2 h-3 w-5/6 bg-line/60" />
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="h-10 bg-bg border border-line" />
                  <div className="h-10 bg-bg border border-line" />
                  <div className="h-10 bg-bg border border-line" />
                  <div className="h-10 bg-bg border border-line" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : result ? (
        <div className="enter-up mt-10" ref={resultRef}>
          <MatchResults
            result={result}
            onContextChange={(ctx) => {
              setContextK(ctx);
              run({ preset: result.specs, ctx, skipScroll: true });
            }}
          />
          <WatcherCTA specs={result.specs} />
        </div>
      ) : null}

      <OomFixer />

      {/* Search-intent hub: popular checks (internal links for impressions) */}
      <div className="mt-10 border border-line bg-surface p-4 sm:p-5">
        <div className="text-2xs uppercase tracking-[0.24em] text-muted">popular checks · answered in 15s</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_CHECKS.map((c) => (
            <a key={c.href} href={c.href} className="group border border-line bg-bg px-3 py-2.5 hover:border-fg">
              <span className="block text-xs font-medium text-fg group-hover:underline">{c.label}</span>
              <span className="mt-0.5 block font-mono text-2xs text-dim">{c.note} →</span>
            </a>
          ))}
        </div>
      </div>

      {/* Beginner FAQ (SEO + bounce killer) */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="border border-line bg-bg p-4">
          <div className="text-xs font-semibold text-fg">Do I need a GPU?</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">No — but GPU = fast. CPU runs 3B models at 5–15 t/s (usable, not snappy). 8GB VRAM is the 2026 floor for 7B chat.</p>
        </div>
        <div className="border border-line bg-bg p-4">
          <div className="text-xs font-semibold text-fg">Why did my model OOM?</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">Almost always KV cache, not weights. Long context eats GBs. Use the OOM fixer above: unload, cap layers, cut to 2k ctx.</p>
        </div>
        <div className="border border-line bg-bg p-4">
          <div className="text-xs font-semibold text-fg">Q4 or Q8?</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">Start Q4_K_M. Bigger model at Q4 beats smaller at Q8. Go Q5/Q8 only if Q4 fits with 2GB+ to spare.</p>
        </div>
      </div>
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
    if (!contact.trim()) { setStatus("Enter email or Discord webhook URL"); return; }
    setBusy(true); setStatus(null);
    try {
      const res = await createWatcher({ data: { rig: { gpu: specs.gpu, vramGb: specs.vramGb, ramGb: specs.ramGb, unified: specs.unified, gpuCount: specs.gpuCount }, contact: contact.trim() } });
      if (res && (res as { ok: boolean }).ok) {
        setDone(true);
        setStatus((res as { already?: boolean }).already ? "Already watching this rig ✓" : "Watching — we'll alert when a new GGUF fits your rig");
      } else setStatus((res as { error?: string })?.error || "Failed — try again");
    } catch { setStatus("Failed — try again"); }
    finally { setBusy(false); }
  }
  if (done) return (
    <div className="mt-6 border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
      <span>✓</span> <span>{status}</span>
    </div>
  );
  return (
    <div className="mt-6 border border-line bg-surface p-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <div className="text-2xs uppercase tracking-[0.24em] text-muted">watch this rig · fits ≤ {vramTier}GB</div>
        <p className="mt-1 text-xs text-muted leading-relaxed">Get pinged when a new GGUF ≤ your rig drops. No account, one email/webhook, unsubscribe anytime.</p>
        <input
          value={contact}
          onChange={e=> setContact(e.target.value)}
          placeholder="email or https://discord.com/api/webhooks/..."
          className="mt-2 w-full min-h-10 border border-line bg-bg px-3 text-xs font-mono focus:border-fg focus:outline-none"
        />
        {status ? <div className="mt-2 text-xs font-mono text-dim">{status}</div> : null}
      </div>
      <button type="button" disabled={busy} onClick={submit} className="min-h-10 shrink-0 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg disabled:opacity-50 hover:opacity-90">
        {busy ? "saving…" : "notify me"}
      </button>
    </div>
  );
}

