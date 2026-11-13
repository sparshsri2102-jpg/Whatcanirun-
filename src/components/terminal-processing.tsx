import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface TerminalProcessingProps {
  specsSummary?: string;
  contextK?: number;
}

const STEPS = [
  "Parsing hardware topology and accelerator pool",
  "Resolving memory bandwidth and tensor split buffers",
  "Calculating FlashAttention KV cache allocation",
  "Evaluating quantization profiles across 49 open-weight models",
  "Ranking GPU-native fits and generating runner commands",
];

export function TerminalProcessing({ specsSummary, contextK = 8 }: TerminalProcessingProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 130);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-fg">Evaluating Hardware Compatibility</span>
        </div>
        <span className="font-mono text-xs text-muted">Context: {contextK}k</span>
      </div>

      {specsSummary ? (
        <div className="mt-3 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-muted">
          Target: <span className="text-fg">{specsSummary}</span>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {STEPS.slice(0, stepIndex + 1).map((step, idx) => {
          const isLatest = idx === stepIndex;
          return (
            <div key={step} className="flex items-center gap-2.5 text-xs">
              {isLatest ? (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ) : (
                <Check className="h-3.5 w-3.5 text-success" />
              )}
              <span className={isLatest ? "text-fg font-medium" : "text-muted"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
