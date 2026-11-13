import type { KvQuant, ModelFit } from "@/lib/models/types";

export function VramBar({
  fit,
  capacityGb,
  kvQuant = "fp16",
}: {
  fit: ModelFit;
  capacityGb: number;
  kvQuant?: KvQuant;
}) {
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
    <div className="mt-4 rounded-lg border border-line bg-bg p-3">
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-elevated"
        role="img"
        aria-label={`Memory footprint: weights ${weights} GB plus KV cache ${kv} GB plus overhead ${overhead} GB equals ${total} GB versus ${capacityGb} GB available`}
      >
        <div className="h-full bg-fg" style={{ width: `${wPct}%` }} title={`Weights ${weights} GB`} />
        <div className="h-full bg-primary" style={{ width: `${kPct}%` }} title={`KV Cache ${kv} GB`} />
        <div className="h-full bg-dim" style={{ width: `${oPct}%` }} title={`Runtime overhead ${overhead} GB`} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-muted">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="inline-block h-2 w-2 rounded-xs bg-fg mr-1.5" />
            Weights {weights} GB
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-xs bg-primary mr-1.5" />
            KV ({kvQuant.toUpperCase()}) {kv} GB
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-xs bg-dim mr-1.5" />
            Buffers ~{overhead} GB
          </span>
        </div>
        <span className={over ? "font-medium text-warning" : "font-medium text-success"}>
          {total} GB / {capacityGb} GB {over ? "(Spillover)" : "(Fits)"}
        </span>
      </div>
    </div>
  );
}

export function QuantGlossary() {
  const rows = [
    {
      q: "Q4_K_M",
      use: "Recommended Baseline",
      why: "~0.56 GB per billion params. 1–3% perplexity delta with highest speed per gigabyte.",
    },
    {
      q: "Q5_K_M",
      use: "Higher Precision",
      why: "Noticeably sharper multi-file code and reasoning traces when +25% VRAM is available.",
    },
    {
      q: "Q8_0",
      use: "Near-Lossless",
      why: "Reference fidelity (~1.05 bytes/param). Use when headroom stays above 15%.",
    },
    {
      q: "Q3 / IQ2",
      use: "MoE Compression",
      why: "Squeezes 100B–400B Mixture-of-Experts weights onto 64–128 GB unified workstations.",
    },
  ];
  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-5">
      <div className="text-xs font-medium text-muted">Quantization Reference</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <div key={r.q} className="rounded-lg border border-line bg-bg p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-primary">{r.q}</span>
              <span className="text-2xs text-dim">{r.use}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{r.why}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-dim">
        Tip: Enabling FlashAttention + <span className="font-mono text-muted">q8_0</span> KV cache cuts context memory by ~45% with virtually zero output degradation.
      </p>
    </div>
  );
}

export function MethodologyNote() {
  return (
    <p className="mt-4 text-xs leading-relaxed text-dim">
      Footprint formula: quantized model weights + scaled attention KV cache (MLA-adjusted for DeepSeek MoEs, KV-quant scaled) + ~6% CUDA/Metal runtime buffer allocation. Verify live allocation with <span className="font-mono text-muted">ollama ps</span> or <span className="font-mono text-muted">nvidia-smi</span>.
    </p>
  );
}
