import type { ModelFit } from "@/lib/models/types";

export function VramBar({ fit, capacityGb }: { fit: ModelFit; capacityGb: number }) {
  const weights = fit.weightsGb ?? fit.quant.vramGb;
  const kv = fit.kvCacheGb ?? 0.5;
  const overhead = Math.max(0.6, Math.round(capacityGb * 0.06 * 10) / 10);
  const total = Math.round((weights + kv + overhead) * 10) / 10;
  const cap = Math.max(capacityGb, total, 1);
  const wPct = Math.min(100, (weights / cap) * 100);
  const kPct = Math.min(100 - wPct, (kv / cap) * 100);
  const oPct = Math.max(0, Math.min(100 - wPct - kPct, (overhead / cap) * 100));
  const over = total > capacityGb;
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full overflow-hidden border border-line bg-bg" role="img" aria-label={`VRAM math: weights ${weights}GB plus KV ${kv}GB plus overhead ${overhead}GB equals ${total}GB vs ${capacityGb}GB available`}>
        <div className="h-full bg-fg" style={{ width: `${wPct}%` }} title={`weights ${weights}GB`} />
        <div className="h-full bg-primary" style={{ width: `${kPct}%` }} title={`KV cache ${kv}GB`} />
        <div className="h-full bg-dim" style={{ width: `${oPct}%` }} title={`overhead ${overhead}GB`} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-2xs text-muted">
        <span><span className="text-fg">■</span> weights {weights}GB ({fit.quant.name})</span>
        <span><span className="text-primary">■</span> KV {kv}GB @ {fit.quant.name} ctx</span>
        <span><span className="text-dim">■</span> overhead ~{overhead}GB</span>
        <span className={over ? "text-warning" : "text-emerald-400"}>= {total}GB vs {capacityGb}GB {over ? "— OVER" : "— fits"}</span>
      </div>
      <p className="mt-1 text-2xs leading-relaxed text-dim">
        File size ≠ runtime. A {weights}GB GGUF still needs KV (grows with context) + buffers. Leave 1–2GB free or long chats OOM.
      </p>
    </div>
  );
}

export function QuantGlossary() {
  const rows = [
    { q: "Q4_K_M", use: "Default. Start here.", why: "~4.5GB per 7B. 1–3% quality loss. Best fit-per-GB." },
    { q: "Q5_K_M", use: "Q4 fits with room?", why: "Noticeably sharper code/reasoning. +30% VRAM." },
    { q: "Q8_0", use: "Reference / eval.", why: "Near-lossless. 2× VRAM of Q4. Only if it still fits + KV." },
    { q: "Q3 / IQ2", use: "Desperation fit.", why: "Squeezes bigger model in. Quality cliff — test your task." },
  ];
  return (
    <div className="mt-4 border border-line bg-bg p-3">
      <div className="text-2xs uppercase tracking-widest text-dim">quant alphabet, decoded (plain english)</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.q} className="border border-line bg-surface px-2.5 py-2">
            <span className="font-mono text-xs font-semibold text-primary">{r.q}</span>
            <span className="ml-2 text-xs text-fg">{r.use}</span>
            <p className="mt-1 text-2xs leading-relaxed text-muted">{r.why}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-2xs text-dim">Rule: bigger model at Q4 beats smaller model at Q8. KV-cache q8_0 is safe for long ctx; q4_0 silently wrecks output.</p>
    </div>
  );
}

export function MethodologyNote() {
  return (
    <p className="mt-4 text-2xs leading-relaxed text-dim">
      Estimates, not benchmarks: weights from GGUF listings + KV math (params × ctx) + 6% overhead + 10% headroom rule.
      Speeds are bandwidth-based estimates. Verify with <span className="font-mono text-muted">ollama ps</span> after load.
      Sources: llama.cpp / Ollama docs, HF model cards, community llama-bench tables.
    </p>
  );
}
