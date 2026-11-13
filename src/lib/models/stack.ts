import { MODELS } from "./catalog";
import { getHardwareBandwidth } from "./bandwidth";
import { calcKvCacheGb, getMemoryPools, matchModels } from "./match";
import type { FitKind, KvQuant, Model, QuantName, Specs } from "./types";

export type StackItemInput = {
  modelId: string;
  quantName?: QuantName;
};

export type StackItemBreakdown = {
  model: Model;
  quantName: QuantName;
  weightsGb: number;
  kvGb: number;
  subtotalGb: number;
};

export type StackEvaluation = {
  items: StackItemBreakdown[];
  weightsGb: number;
  kvGb: number;
  runtimeOverheadGb: number;
  totalRequiredGb: number;
  gpuPoolGb: number;
  hybridPoolGb: number;
  cpuPoolGb: number;
  fit: FitKind;
  headroomGb: number;
  utilizationPct: number;
};

export function evaluateLocalStack(
  selections: StackItemInput[],
  specs: Specs,
  contextK: number = 8,
  kvQuant: KvQuant = "fp16",
): StackEvaluation {
  const pools = getMemoryPools(specs);
  const items: StackItemBreakdown[] = [];

  for (const sel of selections) {
    const model = MODELS.find((m) => m.id === sel.modelId);
    if (!model) continue;
    const quant =
      (sel.quantName ? model.quants.find((q) => q.name === sel.quantName) : undefined) ||
      model.quants.find((q) => q.name === "Q4") ||
      model.quants[0];
    if (!quant) continue;

    const weightsGb = quant.vramGb;
    const kvGb = calcKvCacheGb(model, contextK, kvQuant);
    items.push({
      model,
      quantName: quant.name,
      weightsGb,
      kvGb,
      subtotalGb: Math.round((weightsGb + kvGb) * 10) / 10,
    });
  }

  const weightsGb = Math.round(items.reduce((sum, i) => sum + i.weightsGb, 0) * 10) / 10;
  const kvGb = Math.round(items.reduce((sum, i) => sum + i.kvGb, 0) * 10) / 10;
  const runtimeOverheadGb = items.length > 0 ? Math.round((0.5 + items.length * 0.25) * 10) / 10 : 0;
  const totalRequiredGb = Math.round((weightsGb + kvGb + runtimeOverheadGb) * 10) / 10;

  let fit: FitKind = "no";
  let headroomGb = 0;

  if (totalRequiredGb <= pools.gpu) {
    fit = "gpu";
    headroomGb = Math.round((pools.gpu - totalRequiredGb) * 10) / 10;
  } else if (totalRequiredGb <= pools.hybrid) {
    fit = "hybrid";
    headroomGb = Math.round((pools.hybrid - totalRequiredGb) * 10) / 10;
  } else if (totalRequiredGb <= pools.cpu) {
    fit = "cpu";
    headroomGb = Math.round((pools.cpu - totalRequiredGb) * 10) / 10;
  } else {
    fit = "no";
    headroomGb = Math.round((pools.gpu - totalRequiredGb) * 10) / 10;
  }

  const denom = Math.max(1, pools.gpu > 0 ? pools.gpu : pools.cpu);
  const utilizationPct = Math.min(200, Math.round((totalRequiredGb / denom) * 100));

  return {
    items,
    weightsGb,
    kvGb,
    runtimeOverheadGb,
    totalRequiredGb,
    gpuPoolGb: pools.gpu,
    hybridPoolGb: pools.hybrid,
    cpuPoolGb: pools.cpu,
    fit,
    headroomGb,
    utilizationPct,
  };
}

export type RigComparison = {
  baseBandwidthGbS: number;
  targetBandwidthGbS: number;
  bandwidthGainX: number;
  basePoolGb: number;
  targetPoolGb: number;
  baseTopSpeedMin: number;
  targetTopSpeedMin: number;
  newlyGpuFittedModels: Array<{ id: string; name: string; params: string; quant: string; speed: string }>;
};

export function compareRigs(
  baseSpecs: Specs,
  targetSpecs: Specs,
  contextK: number = 8,
  kvQuant: KvQuant = "fp16",
): RigComparison {
  const baseBw = getHardwareBandwidth(baseSpecs).bandwidthGbS;
  const targetBw = getHardwareBandwidth(targetSpecs).bandwidthGbS;
  const basePool = getMemoryPools(baseSpecs).gpu;
  const targetPool = getMemoryPools(targetSpecs).gpu;

  const baseMatch = matchModels(baseSpecs, undefined, contextK, kvQuant);
  const targetMatch = matchModels(targetSpecs, undefined, contextK, kvQuant);

  const baseGpuIds = new Set(
    [...baseMatch.picks, ...baseMatch.also]
      .filter((f) => f.fit === "gpu")
      .map((f) => f.model.id),
  );

  const newlyGpuFittedModels = [...targetMatch.picks, ...targetMatch.also]
    .filter((f) => f.fit === "gpu" && !baseGpuIds.has(f.model.id))
    .slice(0, 5)
    .map((f) => ({
      id: f.model.id,
      name: f.model.name,
      params: f.model.params,
      quant: f.quant.name,
      speed: f.speed,
    }));

  const baseTopSpeedMin = baseMatch.picks[0]?.tokPerSecMin ?? 0;
  const targetTopSpeedMin = targetMatch.picks[0]?.tokPerSecMin ?? 0;

  return {
    baseBandwidthGbS: baseBw,
    targetBandwidthGbS: targetBw,
    bandwidthGainX: Math.round((targetBw / Math.max(1, baseBw)) * 10) / 10,
    basePoolGb: basePool,
    targetPoolGb: targetPool,
    baseTopSpeedMin,
    targetTopSpeedMin,
    newlyGpuFittedModels,
  };
}
