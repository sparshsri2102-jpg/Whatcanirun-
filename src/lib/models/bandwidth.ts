import type { FitKind, Model, Quant, Specs } from "./types";

/**
 * Returns estimated memory bandwidth in GB/s based on GPU / CPU architecture.
 */
export function getHardwareBandwidth(specs: Specs): {
  bandwidthGbS: number;
  type: string;
} {
  const g = (specs.gpu || "").toLowerCase();
  const c = (specs.cpu || "").toLowerCase();
  const gpuCount = Math.max(1, specs.gpuCount || 1);

  // 1. Apple Silicon Unified Memory
  if (specs.unified || g.includes("apple") || c.includes("apple")) {
    if (g.includes("ultra") || c.includes("ultra")) {
      return { bandwidthGbS: 800, type: "Apple Unified Memory (Ultra)" };
    }
    if (g.includes("max") || c.includes("max")) {
      return { bandwidthGbS: 400, type: "Apple Unified Memory (Max)" };
    }
    if (g.includes("pro") || c.includes("pro")) {
      return { bandwidthGbS: 150, type: "Apple Unified Memory (Pro)" };
    }
    return { bandwidthGbS: 100, type: "Apple Unified Memory (Base)" };
  }

  // 2. High-End Data Center GPUs
  if (g.includes("h100") || g.includes("h200")) {
    return { bandwidthGbS: 3350 * gpuCount, type: `${gpuCount}x H100/H200 HBM3` };
  }
  if (g.includes("a100")) {
    return { bandwidthGbS: 1935 * gpuCount, type: `${gpuCount}x A100 80GB HBM2e` };
  }

  // 3. Desktop Nvidia RTX 50 & 40 Series
  if (g.includes("5090")) {
    return { bandwidthGbS: 1792 * gpuCount, type: `${gpuCount}x RTX 5090 GDDR7` };
  }
  if (g.includes("5080")) {
    return { bandwidthGbS: 1000 * gpuCount, type: `${gpuCount}x RTX 5080 GDDR7` };
  }
  if (g.includes("4090")) {
    return { bandwidthGbS: 1008 * gpuCount, type: `${gpuCount}x RTX 4090 GDDR6X` };
  }
  if (g.includes("3090")) {
    return { bandwidthGbS: 936 * gpuCount, type: `${gpuCount}x RTX 3090 GDDR6X` };
  }
  if (g.includes("4080")) {
    return { bandwidthGbS: 716 * gpuCount, type: `${gpuCount}x RTX 4080 GDDR6X` };
  }
  if (g.includes("3080")) {
    return { bandwidthGbS: 760 * gpuCount, type: `${gpuCount}x RTX 3080 GDDR6X` };
  }
  if (g.includes("4070") || g.includes("3070")) {
    return { bandwidthGbS: 504 * gpuCount, type: `${gpuCount}x RTX 4070/3070 GDDR6X` };
  }
  if (g.includes("4060") || g.includes("3060")) {
    return { bandwidthGbS: 288 * gpuCount, type: `${gpuCount}x RTX 3060/4060 GDDR6` };
  }

  // 4. AMD Radeon RX Series
  if (g.includes("7900 xtx")) {
    return { bandwidthGbS: 960 * gpuCount, type: `${gpuCount}x RX 7900 XTX` };
  }
  if (g.includes("7900 xt")) {
    return { bandwidthGbS: 800 * gpuCount, type: `${gpuCount}x RX 7900 XT` };
  }
  if (g.includes("7800 xt")) {
    return { bandwidthGbS: 624 * gpuCount, type: `${gpuCount}x RX 7800 XT` };
  }

  // 5. Generic Discrete GPU with VRAM
  if (specs.vramGb >= 24) {
    return { bandwidthGbS: 900 * gpuCount, type: `${gpuCount}x Discrete VRAM 24GB+` };
  }
  if (specs.vramGb >= 16) {
    return { bandwidthGbS: 550 * gpuCount, type: `${gpuCount}x Discrete VRAM 16GB` };
  }
  if (specs.vramGb >= 8) {
    return { bandwidthGbS: 300 * gpuCount, type: `${gpuCount}x Discrete VRAM 8GB` };
  }

  // 6. System RAM DDR5 / DDR4 Fallback
  const isDdr5 = c.includes("ryzen 7") || c.includes("ryzen 9") || c.includes("13th") || c.includes("14th") || c.includes("core ultra");
  if (isDdr5) {
    return { bandwidthGbS: 75, type: "Dual-Channel DDR5 System RAM" };
  }
  return { bandwidthGbS: 45, type: "Dual-Channel DDR4 System RAM" };
}

/**
 * Calculates estimated active parameters in Billions for inference.
 * For dense models, activeParams = paramsB.
 * For MoE models (DeepSeek V3/R1, Mixtral, Qwen MoE), activeParams is significantly lower.
 */
export function getActiveParamsB(model: Model): number {
  if (model.id.includes("deepseek-r1") || model.id.includes("deepseek-v3")) {
    return 37; // 37B active parameters out of 671B total
  }
  if (model.id.includes("mixtral-8x7b") || model.name.toLowerCase().includes("8x7b")) {
    return 12.8; // 2 experts active out of 8
  }
  if (model.id.includes("mixtral-8x22b") || model.name.toLowerCase().includes("8x22b")) {
    return 39;
  }
  if (model.id.includes("qwen") && model.moe) {
    return Math.max(3, Math.round(model.paramsB * 0.25));
  }
  return model.paramsB;
}

/**
 * Accurately estimates autoregressive token generation speed (tok/s)
 * based on memory bandwidth, weight footprint per token, and device offload mode.
 */
export function estimateTokensPerSec(
  model: Model,
  quant: Quant,
  fit: FitKind,
  specs: Specs
): {
  tokPerSecMin: number;
  tokPerSecMax: number;
  tokPerSecLabel: string;
  bandwidthGbS: number;
  busType: string;
} {
  const hw = getHardwareBandwidth(specs);
  const activeParams = getActiveParamsB(model);

  // Bytes per parameter for the given quant:
  // Q4 ~ 0.55 bytes/param, Q8 ~ 1.05 bytes/param, FP16 ~ 2.0 bytes/param
  let bytesPerParam = 0.55;
  if (quant.name === "IQ2") bytesPerParam = 0.32;
  else if (quant.name === "Q3") bytesPerParam = 0.44;
  else if (quant.name === "Q4") bytesPerParam = 0.56;
  else if (quant.name === "Q5") bytesPerParam = 0.68;
  else if (quant.name === "Q8") bytesPerParam = 1.05;
  else if (quant.name === "FP8") bytesPerParam = 1.0;
  else if (quant.name === "FP16") bytesPerParam = 2.0;

  // Active memory read required per output token in GB:
  const activeGbPerToken = Math.max(0.8, (activeParams * bytesPerParam));

  let effectiveBandwidth = hw.bandwidthGbS;
  let efficiency = 0.68; // Real-world GPU kernel efficiency factor (~65-72% of peak theoretical)

  if (fit === "gpu") {
    effectiveBandwidth = hw.bandwidthGbS;
    if (specs.unified) {
      efficiency = 0.62;
    }
  } else if (fit === "hybrid") {
    // Hybrid is bottlenecked by PCIe 4.0 bus transfers (~22-26 GB/s usable) + CPU RAM bandwidth
    effectiveBandwidth = 45;
    efficiency = 0.50;
  } else if (fit === "cpu") {
    // Pure CPU memory streaming
    effectiveBandwidth = Math.min(65, hw.bandwidthGbS);
    efficiency = 0.45;
  } else {
    return {
      tokPerSecMin: 0,
      tokPerSecMax: 0,
      tokPerSecLabel: "0 tok/s (exceeds memory)",
      bandwidthGbS: hw.bandwidthGbS,
      busType: hw.type,
    };
  }

  // Theoretical tok/s = (effectiveBandwidth * efficiency) / activeGbPerToken
  const baseTokS = (effectiveBandwidth * efficiency) / activeGbPerToken;

  let minTok = Math.max(1, Math.round(baseTokS * 0.85));
  let maxTok = Math.max(1, Math.round(baseTokS * 1.15));

  // Cap based on typical single-thread execution ceilings
  if (fit === "gpu") {
    if (specs.gpuCount > 1) {
      // Tensor parallel has slight communication synchronization penalty
      minTok = Math.round(minTok * 0.92);
      maxTok = Math.round(maxTok * 0.95);
    }
  } else if (fit === "hybrid") {
    minTok = Math.min(18, Math.max(3, minTok));
    maxTok = Math.min(28, Math.max(6, maxTok));
  } else if (fit === "cpu") {
    minTok = Math.min(8, Math.max(1, minTok));
    maxTok = Math.min(14, Math.max(2, maxTok));
  }

  let tokPerSecLabel = `~${minTok}–${maxTok} tok/s`;
  if (minTok >= 100) {
    tokPerSecLabel = `~${minTok}+ tok/s (blazing)`;
  } else if (fit === "hybrid") {
    tokPerSecLabel = `~${minTok}–${maxTok} tok/s (RAM offload)`;
  } else if (fit === "cpu") {
    tokPerSecLabel = `~${minTok}–${maxTok} tok/s (CPU bound)`;
  }

  return {
    tokPerSecMin: minTok,
    tokPerSecMax: maxTok,
    tokPerSecLabel,
    bandwidthGbS: hw.bandwidthGbS,
    busType: hw.type,
  };
}
