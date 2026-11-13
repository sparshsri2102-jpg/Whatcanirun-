import type { FitKind, Model, Quant, Specs } from "./types";

/**
 * Returns estimated memory bandwidth (GB/s) and compute capability (FP16 TFLOPS)
 * based on GPU / Unified SoC / CPU architecture.
 */
export function getHardwareBandwidth(specs: Specs): {
  bandwidthGbS: number;
  computeTflops: number;
  type: string;
} {
  const g = (specs.gpu || "").toLowerCase();
  const c = (specs.cpu || "").toLowerCase();
  const gpuCount = Math.max(1, specs.gpuCount || 1);

  // 1. Apple Silicon Unified Memory (M1–M5)
  if (specs.unified && (g.includes("apple") || c.includes("apple") || !g.includes("radeon") && !g.includes("gb10") && !g.includes("spark"))) {
    const isM5 = g.includes("m5") || c.includes("m5");
    const isM4 = g.includes("m4") || c.includes("m4");
    const isM3 = g.includes("m3") || c.includes("m3");
    if (g.includes("ultra") || c.includes("ultra")) {
      return {
        bandwidthGbS: isM5 ? 920 : isM4 ? 819 : 800,
        computeTflops: isM5 ? 95 : isM4 ? 72 : 54,
        type: `Apple Unified Memory (${isM5 ? "M5 Ultra" : isM4 ? "M4 Ultra" : isM3 ? "M3 Ultra" : "Ultra"})`,
      };
    }
    if (g.includes("max") || c.includes("max")) {
      return {
        bandwidthGbS: isM5 ? 614 : isM4 ? 546 : 400,
        computeTflops: isM5 ? 48 : isM4 ? 38 : 28,
        type: `Apple Unified Memory (${isM5 ? "M5 Max" : isM4 ? "M4 Max" : "Max"})`,
      };
    }
    if (g.includes("pro") || c.includes("pro")) {
      return {
        bandwidthGbS: isM5 ? 307 : isM4 ? 273 : 200,
        computeTflops: isM5 ? 24 : isM4 ? 18 : 14,
        type: `Apple Unified Memory (${isM5 ? "M5 Pro" : isM4 ? "M4 Pro" : "Pro"})`,
      };
    }
    return {
      bandwidthGbS: isM5 ? 153 : isM4 ? 120 : 100,
      computeTflops: isM5 ? 11 : isM4 ? 9 : 7,
      type: `Apple Unified Memory (${isM5 ? "M5" : isM4 ? "M4" : "Base"})`,
    };
  }

  // 2. Unified Desktop/Workstation APUs (AMD Strix Halo / NVIDIA DGX Spark GB10)
  if (g.includes("strix halo") || g.includes("8060s") || c.includes("ai max")) {
    return { bandwidthGbS: 256, computeTflops: 59, type: "AMD Strix Halo LPDDR5X-8000" };
  }
  if (g.includes("gb10") || g.includes("dgx spark") || g.includes("project digits")) {
    return { bandwidthGbS: 273, computeTflops: 120, type: "NVIDIA GB10 Grace Blackwell Unified" };
  }

  // 3. Data Center & Workstation GPUs
  if (g.includes("b200")) {
    return { bandwidthGbS: 8000 * gpuCount, computeTflops: 2250 * gpuCount, type: `${gpuCount}x B200 HBM3e` };
  }
  if (g.includes("h200")) {
    return { bandwidthGbS: 4800 * gpuCount, computeTflops: 989 * gpuCount, type: `${gpuCount}x H200 HBM3e` };
  }
  if (g.includes("h100")) {
    return { bandwidthGbS: 3350 * gpuCount, computeTflops: 989 * gpuCount, type: `${gpuCount}x H100 HBM3` };
  }
  if (g.includes("a100")) {
    return { bandwidthGbS: 1935 * gpuCount, computeTflops: 312 * gpuCount, type: `${gpuCount}x A100 HBM2e` };
  }
  if (g.includes("pro 6000") || g.includes("6000 blackwell")) {
    return { bandwidthGbS: 1792 * gpuCount, computeTflops: 500 * gpuCount, type: `${gpuCount}x RTX PRO 6000 GDDR7` };
  }
  if (g.includes("6000 ada") || g.includes("a6000") || g.includes("l40s")) {
    return { bandwidthGbS: 960 * gpuCount, computeTflops: 360 * gpuCount, type: `${gpuCount}x Ada/Ampere Workstation 48GB` };
  }

  // 4. Desktop NVIDIA RTX 50 / 40 / 30 Series
  if (g.includes("5090")) {
    return { bandwidthGbS: 1792 * gpuCount, computeTflops: 419 * gpuCount, type: `${gpuCount}x RTX 5090 GDDR7` };
  }
  if (g.includes("5080")) {
    return { bandwidthGbS: 960 * gpuCount, computeTflops: 225 * gpuCount, type: `${gpuCount}x RTX 5080 GDDR7` };
  }
  if (g.includes("5070 ti")) {
    return { bandwidthGbS: 896 * gpuCount, computeTflops: 176 * gpuCount, type: `${gpuCount}x RTX 5070 Ti GDDR7` };
  }
  if (g.includes("5070")) {
    return { bandwidthGbS: 672 * gpuCount, computeTflops: 123 * gpuCount, type: `${gpuCount}x RTX 5070 GDDR7` };
  }
  if (g.includes("5060")) {
    return { bandwidthGbS: 448 * gpuCount, computeTflops: 84 * gpuCount, type: `${gpuCount}x RTX 5060 Series GDDR7` };
  }
  if (g.includes("4090")) {
    return { bandwidthGbS: 1008 * gpuCount, computeTflops: 330 * gpuCount, type: `${gpuCount}x RTX 4090 GDDR6X` };
  }
  if (g.includes("3090")) {
    return { bandwidthGbS: 936 * gpuCount, computeTflops: 142 * gpuCount, type: `${gpuCount}x RTX 3090 GDDR6X` };
  }
  if (g.includes("4080")) {
    return { bandwidthGbS: 716 * gpuCount, computeTflops: 195 * gpuCount, type: `${gpuCount}x RTX 4080 GDDR6X` };
  }
  if (g.includes("3080")) {
    return { bandwidthGbS: 760 * gpuCount, computeTflops: 119 * gpuCount, type: `${gpuCount}x RTX 3080 GDDR6X` };
  }
  if (g.includes("4070") || g.includes("3070")) {
    return { bandwidthGbS: 504 * gpuCount, computeTflops: 116 * gpuCount, type: `${gpuCount}x RTX 4070/3070 GDDR6X` };
  }
  if (g.includes("4060") || g.includes("3060")) {
    return { bandwidthGbS: 360 * gpuCount, computeTflops: 60 * gpuCount, type: `${gpuCount}x RTX 3060/4060 GDDR6` };
  }

  // 5. AMD Radeon RX 9000 / 7000 & Intel Arc
  if (g.includes("9070 xt")) {
    return { bandwidthGbS: 640 * gpuCount, computeTflops: 195 * gpuCount, type: `${gpuCount}x RX 9070 XT GDDR6` };
  }
  if (g.includes("9070")) {
    return { bandwidthGbS: 640 * gpuCount, computeTflops: 145 * gpuCount, type: `${gpuCount}x RX 9070 GDDR6` };
  }
  if (g.includes("7900 xtx")) {
    return { bandwidthGbS: 960 * gpuCount, computeTflops: 123 * gpuCount, type: `${gpuCount}x RX 7900 XTX` };
  }
  if (g.includes("7900 xt")) {
    return { bandwidthGbS: 800 * gpuCount, computeTflops: 103 * gpuCount, type: `${gpuCount}x RX 7900 XT` };
  }
  if (g.includes("7800 xt")) {
    return { bandwidthGbS: 624 * gpuCount, computeTflops: 74 * gpuCount, type: `${gpuCount}x RX 7800 XT` };
  }
  if (g.includes("b580") || g.includes("b570")) {
    return { bandwidthGbS: 456 * gpuCount, computeTflops: 90 * gpuCount, type: `${gpuCount}x Intel Arc Battlemage` };
  }
  if (g.includes("a770")) {
    return { bandwidthGbS: 560 * gpuCount, computeTflops: 65 * gpuCount, type: `${gpuCount}x Intel Arc A770` };
  }

  // 6. Generic Discrete GPU with VRAM
  if (specs.vramGb >= 48) {
    return { bandwidthGbS: 1200 * gpuCount, computeTflops: 350 * gpuCount, type: `${gpuCount}x Workstation VRAM ${specs.vramGb}GB` };
  }
  if (specs.vramGb >= 24) {
    return { bandwidthGbS: 900 * gpuCount, computeTflops: 180 * gpuCount, type: `${gpuCount}x Discrete VRAM 24GB+` };
  }
  if (specs.vramGb >= 16) {
    return { bandwidthGbS: 550 * gpuCount, computeTflops: 110 * gpuCount, type: `${gpuCount}x Discrete VRAM 16GB` };
  }
  if (specs.vramGb >= 8) {
    return { bandwidthGbS: 300 * gpuCount, computeTflops: 50 * gpuCount, type: `${gpuCount}x Discrete VRAM 8GB` };
  }

  // 7. System RAM DDR5 / DDR4 Fallback
  const isDdr5 =
    c.includes("ryzen 7") ||
    c.includes("ryzen 9") ||
    c.includes("13th") ||
    c.includes("14th") ||
    c.includes("core ultra") ||
    c.includes("epyc");
  if (isDdr5) {
    return { bandwidthGbS: 80, computeTflops: 4, type: "Dual-Channel DDR5 System RAM" };
  }
  return { bandwidthGbS: 45, computeTflops: 2, type: "Dual-Channel DDR4 System RAM" };
}

/**
 * Returns active parameters in Billions for inference throughput calculation.
 * For MoE models where `totalParamsB` is defined, `model.paramsB` already stores active params.
 */
export function getActiveParamsB(model: Model): number {
  if (model.moe && model.totalParamsB) {
    return model.paramsB;
  }
  if (model.id.includes("deepseek-r1") && !model.id.includes("distill") && model.paramsB > 100) {
    return 37;
  }
  return model.paramsB;
}

/**
 * Estimates autoregressive generation speed (tok/s) and prefill throughput / TTFT
 * based on memory bandwidth, active weight footprint per token, and offload tier.
 */
export function estimateTokensPerSec(
  model: Model,
  quant: Quant,
  fit: FitKind,
  specs: Specs,
): {
  tokPerSecMin: number;
  tokPerSecMax: number;
  tokPerSecLabel: string;
  prefillTokS: number;
  ttftMs: number;
  bandwidthGbS: number;
  busType: string;
} {
  const hw = getHardwareBandwidth(specs);
  const activeParams = getActiveParamsB(model);

  let bytesPerParam = 0.56;
  if (quant.name === "IQ2") bytesPerParam = 0.32;
  else if (quant.name === "Q3") bytesPerParam = 0.44;
  else if (quant.name === "Q4") bytesPerParam = 0.56;
  else if (quant.name === "Q5") bytesPerParam = 0.68;
  else if (quant.name === "Q8") bytesPerParam = 1.05;
  else if (quant.name === "FP8") bytesPerParam = 1.0;
  else if (quant.name === "FP16") bytesPerParam = 2.0;

  const activeGbPerToken = Math.max(0.55, activeParams * bytesPerParam);

  let effectiveBandwidth = hw.bandwidthGbS;
  let efficiency = 0.68;

  if (fit === "gpu") {
    effectiveBandwidth = hw.bandwidthGbS;
    if (specs.unified) {
      efficiency = 0.64;
    }
  } else if (fit === "hybrid") {
    effectiveBandwidth = 45;
    efficiency = 0.50;
  } else if (fit === "cpu") {
    effectiveBandwidth = Math.min(72, hw.bandwidthGbS);
    efficiency = 0.46;
  } else {
    return {
      tokPerSecMin: 0,
      tokPerSecMax: 0,
      tokPerSecLabel: "0 tok/s (exceeds memory)",
      prefillTokS: 0,
      ttftMs: 0,
      bandwidthGbS: hw.bandwidthGbS,
      busType: hw.type,
    };
  }

  const baseTokS = (effectiveBandwidth * efficiency) / activeGbPerToken;

  let minTok = Math.max(1, Math.round(baseTokS * 0.85));
  let maxTok = Math.max(1, Math.round(baseTokS * 1.15));

  if (fit === "gpu") {
    if (specs.gpuCount > 1) {
      minTok = Math.round(minTok * 0.92);
      maxTok = Math.round(maxTok * 0.95);
    }
  } else if (fit === "hybrid") {
    minTok = Math.min(20, Math.max(3, minTok));
    maxTok = Math.min(30, Math.max(6, maxTok));
  } else if (fit === "cpu") {
    minTok = Math.min(10, Math.max(1, minTok));
    maxTok = Math.min(16, Math.max(2, maxTok));
  }

  // Prefill speed (compute-bound: ~ 2 * activeParams FLOPs per token)
  const effectiveTflops = fit === "gpu" ? hw.computeTflops * 0.45 : fit === "hybrid" ? Math.max(8, hw.computeTflops * 0.15) : 3.5;
  const prefillTokS = Math.max(
    15,
    Math.round((effectiveTflops * 1000) / Math.max(2, 2 * activeParams)),
  );
  // Estimated Time-To-First-Token for a standard 1,024-token prompt (ms)
  const ttftMs = Math.max(25, Math.round((1024 / prefillTokS) * 1000));

  let tokPerSecLabel = `~${minTok}–${maxTok} tok/s`;
  if (minTok >= 100) {
    tokPerSecLabel = `~${minTok}+ tok/s`;
  } else if (fit === "hybrid") {
    tokPerSecLabel = `~${minTok}–${maxTok} tok/s (RAM offload)`;
  } else if (fit === "cpu") {
    tokPerSecLabel = `~${minTok}–${maxTok} tok/s (CPU)`;
  }

  return {
    tokPerSecMin: minTok,
    tokPerSecMax: maxTok,
    tokPerSecLabel,
    prefillTokS,
    ttftMs,
    bandwidthGbS: hw.bandwidthGbS,
    busType: hw.type,
  };
}
