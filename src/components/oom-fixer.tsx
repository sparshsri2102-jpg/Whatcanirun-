import { useMemo, useState } from "react";

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); }
        catch {
          const ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        }
        setDone(true); setTimeout(() => setDone(false), 1400);
      }}
      className="shrink-0 border border-line bg-bg px-2 py-1 font-mono text-2xs text-muted hover:border-fg hover:text-fg"
    >
      {done ? "✓ copied" : label}
    </button>
  );
}

export function OomFixer() {
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const diagnosis = useMemo(() => {
    const t = err.toLowerCase();
    if (!t.trim()) return null;
    const isCudaOom = t.includes("cuda") && t.includes("out of memory") || t.includes("cublas_status_alloc_failed") || t.includes("ggml_cuda");
    const isSysMem = t.includes("requires more system memory") || t.includes("signal: killed") || t.includes("oom killer");
    const isSlow = t.includes("slow") || t.includes("tokens/s") || t.includes("offload") || t.includes("cpu");
    const isCtx = t.includes("context") || t.includes("num_ctx") || t.includes("kv") || t.includes("long");
    if (isCudaOom) return { kind: "cuda-oom", title: "CUDA out of memory — weights + KV don't fit VRAM", fix: "Weights fit, but weights + KV cache at your context don't. Free VRAM, cap GPU layers, shrink context." };
    if (isSysMem) return { kind: "sys-oom", title: "System RAM exhausted — model too big for RAM", fix: "Drop one model size (32B→14B→8B) or one quant (Q8→Q5→Q4), cut context to 2k–4k." };
    if (isCtx) return { kind: "ctx", title: "KV cache ate your VRAM on long context", fix: "KV grows with every token. Halve num_ctx or quantize KV cache — instant GBs back." };
    if (isSlow) return { kind: "slow", title: "Offload cliff — part of the model spilled to CPU", fix: "Even 10% on CPU collapses speed 5–20×. Size the model to 100% GPU or accept batch-only use." };
    return { kind: "generic", title: "Memory pressure — model barely fits", fix: "Unload idle models, use Q4_K_M, cut context. Verify with ollama ps, not nvidia-smi alone." };
  }, [err]);

  const steps = [
    { n: "1", title: "See what's actually loaded", cmd: "ollama ps", why: "SHOWS GPU vs CPU split. nvidia-smi alone lies — 78% CPU / 22% GPU still looks 'used'." },
    { n: "2", title: "Unload by name (frees VRAM now)", cmd: "ollama stop llama3.2:3b", why: "Ollama keeps models 5 min after use. Bare `ollama stop` errors — name is required." },
    { n: "3", title: "Re-run with capped GPU layers", cmd: "ollama run llama3.2:3b --num-gpu 28", why: "Forces headroom for KV cache. Drop to 20–24 if still OOM. Verify with ollama ps." },
    { n: "4", title: "Shrink context (KV is the hidden hog)", cmd: "ollama run llama3.2:3b --num-ctx 2048", why: "8k→2k saves 1–2GB on 7B. KV grows linearly — long chats OOM even when weights fit." },
  ];

  return (
    <div className="mt-10 border border-line bg-surface">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={open}>
        <span>
          <span className="text-2xs uppercase tracking-[0.24em] text-warning">already hit CUDA out of memory? fix it here</span>
          <span className="mt-1 block text-sm font-medium text-fg">OOM fixer — paste the error, get 4 commands. No restart.</span>
        </span>
        <span className="border border-line px-2 py-1 font-mono text-2xs text-muted">{open ? "hide −" : "open →"}</span>
      </button>
      {open ? (
        <div className="border-t border-line p-4 sm:p-5">
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-dim">paste your error (CUDA OOM / requires more memory / slow offload)</span>
            <textarea
              value={err}
              onChange={(e) => setErr(e.target.value)}
              rows={3}
              placeholder={"e.g.\nError: CUDA error: out of memory\n  current device: 0, free: 123 MiB total: 24564 MiB"}
              className="mt-2 min-h-[90px] w-full resize-y border border-line bg-bg px-3 py-2 font-mono text-xs text-fg placeholder:text-dim focus:border-fg focus:outline-none"
            />
          </label>
          {diagnosis ? (
            <div className="mt-3 border border-warning/30 bg-warning/5 p-3">
              <div className="text-xs font-semibold text-fg">{diagnosis.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{diagnosis.fix}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-dim">Try: “CUDA out of memory”, “requires more system memory”, “slow offload”, “long context OOM”.</p>
          )}
          <div className="mt-4 grid gap-3">
            {steps.map((s) => (
              <div key={s.n} className="border border-line bg-bg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-2xs text-primary">STEP {s.n}</span>
                    <span className="ml-2 text-xs font-medium text-fg">{s.title}</span>
                    <p className="mt-1 text-2xs leading-relaxed text-muted">{s.why}</p>
                  </div>
                  <CopyBtn text={s.cmd} label="copy" />
                </div>
                <code className="mt-2 block break-all border border-line bg-surface px-2 py-1.5 font-mono text-xs text-fg">{s.cmd}</code>
              </div>
            ))}
          </div>
          <p className="mt-3 text-2xs leading-relaxed text-dim">
            Why this works: Ollama splits layers to RAM when VRAM runs out — no crash, just 5–20× slower. These 4 commands reclaim VRAM, cap layers, and cut KV. Sources: Ollama docs, llama.cpp KV math, community OOM threads.
          </p>
        </div>
      ) : null}
    </div>
  );
}
