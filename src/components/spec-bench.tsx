import { useEffect, useRef, useState } from "react";
import { PRESETS } from "@/lib/models/catalog";
import { matchHardware } from "@/lib/server/match";
import type { MatchResult, ModelTask, Specs } from "@/lib/models/types";
import { MatchResults } from "./match-results";
import { detectSystemHardware } from "@/lib/models/detect-hardware";
import { cn } from "@/lib/utils";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load last active specs on mount if present
  useEffect(() => {
    try {
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
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (result && !busy) {
      try {
        localStorage.setItem("whatcanirun_last_specs", JSON.stringify(result.specs));
      } catch {
        /* ignore */
      }
    }
  }, [result, busy]);

  async function run(opts?: { preset?: Specs; image?: string; ctx?: number; skipScroll?: boolean }) {
    setBusy(true);
    setError(null);
    const activeCtx = opts?.ctx ?? contextK;
    try {
      const res = await matchHardware({
        data: {
          text: opts?.preset ? undefined : text,
          imageDataUrl: opts?.image ?? shotUrl ?? undefined,
          prefer: task === "any" ? undefined : task,
          presetSpecs: opts?.preset,
          contextK: activeCtx,
        },
      });
      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
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

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-2xs uppercase tracking-[0.28em] text-muted">step 1 · hardware</p>
          <h1 className="mt-3 text-2xl leading-tight sm:text-3xl">
            paste your specs.
            <br />
            get the models that fit.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            No signup. Auto-detect your rig via WebGPU, copy dxdiag/neofetch, or drop a screenshot. We compute VRAM and KV cache headroom to rank open-weight models you can actually run.
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

      <label className="mt-6 block">
        <span className="sr-only">Hardware specifications</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={PLACEHOLDER}
          className="min-h-44 w-full resize-y border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-fg placeholder:text-dim focus:border-fg focus:outline-none"
        />
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

      {error ? <p className="mt-4 text-sm text-fg">{error}</p> : null}

      {result ? (
        <div className="enter-up mt-10" ref={resultRef}>
          <MatchResults
            result={result}
            onContextChange={(ctx) => {
              setContextK(ctx);
              run({ preset: result.specs, ctx, skipScroll: true });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

