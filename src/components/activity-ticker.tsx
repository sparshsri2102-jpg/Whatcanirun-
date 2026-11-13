import { useEffect, useState } from "react";
import type { Specs } from "@/lib/models/types";

export function SimilarRigsStrip({ specs }: { specs: Specs }) {
  const vram = specs.unified ? specs.ramGb : specs.vramGb * Math.max(1, specs.gpuCount || 1);
  let suggestion: Array<{ model: string; note: string }> = [];
  if (vram <= 8) {
    suggestion = [
      { model: "Gemma 3n E4B (Q4)", note: "Multimodal MatFormer · ~4.6 GB" },
      { model: "Qwen3 8B (Q4)", note: "Daily reasoning driver · ~5.2 GB" },
      { model: "Phi-4 Mini (Q8)", note: "Near-lossless CPU/iGPU · ~4.2 GB" },
    ];
  } else if (vram <= 16) {
    suggestion = [
      { model: "Qwen3 14B (Q4)", note: "12–16 GB reasoning sweet spot · 9 GB" },
      { model: "gpt-oss-20b (Q4)", note: "OpenAI 3.6B-active MoE · 13 GB" },
      { model: "Mistral Small 3.2 (Q4)", note: "24B Apache-2.0 vision · 14 GB" },
    ];
  } else if (vram <= 32) {
    suggestion = [
      { model: "Qwen3-Coder 30B-A3B", note: "3B active MoE · 100+ tok/s" },
      { model: "Qwen3.8 27B (Q4)", note: "Vision + 256k all-rounder · 17 GB" },
      { model: "DeepSeek-R1 32B (Q4)", note: "Deep STEM & coding traces · 20 GB" },
    ];
  } else {
    suggestion = [
      { model: "gpt-oss-120b (Q4)", note: "5.1B active MoE · ~65 GB" },
      { model: "Qwen3 235B-A22B (IQ2)", note: "Apache-2.0 frontier MoE · 74 GB" },
      { model: "DeepSeek-V4 Flash (IQ2)", note: "284B total · 13B active · 76 GB" },
    ];
  }

  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-5">
      <div className="text-xs font-medium text-muted">Popular on comparable hardware (±4 GB tier)</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {suggestion.map((s) => (
          <div key={s.model} className="rounded-lg border border-line bg-bg px-3.5 py-2.5">
            <div className="text-xs font-medium text-fg">{s.model}</div>
            <div className="mt-0.5 text-2xs text-dim">{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("whatcanirun_streak");
      const data = raw ? (JSON.parse(raw) as { count: number; last: string }) : { count: 0, last: "" };
      setStreak(data.count || 0);
    } catch {
      setStreak(0);
    }
    const handler = () => {
      try {
        const raw = localStorage.getItem("whatcanirun_streak");
        const data = raw ? (JSON.parse(raw) as { count: number }) : { count: 0 };
        setStreak(data.count || 0);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("whatcanirun:streak", handler);
    return () => window.removeEventListener("whatcanirun:streak", handler);
  }, []);
  if (streak < 2) return null;
  return (
    <span className="font-mono text-2xs text-primary">
      · {streak} checks logged
    </span>
  );
}

export function bumpStreak() {
  try {
    const raw = localStorage.getItem("whatcanirun_streak");
    const data = raw ? (JSON.parse(raw) as { count: number; last: string }) : { count: 0, last: "" };
    const today = new Date().toISOString().slice(0, 10);
    let next = data.count || 0;
    if (data.last !== today) next = next + 1;
    localStorage.setItem("whatcanirun_streak", JSON.stringify({ count: next, last: today }));
    window.dispatchEvent(new Event("whatcanirun:streak"));
  } catch {
    /* ignore */
  }
}
