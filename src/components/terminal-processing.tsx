import { useEffect, useState } from "react";

interface TerminalProcessingProps {
  specsSummary?: string;
  contextK?: number;
}

const STEPS = [
  "Initializing hardware diagnostic telemetry daemon...",
  "Querying GPU compute cores & memory bus topology...",
  "Profiling VRAM capacity & dedicated bandwidth (GB/s)...",
  "Computing FlashAttention-2 KV cache overhead for context window...",
  "Scanning catalog across 80+ open-weight LLMs & Vision models...",
  "Evaluating quantization matrix (Q4_K_M, Q5_K_M, Q8_0, FP16)...",
  "Synthesizing one-liner runner commands for Ollama & LM Studio...",
  "Hardware analysis complete. Finalizing model compatibility matrix...",
];

export function TerminalProcessing({ specsSummary, contextK = 8 }: TerminalProcessingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
      setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 16 + 10), 98));
    }, 180);

    return () => clearInterval(interval);
  }, []);

  const totalBars = 24;
  const filledBars = Math.round((progress / 100) * totalBars);
  const barString = "█".repeat(filledBars) + "░".repeat(Math.max(0, totalBars - filledBars));

  return (
    <div className="mt-8 border border-line bg-surface font-mono text-xs shadow-sm">
      {/* Terminal titlebar */}
      <div className="flex items-center justify-between border-b border-line bg-bg px-4 py-2 text-2xs uppercase tracking-widest text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-fg font-semibold">hardware_analysis_engine.sh</span>
        </div>
        <div className="flex items-center gap-3 text-dim">
          <span>ctx: {contextK}k</span>
          <span>pid: 4892</span>
        </div>
      </div>

      {/* Terminal stdout body */}
      <div className="p-4 sm:p-5 space-y-2">
        {specsSummary ? (
          <div className="text-dim border-b border-line/60 pb-2">
            <span className="text-fg font-bold">$ target_spec:</span> {specsSummary}
          </div>
        ) : null}

        <div className="space-y-1.5 pt-1">
          {STEPS.slice(0, stepIndex + 1).map((step, idx) => {
            const isLatest = idx === stepIndex;
            return (
              <div key={step} className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">
                  {isLatest ? "❯" : "✓"}
                </span>
                <span className={isLatest ? "text-fg" : "text-muted"}>
                  {step}
                </span>
                {isLatest ? (
                  <span className="inline-block h-3.5 w-1.5 bg-emerald-400 animate-ping ml-1" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* ASCII progress meter */}
        <div className="mt-4 pt-3 border-t border-line/60">
          <div className="flex justify-between text-2xs text-muted mb-1">
            <span>CALCULATING HEADROOM & TOK/S THROUGHPUT</span>
            <span className="text-fg font-bold">{progress}%</span>
          </div>
          <div className="text-2xs text-emerald-400/90 tracking-widest">
            [{barString}]
          </div>
        </div>
      </div>
    </div>
  );
}
