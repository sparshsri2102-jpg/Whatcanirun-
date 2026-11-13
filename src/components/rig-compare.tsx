import { useMemo, useState } from "react";
import { ArrowRight, Cpu } from "lucide-react";
import { PRESETS } from "@/lib/models/catalog";
import { compareRigs } from "@/lib/models/stack";
import type { KvQuant, Specs } from "@/lib/models/types";

const UPGRADE_CANDIDATES = [
  "rtx-5080",
  "rtx-4090",
  "rtx-5090",
  "dual-rtx-3090",
  "strix-halo-128",
  "studio-128",
  "rtx-pro-6000",
];

export function RigCompare({
  specs,
  contextK,
  kvQuant,
  onSelectTargetRig,
}: {
  specs: Specs;
  contextK: number;
  kvQuant: KvQuant;
  onSelectTargetRig?: (target: Specs) => void;
}) {
  const defaultTargetId = useMemo(() => {
    const currentPool = specs.unified ? specs.ramGb : specs.vramGb * Math.max(1, specs.gpuCount || 1);
    if (currentPool < 16) return "rtx-5080";
    if (currentPool < 32) return "rtx-5090";
    if (currentPool < 96) return "studio-128";
    return "rtx-pro-6000";
  }, [specs]);

  const [targetId, setTargetId] = useState<string>(defaultTargetId);

  const targetPreset = useMemo(
    () => PRESETS.find((p) => p.id === targetId) ?? PRESETS.find((p) => p.id === "rtx-5090") ?? PRESETS[0],
    [targetId],
  );

  const targetSpecs: Specs = useMemo(
    () => ({ ...targetPreset.specs, source: "preset" }),
    [targetPreset],
  );

  const cmp = useMemo(
    () => compareRigs(specs, targetSpecs, contextK, kvQuant),
    [specs, targetSpecs, contextK, kvQuant],
  );

  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Cpu className="h-3.5 w-3.5" />
            <span>Hardware Upgrade Simulator</span>
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-fg">
            Compare your rig against next-tier hardware
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Select upgrade target rig"
            value={targetPreset.id}
            onChange={(e) => setTargetId(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-xs text-fg focus:border-primary focus:outline-none"
          >
            {PRESETS.filter((p) => UPGRADE_CANDIDATES.includes(p.id) || p.specs.vramGb >= 16).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.hint})
              </option>
            ))}
          </select>
          {onSelectTargetRig ? (
            <button
              type="button"
              onClick={() => onSelectTargetRig(targetSpecs)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-strong bg-elevated px-3.5 text-xs font-medium text-fg transition-colors hover:border-fg/40"
            >
              <span>Benchmark Target</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-bg p-4">
          <div className="text-xs text-dim">Usable GPU Pool</div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-sm text-muted">{cmp.basePoolGb} GB</span>
            <ArrowRight className="h-3.5 w-3.5 text-dim" />
            <span className="text-xl font-semibold text-fg">{cmp.targetPoolGb} GB</span>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-bg p-4">
          <div className="text-xs text-dim">Memory Bandwidth</div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-sm text-muted">{cmp.baseBandwidthGbS} GB/s</span>
            <ArrowRight className="h-3.5 w-3.5 text-dim" />
            <span className="text-xl font-semibold text-success">
              {cmp.targetBandwidthGbS} GB/s
            </span>
          </div>
          <div className="mt-1 font-mono text-xs text-dim">
            {cmp.bandwidthGainX}x bus throughput
          </div>
        </div>
        <div className="rounded-lg border border-line bg-bg p-4">
          <div className="text-xs text-dim">Top Pick Speed</div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-sm text-muted">{cmp.baseTopSpeedMin} tok/s</span>
            <ArrowRight className="h-3.5 w-3.5 text-dim" />
            <span className="text-xl font-semibold text-fg">{cmp.targetTopSpeedMin}+ tok/s</span>
          </div>
        </div>
      </div>

      {cmp.newlyGpuFittedModels.length > 0 ? (
        <div className="mt-4">
          <div className="text-xs font-medium text-muted">
            Newly unlocked at native GPU speed on {targetPreset.label}:
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cmp.newlyGpuFittedModels.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-line bg-bg px-3.5 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-fg truncate">{m.name}</div>
                  <div className="font-mono text-dim">{m.params} · {m.quant}</div>
                </div>
                <span className="font-mono tabular-nums text-success shrink-0 ml-2">{m.speed}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">
          Your current rig already matches or exceeds native GPU fit for top selections on this tier; upgrading primarily increases quantization headroom (Q4 to Q8) and token generation speed.
        </p>
      )}
    </section>
  );
}
