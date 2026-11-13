import { useMemo, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { MODELS } from "@/lib/models/catalog";
import { evaluateLocalStack, type StackItemInput } from "@/lib/models/stack";
import type { KvQuant, QuantName, Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

const STACK_PRESETS: Array<{ label: string; items: StackItemInput[] }> = [
  {
    label: "Private Coding Stack",
    items: [
      { modelId: "qwen3-14b", quantName: "Q4" },
      { modelId: "bge-m3", quantName: "Q8" },
    ],
  },
  {
    label: "Offline Voice + RAG",
    items: [
      { modelId: "qwen3-8b", quantName: "Q4" },
      { modelId: "whisper-large-v3", quantName: "Q8" },
      { modelId: "kokoro-82m", quantName: "FP16" },
      { modelId: "nomic-embed", quantName: "Q8" },
    ],
  },
  {
    label: "Frontier Agent + Multimodal",
    items: [
      { modelId: "gpt-oss-20b", quantName: "Q4" },
      { modelId: "bge-m3", quantName: "Q8" },
      { modelId: "whisper-large-v3", quantName: "Q4" },
    ],
  },
];

export function StackPlanner({
  specs,
  contextK,
  kvQuant,
}: {
  specs: Specs;
  contextK: number;
  kvQuant: KvQuant;
}) {
  const [items, setItems] = useState<StackItemInput[]>([
    { modelId: "qwen3-8b", quantName: "Q4" },
    { modelId: "bge-m3", quantName: "Q8" },
    { modelId: "kokoro-82m", quantName: "FP16" },
  ]);
  const [addModelId, setAddModelId] = useState<string>("whisper-large-v3");

  const evalResult = useMemo(
    () => evaluateLocalStack(items, specs, contextK, kvQuant),
    [items, specs, contextK, kvQuant],
  );

  const poolCap = Math.max(1, evalResult.gpuPoolGb || evalResult.cpuPoolGb);
  const wPct = Math.min(100, (evalResult.weightsGb / Math.max(poolCap, evalResult.totalRequiredGb)) * 100);
  const kvPct = Math.min(100 - wPct, (evalResult.kvGb / Math.max(poolCap, evalResult.totalRequiredGb)) * 100);
  const ovPct = Math.min(
    100 - wPct - kvPct,
    (evalResult.runtimeOverheadGb / Math.max(poolCap, evalResult.totalRequiredGb)) * 100,
  );

  const statusText =
    evalResult.fit === "gpu"
      ? "Fits GPU Simultaneously"
      : evalResult.fit === "hybrid"
        ? "Requires RAM Offload"
        : evalResult.fit === "cpu"
          ? "CPU RAM Only"
          : "Exceeds Rig Capacity";

  const statusColor =
    evalResult.fit === "gpu"
      ? "text-success"
      : evalResult.fit === "hybrid" || evalResult.fit === "cpu"
        ? "text-primary"
        : "text-danger";

  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Layers className="h-3.5 w-3.5" />
            <span>Co-Resident Stack Planner</span>
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-fg">
            Simulate simultaneous local models in memory
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Verify whether your chat model, RAG embeddings, and speech pipeline fit side by side at {contextK}k context ({kvQuant.toUpperCase()} KV).
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setItems(preset.items)}
              className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Combined Stack Memory Meter */}
      <div className="mt-5 rounded-lg border border-line bg-bg p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-2xl font-semibold tabular-nums text-fg">
              {evalResult.totalRequiredGb} GB
            </span>
            <span className="text-xs text-muted">
              of {evalResult.gpuPoolGb > 0 ? `${evalResult.gpuPoolGb} GB usable GPU pool` : `${evalResult.cpuPoolGb} GB CPU pool`}
            </span>
          </div>
          <div className={cn("text-xs font-medium", statusColor)}>
            {statusText} ·{" "}
            <span className="font-mono tabular-nums">
              {evalResult.headroomGb >= 0 ? `+${evalResult.headroomGb} GB free` : `${evalResult.headroomGb} GB over`}
            </span>
          </div>
        </div>

        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-elevated">
          <div className="h-full bg-fg transition-all duration-300" style={{ width: `${wPct}%` }} />
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${kvPct}%` }} />
          <div className="h-full bg-dim transition-all duration-300" style={{ width: `${ovPct}%` }} />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted tabular-nums">
          <span>Weights: {evalResult.weightsGb} GB</span>
          <span>KV Cache ({kvQuant.toUpperCase()}): {evalResult.kvGb} GB</span>
          <span>Runtime Buffers: {evalResult.runtimeOverheadGb} GB</span>
          <span>Utilization: {evalResult.utilizationPct}%</span>
        </div>
      </div>

      {/* Active Models in Stack */}
      <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-bg">
        {evalResult.items.length === 0 ? (
          <div className="p-6 text-center text-xs text-dim">
            Add a model below to test a co-resident stack.
          </div>
        ) : (
          evalResult.items.map((item, idx) => (
            <div
              key={`${item.model.id}-${idx}`}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{item.model.name}</span>
                  <span className="text-xs text-dim">· {item.model.org} · {item.model.tasks.slice(0, 2).join(", ")}</span>
                </div>
                <div className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                  Weights {item.weightsGb} GB + KV {item.kvGb} GB = {item.subtotalGb} GB
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  aria-label={`Quantization for ${item.model.name}`}
                  value={item.quantName}
                  onChange={(e) => {
                    const nextQuant = e.target.value as QuantName;
                    setItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, quantName: nextQuant } : row)),
                    );
                  }}
                  className="rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-fg focus:border-primary focus:outline-none"
                >
                  {item.model.quants.map((q) => (
                    <option key={q.name} value={q.name}>
                      {q.name} ({q.vramGb} GB)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${item.model.name}`}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-muted hover:border-danger/50 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Model Bar */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Add model to local stack"
          value={addModelId}
          onChange={(e) => setAddModelId(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-line bg-bg px-3 text-xs text-fg focus:border-primary focus:outline-none"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.params}) — {m.tasks.slice(0, 2).join("/")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const m = MODELS.find((x) => x.id === addModelId);
            if (!m) return;
            const defaultQuant = m.quants.find((q) => q.name === "Q4")?.name ?? m.quants[0]?.name ?? "Q4";
            setItems((prev) => [...prev, { modelId: m.id, quantName: defaultQuant }]);
          }}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-elevated px-4 text-xs font-medium text-fg transition-colors hover:border-fg/40"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add to Stack</span>
        </button>
      </div>
    </section>
  );
}
