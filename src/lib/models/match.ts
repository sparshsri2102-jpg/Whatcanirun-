import { MODELS } from "./catalog";
import { estimateTokensPerSec } from "./bandwidth";
import type {
  FitKind,
  KvQuant,
  MatchResult,
  Model,
  ModelFit,
  ModelTask,
  Quant,
  QuantOption,
  Specs,
} from "./types";

const TASK_LABEL: Record<ModelTask, string> = {
  chat: "chat",
  code: "code",
  reason: "reasoning",
  vision: "vision",
  image: "image gen",
  video: "video gen",
  audio: "audio",
  embed: "embeddings",
  agent: "agents",
};

const KV_MULTIPLIER: Record<KvQuant, number> = {
  fp16: 1.0,
  q8_0: 0.55,
  q4_0: 0.3,
};

export function calcKvCacheGb(
  model: Model,
  contextK: number,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): number {
  if (contextK <= 0 || model.contextK === 0) return 0;
  const mult = KV_MULTIPLIER[kvQuant] ?? 1.0;
  const batch = Math.max(1, batchSize);

  // Multi-Head Latent Attention (MLA) keeps KV footprint dramatically smaller
  if (model.id.toLowerCase().includes("deepseek") && model.moe) {
    return Math.round(contextK * 0.04 * mult * batch * 10) / 10;
  }

  const params =
    model.moe && model.totalParamsB ? Math.max(model.paramsB, model.totalParamsB * 0.2) : model.paramsB || 8;
  let factor = 0.045;
  if (params <= 4) factor = 0.025;
  else if (params <= 9) factor = 0.045;
  else if (params <= 20) factor = 0.08;
  else if (params <= 40) factor = 0.12;
  else if (params <= 80) factor = 0.18;
  else factor = 0.25;

  return Math.round(contextK * factor * mult * batch * 10) / 10;
}

export function calcMaxSafeContextK(
  model: Model,
  quant: Quant,
  specs: Specs,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): number {
  if (model.contextK === 0) return 0;
  const p = getMemoryPools(specs);
  const freeVram = p.gpu - quant.vramGb;
  if (freeVram <= 0) return 0;
  const kvPer1k = Math.max(0.002, calcKvCacheGb(model, 1, kvQuant, batchSize));
  return Math.min(model.contextK, Math.floor(freeVram / kvPer1k));
}

function pickCloudFallback(totalNeededGb: number) {
  const tiers = [
    { name: "1x RTX 4090 24GB", vramGb: 24, hourlyUsd: 0.34, providerHint: "RunPod / Vast" },
    { name: "1x A40 48GB", vramGb: 48, hourlyUsd: 0.49, providerHint: "RunPod / Lambda" },
    { name: "1x H100 SXM 80GB", vramGb: 80, hourlyUsd: 1.99, providerHint: "Lambda / Spheron" },
    { name: "2x H100 SXM (160GB)", vramGb: 160, hourlyUsd: 3.98, providerHint: "Multi-GPU Node" },
    { name: "4x H100 SXM (320GB)", vramGb: 320, hourlyUsd: 7.96, providerHint: "Cluster Node" },
    { name: "8x H100 SXM (640GB)", vramGb: 640, hourlyUsd: 15.92, providerHint: "8xHGX Node" },
  ];
  return tiers.find((t) => t.vramGb * 0.92 >= totalNeededGb) || tiers[tiers.length - 1];
}

export function getMemoryPools(specs: Specs) {
  const count = Math.max(1, specs.gpuCount || 1);
  const totalVram = Math.max(0, specs.vramGb) * count;
  const ram = Math.max(0, specs.ramGb);

  if (specs.unified) {
    const usable = Math.round(ram * 0.72 * 10) / 10;
    return { gpu: usable, hybrid: usable, cpu: usable, totalVram };
  }

  const splitBufferLoss = count > 1 ? (count - 1) * 0.8 : 0;
  const usableGpu = Math.round(Math.max(0, totalVram * 0.9 - splitBufferLoss) * 10) / 10;

  return {
    gpu: usableGpu,
    hybrid: Math.round((usableGpu + ram * 0.5) * 10) / 10,
    cpu: Math.round(ram * 0.62 * 10) / 10,
    totalVram,
  };
}

function evaluateQuant(
  quant: Quant,
  model: Model,
  specs: Specs,
  contextK: number,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): QuantOption {
  const p = getMemoryPools(specs);
  const kvCache = calcKvCacheGb(model, contextK, kvQuant, batchSize);
  const totalNeeded = Math.round((quant.vramGb + kvCache) * 10) / 10;

  let fit: FitKind = "no";
  let headroomGb = 0;

  if (totalNeeded <= p.gpu) {
    fit = "gpu";
    headroomGb = Math.round((p.gpu - totalNeeded) * 10) / 10;
  } else if (totalNeeded <= p.hybrid) {
    fit = "hybrid";
    headroomGb = Math.round((p.hybrid - totalNeeded) * 10) / 10;
  } else if (totalNeeded <= p.cpu) {
    fit = "cpu";
    headroomGb = Math.round((p.cpu - totalNeeded) * 10) / 10;
  } else {
    fit = "no";
    headroomGb = Math.round((p.gpu - totalNeeded) * 10) / 10;
  }

  const speedEst = estimateTokensPerSec(model, quant, fit, specs);
  const batchScale = batchSize > 1 ? 1 / (1 + Math.log2(batchSize) * 0.35) : 1;
  const tokMin = Math.max(1, Math.round(speedEst.tokPerSecMin * batchScale));
  const tokMax = Math.max(tokMin + 1, Math.round(speedEst.tokPerSecMax * batchScale));
  const speedLabel = batchSize > 1 ? `${tokMin}-${tokMax} tok/s (${batchSize}x)` : speedEst.tokPerSecLabel;

  return {
    quant,
    fit,
    headroomGb,
    speed: speedLabel,
    tokPerSec: speedLabel,
    tokPerSecMin: tokMin,
    tokPerSecMax: tokMax,
    prefillTokS: speedEst.prefillTokS,
    ttftMs: speedEst.ttftMs,
    bandwidthGbS: speedEst.bandwidthGbS,
    busType: speedEst.busType,
    totalNeededGb: totalNeeded,
    maxSafeContextK: calcMaxSafeContextK(model, quant, specs, kvQuant, batchSize),
  };
}

export function bestQuant(
  model: Model,
  specs: Specs,
  contextK: number,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): {
  quant: Quant;
  fit: FitKind;
  headroomGb: number;
  kvCacheGb: number;
  weightsGb: number;
  totalNeededGb: number;
  maxSafeContextK: number;
  tokPerSec: string;
  tokPerSecMin: number;
  tokPerSecMax: number;
  prefillTokS: number;
  ttftMs: number;
  bandwidthGbS: number;
  busType: string;
  kvQuant: KvQuant;
  quantOptions: QuantOption[];
} | null {
  const quantOptions = model.quants.map((q) => evaluateQuant(q, model, specs, contextK, kvQuant, batchSize));
  const usableOptions = quantOptions.filter((q) => q.fit !== "no");
  if (usableOptions.length === 0) return null;

  const gpuFit = usableOptions
    .filter((q) => q.fit === "gpu")
    .sort((a, b) => b.quant.quality - a.quant.quality)[0];
  const hybridFit = usableOptions
    .filter((q) => q.fit === "hybrid")
    .sort((a, b) => b.quant.quality - a.quant.quality)[0];
  const cpuFit = usableOptions
    .filter((q) => q.fit === "cpu")
    .sort((a, b) => b.quant.quality - a.quant.quality)[0];

  const picked = gpuFit || hybridFit || cpuFit || usableOptions[0];
  const kvCache = calcKvCacheGb(model, contextK, kvQuant, batchSize);

  return {
    quant: picked.quant,
    fit: picked.fit,
    headroomGb: picked.headroomGb,
    kvCacheGb: kvCache,
    weightsGb: picked.quant.vramGb,
    totalNeededGb: picked.totalNeededGb,
    maxSafeContextK: picked.maxSafeContextK ?? 0,
    tokPerSec: picked.tokPerSec ?? picked.speed,
    tokPerSecMin: picked.tokPerSecMin ?? 1,
    tokPerSecMax: picked.tokPerSecMax ?? 2,
    prefillTokS: picked.prefillTokS ?? 100,
    ttftMs: picked.ttftMs ?? 200,
    bandwidthGbS: picked.bandwidthGbS ?? 100,
    busType: picked.busType ?? "Memory bus",
    kvQuant,
    quantOptions,
  };
}

function why(
  model: Model,
  fit: FitKind,
  quant: Quant,
  specs: Specs,
  contextK: number = 8,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): string {
  const task = model.tasks
    .filter((t) => t !== "chat")
    .slice(0, 2)
    .map((t) => TASK_LABEL[t])
    .join(" + ");
  const count = Math.max(1, specs.gpuCount || 1);
  const where =
    fit === "gpu"
      ? count > 1
        ? `split across ${count}x GPUs in VRAM`
        : "fully on GPU"
      : fit === "hybrid"
        ? "GPU + RAM offload"
        : "CPU RAM";
  const card = specs.unified
    ? `${specs.ramGb} GB unified`
    : count > 1
      ? `${count}x ${specs.vramGb} GB (${count * specs.vramGb} GB total VRAM)`
      : `${specs.vramGb} GB VRAM`;
  const kv = calcKvCacheGb(model, contextK, kvQuant, batchSize);
  const total = Math.round((quant.vramGb + kv) * 10) / 10;
  const kvSuffix = kvQuant === "fp16" ? "" : ` ${kvQuant.toUpperCase()} KV`;
  const batchSuffix = batchSize > 1 ? ` × ${batchSize} users` : "";
  return `${quant.name} is ${quant.vramGb} GB (+${kv} GB @ ${contextK}k${kvSuffix}${batchSuffix} = ${total} GB) · ${where} on ${card}${task ? ` · ${task}` : ""}`;
}

function scoreFit(
  model: Model,
  fit: FitKind,
  quant: Quant,
  headroomGb: number,
  prefer?: ModelTask,
): number {
  let s = model.quality * 0.55 + quant.quality * 0.2;
  if (fit === "gpu") s += 40;
  else if (fit === "hybrid") s += 12;
  else s -= 8;

  if (fit === "gpu") {
    const used = quant.vramGb;
    s += Math.min(18, used * 0.35);
    if (headroomGb > 20 && model.paramsB < 8) s -= 12;
  }
  if (prefer && model.tasks.includes(prefer)) s += 14;
  if (model.license.toLowerCase().includes("apache") || model.license === "MIT") s += 2;
  const recency = Date.parse(`${model.released}-01`) || 0;
  s += Math.max(0, (recency - Date.parse("2024-01-01")) / (1000 * 60 * 60 * 24 * 40));
  return s;
}

export function matchModels(
  specs: Specs,
  prefer?: ModelTask,
  contextK: number = 8,
  kvQuant: KvQuant = "fp16",
  batchSize: number = 1,
): MatchResult {
  const p = getMemoryPools(specs);
  const fits: ModelFit[] = [];

  for (const model of MODELS) {
    const found = bestQuant(model, specs, contextK, kvQuant, batchSize);
    if (!found) continue;
    const {
      quant,
      fit,
      headroomGb,
      kvCacheGb,
      weightsGb,
      totalNeededGb,
      maxSafeContextK,
      tokPerSec,
      tokPerSecMin,
      tokPerSecMax,
      prefillTokS,
      ttftMs,
      bandwidthGbS,
      busType,
      quantOptions,
    } = found;
    fits.push({
      model,
      quant,
      fit,
      headroomGb,
      score: scoreFit(model, fit, quant, headroomGb, prefer),
      why: why(model, fit, quant, specs, contextK, kvQuant, batchSize),
      speed: tokPerSec,
      tokPerSec,
      tokPerSecMin,
      tokPerSecMax,
      prefillTokS,
      ttftMs,
      bandwidthGbS,
      busType,
      kvCacheGb,
      weightsGb,
      totalNeededGb,
      maxSafeContextK,
      cloudFallback: fit === "gpu" ? null : pickCloudFallback(totalNeededGb),
      kvQuant,
      quantOptions,
    });
  }

  fits.sort((a, b) => b.score - a.score);

  const picks: ModelFit[] = [];
  const seenOrg = new Set<string>();
  const seenTaskKey = new Set<string>();
  for (const f of fits) {
    if (picks.length >= 4) break;
    const key = `${f.model.org}:${f.model.tasks[0]}`;
    if (seenOrg.has(f.model.org) && seenTaskKey.has(key) && picks.length < 3) continue;
    if (seenOrg.has(f.model.org) && picks.length >= 2) continue;
    picks.push(f);
    seenOrg.add(f.model.org);
    seenTaskKey.add(key);
  }
  if (picks.length < 3) {
    for (const f of fits) {
      if (picks.length >= 4) break;
      if (picks.some((p) => p.model.id === f.model.id)) continue;
      picks.push(f);
    }
  }

  const pickIds = new Set(picks.map((p) => p.model.id));
  const also = fits.filter((f) => !pickIds.has(f.model.id)).slice(0, 6);

  const gpuPicks = picks.filter((p) => p.fit === "gpu").length;
  const count = Math.max(1, specs.gpuCount || 1);
  const totalVramText = specs.unified
    ? `${specs.ramGb} GB Unified`
    : count > 1
      ? `${count}x GPUs (${count * specs.vramGb} GB VRAM)`
      : `${specs.vramGb} GB VRAM`;

  const batchLabel = batchSize > 1 ? ` · ${batchSize}x concurrent batch` : "";
  const blurb = gpuPicks
    ? `${gpuPicks} of ${picks.length} run fully in ${totalVramText} with ${contextK}k context (${kvQuant.toUpperCase()} KV${batchLabel}). Heavier weights require offload or higher VRAM.`
    : picks.length
      ? `Nothing here fits cleanly in dedicated VRAM at ${contextK}k context${batchLabel}. These are the highest-throughput offload / CPU options.`
      : `This machine is below the floor for current open-weight LLMs at ${contextK}k context. Try 4k context, Q8_0 KV cache, or a 3B Q4 model.`;

  return {
    specs,
    picks,
    also,
    blurb,
    contextK,
    kvQuant,
    batchSize,
    effectivePoolGb: p.gpu,
    hybridPoolGb: p.hybrid,
  };
}

export { TASK_LABEL };
