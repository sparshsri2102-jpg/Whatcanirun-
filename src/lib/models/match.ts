import { MODELS } from "./catalog";
import { estimateTokensPerSec } from "./bandwidth";
import type { FitKind, MatchResult, Model, ModelFit, ModelTask, Quant, QuantOption, Specs } from "./types";

const TASK_LABEL: Record<ModelTask, string> = {
  chat: "chat",
  code: "code",
  reason: "reasoning",
  vision: "vision",
  image: "image gen",
  video: "video",
  audio: "audio",
  embed: "embeddings",
  agent: "agents",
};

export function calcKvCacheGb(model: Model, contextK: number): number {
  if (contextK <= 0) return 0;
  // If model uses Multi-Head Latent Attention (DeepSeek V2/V3/R1 MoE)
  if (model.id.toLowerCase().includes("deepseek") && model.moe) {
    return Math.round((contextK * 0.04) * 10) / 10;
  }
  const params = model.paramsB || 8;
  let factor = 0.045; // GB per 1k context tokens
  if (params <= 4) factor = 0.025;
  else if (params <= 9) factor = 0.045;
  else if (params <= 20) factor = 0.08;
  else if (params <= 40) factor = 0.12;
  else if (params <= 80) factor = 0.18;
  else factor = 0.25;

  return Math.round((contextK * factor) * 10) / 10;
}

function pools(specs: Specs) {
  const count = Math.max(1, specs.gpuCount || 1);
  const totalVram = Math.max(0, specs.vramGb) * count;
  const ram = Math.max(0, specs.ramGb);

  if (specs.unified) {
    const usable = ram * 0.72;
    return { gpu: usable, hybrid: usable, cpu: usable, totalVram };
  }

  // Deduct ~0.8 GB per secondary card for tensor parallel / split communication buffers
  const splitBufferLoss = count > 1 ? (count - 1) * 0.8 : 0;
  const usableGpu = Math.max(0, totalVram * 0.9 - splitBufferLoss);

  return {
    gpu: usableGpu,
    hybrid: usableGpu + ram * 0.5,
    cpu: ram * 0.62,
    totalVram,
  };
}

function evaluateQuant(quant: Quant, model: Model, specs: Specs, contextK: number): QuantOption {
  const p = pools(specs);
  const kvCache = calcKvCacheGb(model, contextK);
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

  return {
    quant,
    fit,
    headroomGb,
    speed: speedEst.tokPerSecLabel,
    tokPerSec: speedEst.tokPerSecLabel,
    bandwidthGbS: speedEst.bandwidthGbS,
    busType: speedEst.busType,
    totalNeededGb: totalNeeded,
  };
}

function bestQuant(model: Model, specs: Specs, contextK: number): {
  quant: Quant;
  fit: FitKind;
  headroomGb: number;
  kvCacheGb: number;
  weightsGb: number;
  totalNeededGb: number;
  tokPerSec: string;
  bandwidthGbS: number;
  busType: string;
  quantOptions: QuantOption[];
} | null {
  const quantOptions = model.quants.map((q) => evaluateQuant(q, model, specs, contextK));
  const usableOptions = quantOptions.filter((q) => q.fit !== "no");
  if (usableOptions.length === 0) return null;

  // Prefer highest quality quant that fits GPU, then hybrid, then CPU
  const gpuFit = usableOptions.filter((q) => q.fit === "gpu").sort((a, b) => b.quant.quality - a.quant.quality)[0];
  const hybridFit = usableOptions.filter((q) => q.fit === "hybrid").sort((a, b) => b.quant.quality - a.quant.quality)[0];
  const cpuFit = usableOptions.filter((q) => q.fit === "cpu").sort((a, b) => b.quant.quality - a.quant.quality)[0];

  const picked = gpuFit || hybridFit || cpuFit || usableOptions[0];
  const kvCache = calcKvCacheGb(model, contextK);
  const speedEst = estimateTokensPerSec(model, picked.quant, picked.fit, specs);

  return {
    quant: picked.quant,
    fit: picked.fit,
    headroomGb: picked.headroomGb,
    kvCacheGb: kvCache,
    weightsGb: picked.quant.vramGb,
    totalNeededGb: picked.totalNeededGb,
    tokPerSec: speedEst.tokPerSecLabel,
    bandwidthGbS: speedEst.bandwidthGbS,
    busType: speedEst.busType,
    quantOptions,
  };
}

function why(model: Model, fit: FitKind, quant: Quant, specs: Specs, contextK: number = 8): string {
  const task = model.tasks.filter((t) => t !== "chat").slice(0, 2).map((t) => TASK_LABEL[t]).join(" + ");
  const count = Math.max(1, specs.gpuCount || 1);
  const where = fit === "gpu" ? (count > 1 ? `split across ${count}x GPUs in VRAM` : "fully on GPU") : fit === "hybrid" ? "GPU + RAM offload" : "CPU RAM";
  const card = specs.unified
    ? `${specs.ramGb} GB unified`
    : count > 1
      ? `${count}x ${specs.vramGb} GB (${count * specs.vramGb} GB total VRAM)`
      : `${specs.vramGb} GB VRAM`;
  const kv = calcKvCacheGb(model, contextK);
  const total = Math.round((quant.vramGb + kv) * 10) / 10;
  return `${quant.name} is ${quant.vramGb} GB (+${kv} GB @ ${contextK}k context = ${total} GB) · ${where} on ${card}${task ? ` · ${task}` : ""}`;
}

function scoreFit(model: Model, fit: FitKind, quant: Quant, headroomGb: number, prefer?: ModelTask): number {
  let s = model.quality * 0.55 + quant.quality * 0.2;
  if (fit === "gpu") s += 40;
  else if (fit === "hybrid") s += 12;
  else s -= 8;
  // Prefer filling the card, not recommending a 3B to a 4090.
  if (fit === "gpu") {
    const used = quant.vramGb;
    s += Math.min(18, used * 0.35);
    if (headroomGb > 20 && model.paramsB < 8) s -= 12;
  }
  if (prefer && model.tasks.includes(prefer)) s += 10;
  if (model.license.toLowerCase().includes("apache") || model.license === "MIT") s += 2;
  const recency = Date.parse(`${model.released}-01`) || 0;
  s += Math.max(0, (recency - Date.parse("2024-01-01")) / (1000 * 60 * 60 * 24 * 40));
  return s;
}

export function matchModels(specs: Specs, prefer?: ModelTask, contextK: number = 8): MatchResult {
  const fits: ModelFit[] = [];
  for (const model of MODELS) {
    const found = bestQuant(model, specs, contextK);
    if (!found) continue;
    const { quant, fit, headroomGb, kvCacheGb, weightsGb, totalNeededGb, tokPerSec, bandwidthGbS, busType, quantOptions } = found;
    fits.push({
      model,
      quant,
      fit,
      headroomGb,
      score: scoreFit(model, fit, quant, headroomGb, prefer),
      why: why(model, fit, quant, specs, contextK),
      speed: tokPerSec,
      tokPerSec,
      bandwidthGbS,
      busType,
      kvCacheGb,
      weightsGb,
      totalNeededGb,
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

  const blurb = gpuPicks
    ? `${gpuPicks} of ${picks.length} run fully in ${totalVramText} with ${contextK}k context. Bigger weights exist — they just do not fit.`
    : picks.length
      ? `Nothing here sits fully in VRAM at ${contextK}k context. These are the least-painful offload / CPU options.`
      : `This machine is below the floor for current open-weight LLMs at ${contextK}k context. Try a 3B Q4 on CPU, or add RAM.`;

  return { specs, picks, also, blurb, contextK };
}

export { TASK_LABEL };

