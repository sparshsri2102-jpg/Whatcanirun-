import { useMemo, useState } from "react";
import { Wrench, ChevronDown, ChevronUp, Check, Copy } from "lucide-react";

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
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
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-2xs text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {done ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      <span>{done ? "Copied" : label}</span>
    </button>
  );
}

export function OomFixer() {
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const diagnosis = useMemo(() => {
    const t = err.toLowerCase();
    if (!t.trim()) return null;
    const isCudaOom =
      (t.includes("cuda") && t.includes("out of memory")) ||
      t.includes("cublas_status_alloc_failed") ||
      t.includes("ggml_cuda");
    const isSysMem =
      t.includes("requires more system memory") ||
      t.includes("signal: killed") ||
      t.includes("oom killer");
    const isSlow =
      t.includes("slow") || t.includes("tokens/s") || t.includes("offload") || t.includes("cpu");
    const isCtx =
      t.includes("context") || t.includes("num_ctx") || t.includes("kv") || t.includes("long");
    if (isCudaOom) {
      return {
        title: "CUDA Out of Memory — Weights + KV exceed dedicated VRAM",
        fix: "Unload idle models first, enable Q8_0 KV cache quantization, and cap GPU layers or context length.",
      };
    }
    if (isSysMem) {
      return {
        title: "Host RAM Exhausted — Model footprint exceeds system memory",
        fix: "Step down one weight class (32B to 14B or 8B) or drop from Q8 to Q4_K_M while keeping context at 4k–8k.",
      };
    }
    if (isCtx) {
      return {
        title: "KV Cache Overflow — Long context window saturated VRAM",
        fix: "Set OLLAMA_FLASH_ATTENTION=1 and OLLAMA_KV_CACHE_TYPE=q8_0, or trim context to 4096 tokens.",
      };
    }
    if (isSlow) {
      return {
        title: "PCIe Offload Cliff — Partial layers fell back to system RAM",
        fix: "Even 10% layer spillover cuts generation throughput 5–20x. Reduce quantization to keep 100% of layers in VRAM.",
      };
    }
    return {
      title: "Memory Pressure Detected",
      fix: "Unload cached models with ollama stop and inspect live VRAM allocation via ollama ps.",
    };
  }, [err]);

  const steps = [
    {
      n: "01",
      title: "Inspect GPU vs CPU layer split",
      cmd: "ollama ps",
      why: "Verifies exact VRAM percentage loaded on GPU. nvidia-smi alone hides partial CPU offload.",
    },
    {
      n: "02",
      title: "Enable FlashAttention + Q8_0 KV Cache",
      cmd: "OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve",
      why: "Cuts context window memory usage by ~45% with zero noticeable quality degradation.",
    },
    {
      n: "03",
      title: "Unload stale weights from memory",
      cmd: "ollama stop qwen3:8b",
      why: "Ollama keeps previous models resident for 5 minutes; pass the exact model tag to reclaim VRAM immediately.",
    },
    {
      n: "04",
      title: "Bound context length & GPU layers",
      cmd: "llama-cli -hf unsloth/Qwen3-14B-GGUF:Q4_K_M -c 8192 -ctk q8_0 -ctv q8_0 -ngl 99",
      why: "Prevents unbounded context allocation during long multi-turn agent or repository sessions.",
    },
  ];

  return (
    <section className="mt-8 rounded-xl border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated/60"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-primary">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-primary">CUDA OOM Diagnostics &amp; Recovery</div>
            <div className="mt-0.5 font-display text-sm font-semibold text-fg">
              Hitting out-of-memory errors or 3 tok/s offload slowdowns? Paste the error to diagnose.
            </div>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-muted">
          <span>{open ? "Hide" : "Diagnose"}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open ? (
        <div className="border-t border-line p-5">
          <label className="block">
            <span className="text-xs font-medium text-muted">
              Paste console error (CUDA OOM, ggml_cuda, requires more system memory, or slow offload)
            </span>
            <textarea
              value={err}
              onChange={(e) => setErr(e.target.value)}
              rows={3}
              placeholder={"Error: CUDA error: out of memory (current device: 0, free: 123 MiB total: 24564 MiB)"}
              className="mt-2 min-h-[84px] w-full resize-y rounded-lg border border-line bg-bg px-3.5 py-2.5 font-mono text-xs text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
          </label>

          {diagnosis ? (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3.5">
              <div className="text-xs font-semibold text-fg">{diagnosis.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{diagnosis.fix}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.n} className="rounded-lg border border-line bg-bg p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-semibold text-primary">{s.n}</span>
                      <span className="text-xs font-medium text-fg">{s.title}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{s.why}</p>
                  </div>
                  <CopyBtn text={s.cmd} label="Copy" />
                </div>
                <code className="mt-2.5 block break-all rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-2xs text-fg">
                  {s.cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
