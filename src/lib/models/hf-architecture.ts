import type { FitKind, KvQuant, Specs } from "./types";
import { getHardwareBandwidth } from "./bandwidth";
import { getMemoryPools } from "./match";

export type WorkloadMode = "inference" | "qlora" | "lora";

export type PrecisionFormat =
  | "IQ2_XS"
  | "Q3_K_M"
  | "Q4_K_M"
  | "EXL2_4.5"
  | "Q5_K_M"
  | "Q6_K"
  | "Q8_0"
  | "FP8"
  | "BF16";

export const PRECISION_SPECS: Record<
  PrecisionFormat,
  { label: string; bpw: number; quality: number; family: string }
> = {
  IQ2_XS: { label: "IQ2_XS (2.3 bpw)", bpw: 2.35, quality: 58, family: "GGUF" },
  Q3_K_M: { label: "Q3_K_M (3.4 bpw)", bpw: 3.45, quality: 74, family: "GGUF" },
  Q4_K_M: { label: "Q4_K_M (4.8 bpw)", bpw: 4.85, quality: 88, family: "GGUF" },
  "EXL2_4.5": { label: "EXL2 4.5bpw", bpw: 4.5, quality: 87, family: "EXL2" },
  Q5_K_M: { label: "Q5_K_M (5.7 bpw)", bpw: 5.7, quality: 94, family: "GGUF" },
  Q6_K: { label: "Q6_K (6.6 bpw)", bpw: 6.6, quality: 97, family: "GGUF" },
  Q8_0: { label: "Q8_0 (8.5 bpw)", bpw: 8.5, quality: 99, family: "GGUF" },
  FP8: { label: "FP8 / E4M3 (8.0 bpw)", bpw: 8.0, quality: 99, family: "vLLM/TensorRT" },
  BF16: { label: "BF16 / FP16 (16.0 bpw)", bpw: 16.0, quality: 100, family: "Safetensors" },
};

export type HfArchitecture = {
  repoId: string;
  modelType: string;
  totalParamsB: number;
  activeParamsB: number;
  numHiddenLayers: number;
  hiddenSize: number;
  numAttentionHeads: number;
  numKeyValueHeads: number;
  headDim: number;
  intermediateSize: number;
  vocabSize: number;
  maxPositionEmbeddings: number;
  isMoe: boolean;
  numExperts: number;
  expertsPerTok: number;
  isMla: boolean;
  kvLoraRank?: number;
  source: "hf-live" | "preset-fallback" | "manual";
};

export type CloudGpuTier = {
  name: string;
  vramGb: number;
  hourlyUsd: number;
  bandwidthGbS: number;
  providerHint: string;
};

export const CLOUD_GPU_TIERS: CloudGpuTier[] = [
  { name: "1x NVIDIA L4 24GB", vramGb: 24, hourlyUsd: 0.44, bandwidthGbS: 300, providerHint: "RunPod / Modal" },
  { name: "1x RTX 4090 24GB", vramGb: 24, hourlyUsd: 0.34, bandwidthGbS: 1008, providerHint: "RunPod / Vast" },
  { name: "1x A40 48GB", vramGb: 48, hourlyUsd: 0.49, bandwidthGbS: 696, providerHint: "RunPod / Lambda" },
  { name: "1x A100 SXM 80GB", vramGb: 80, hourlyUsd: 1.39, bandwidthGbS: 2039, providerHint: "Lambda / Modal" },
  { name: "1x H100 SXM 80GB", vramGb: 80, hourlyUsd: 1.99, bandwidthGbS: 3350, providerHint: "Lambda / Spheron" },
  { name: "2x H100 SXM (160GB)", vramGb: 160, hourlyUsd: 3.98, bandwidthGbS: 6700, providerHint: "Multi-GPU Node" },
  { name: "4x H100 SXM (320GB)", vramGb: 320, hourlyUsd: 7.96, bandwidthGbS: 13400, providerHint: "Cluster Node" },
  { name: "8x H100 SXM (640GB)", vramGb: 640, hourlyUsd: 15.92, bandwidthGbS: 26800, providerHint: "8xHGX Node" },
];

export type ArchitectureBreakdown = {
  weightsGb: number;
  kvCacheGb: number;
  runtimeOverheadGb: number;
  trainingStateGb: number;
  totalMemoryGb: number;
  gpuAllocatedGb: number;
  ramOffloadedGb: number;
  offloadedLayers: number;
  gpuLayers: number;
  fit: FitKind;
  headroomGb: number;
  maxSafeContextK: number;
  tokPerSecMin: number;
  tokPerSecMax: number;
  prefillTokS: number;
  ttftMs: number;
  cloudFallback: CloudGpuTier | null;
};

const KV_QUANT_BYTES: Record<KvQuant, number> = {
  fp16: 2.0,
  q8_0: 1.08,
  q4_0: 0.56,
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Parses a standard Hugging Face config.json into normalized transformer geometry.
 */
export function parseHfConfigJson(
  repoId: string,
  rawConfig: Record<string, unknown>,
  safetensorsTotalBytes?: number,
): HfArchitecture {
  const cfg = (rawConfig.text_config && typeof rawConfig.text_config === "object"
    ? (rawConfig.text_config as Record<string, unknown>)
    : rawConfig) as Record<string, unknown>;

  const numHiddenLayers = Number(cfg.num_hidden_layers || cfg.n_layer || 32);
  const hiddenSize = Number(cfg.hidden_size || cfg.n_embd || cfg.d_model || 4096);
  const numAttentionHeads = Number(cfg.num_attention_heads || cfg.n_head || 32);
  const numKeyValueHeads = Number(
    cfg.num_key_value_heads || cfg.num_kv_heads || cfg.n_head_kv || numAttentionHeads,
  );
  const headDim = Number(
    cfg.head_dim || Math.max(64, Math.round(hiddenSize / Math.max(1, numAttentionHeads))),
  );
  const intermediateSize = Number(
    cfg.intermediate_size || cfg.n_inner || Math.round(hiddenSize * 3.5),
  );
  const vocabSize = Number(cfg.vocab_size || 128256);
  const maxPositionEmbeddings = Number(
    cfg.max_position_embeddings || cfg.n_positions || cfg.seq_length || 32768,
  );

  const numExperts = Number(
    cfg.num_local_experts || cfg.n_routed_experts || cfg.num_experts || 1,
  );
  const expertsPerTok = Number(
    cfg.num_experts_per_tok || cfg.num_selected_experts || cfg.moe_top_k || 1,
  );
  const isMoe = numExperts > 1;
  const kvLoraRank = cfg.kv_lora_rank ? Number(cfg.kv_lora_rank) : undefined;
  const isMla = Boolean(kvLoraRank && kvLoraRank > 0);

  let totalParamsB = 0;
  if (safetensorsTotalBytes && safetensorsTotalBytes > 0) {
    // BF16 weights ≈ 2 bytes/param
    totalParamsB = round1(safetensorsTotalBytes / 2e9);
  } else {
    // Exact parameter formula from transformer dimensions
    const embedParams = vocabSize * hiddenSize * (cfg.tie_word_embeddings ? 1 : 2);
    const attnParamsPerLayer =
      hiddenSize * (numAttentionHeads * headDim) +
      2 * hiddenSize * (numKeyValueHeads * headDim) +
      (numAttentionHeads * headDim) * hiddenSize;
    const moeExpertSize = Number(cfg.moe_intermediate_size || intermediateSize);
    const ffnParamsPerLayer = isMoe
      ? numExperts * (3 * hiddenSize * moeExpertSize)
      : 3 * hiddenSize * intermediateSize;
    const totalParams = embedParams + numHiddenLayers * (attnParamsPerLayer + ffnParamsPerLayer);
    totalParamsB = Math.max(0.5, round1(totalParams / 1e9));
  }

  let activeParamsB = totalParamsB;
  if (isMoe) {
    const activeRatio = Math.min(1, Math.max(0.08, (expertsPerTok + 1) / Math.max(2, numExperts)));
    activeParamsB = Math.max(1.5, round1(totalParamsB * activeRatio));
  }

  return {
    repoId,
    modelType: String(cfg.model_type || rawConfig.model_type || "transformer"),
    totalParamsB,
    activeParamsB,
    numHiddenLayers,
    hiddenSize,
    numAttentionHeads,
    numKeyValueHeads,
    headDim,
    intermediateSize,
    vocabSize,
    maxPositionEmbeddings,
    isMoe,
    numExperts,
    expertsPerTok,
    isMla,
    kvLoraRank,
    source: "hf-live",
  };
}

/**
 * Exact bytes-per-token KV cache calculation using GQA or DeepSeek MLA geometry.
 */
export function calcExactArchitectureKvGb(
  arch: HfArchitecture,
  contextK: number,
  kvQuant: KvQuant,
  batchSize: number = 1,
): number {
  if (contextK <= 0) return 0;
  const tokens = contextK * 1024;
  const kvBytes = KV_QUANT_BYTES[kvQuant] ?? 2.0;

  let bytesPerTokenPerLayer: number;
  if (arch.isMla && arch.kvLoraRank) {
    // MLA stores compressed latent vector + rope dim per layer instead of full K+V heads
    bytesPerTokenPerLayer = (arch.kvLoraRank + 64) * kvBytes;
  } else {
    // Standard GQA/MHA: 2 (K & V) * num_key_value_heads * head_dim * bytes
    bytesPerTokenPerLayer = 2 * arch.numKeyValueHeads * arch.headDim * kvBytes;
  }

  const totalBytes = bytesPerTokenPerLayer * arch.numHiddenLayers * tokens * Math.max(1, batchSize);
  return round1(totalBytes / 1024 ** 3);
}

/**
 * Finds the cheapest Cloud GPU node that fits totalMemoryGb in pure VRAM.
 */
export function recommendCloudGpu(totalMemoryGb: number): CloudGpuTier {
  const match = CLOUD_GPU_TIERS.find((tier) => tier.vramGb * 0.92 >= totalMemoryGb);
  return match || CLOUD_GPU_TIERS[CLOUD_GPU_TIERS.length - 1];
}

/**
 * Evaluates full memory footprint, max VRAM-safe context, layer offload, and throughput
 * across inference, QLoRA fine-tuning, and full LoRA fine-tuning modes.
 */
export function evaluateHfArchitecture(
  arch: HfArchitecture,
  specs: Specs,
  opts: {
    precision: PrecisionFormat;
    contextK: number;
    kvQuant: KvQuant;
    batchSize: number;
    workload: WorkloadMode;
    gpuLayerRatio?: number; // 0..1 (defaults to max possible on GPU)
  },
): ArchitectureBreakdown {
  const { precision, contextK, kvQuant, batchSize, workload } = opts;
  const prec = PRECISION_SPECS[precision];
  const pools = getMemoryPools(specs);

  // 1. Model weights in GB
  const weightsGb = round1((arch.totalParamsB * prec.bpw) / 8);

  // 2. Exact KV cache in GB (inference uses requested batchSize; training does not keep generation KV)
  const kvCacheGb =
    workload === "inference"
      ? calcExactArchitectureKvGb(arch, contextK, kvQuant, batchSize)
      : 0;

  // 3. CUDA/Metal runtime buffer & scratchpad activations
  const runtimeOverheadGb = round1(
    Math.min(3.5, Math.max(0.45, 0.35 + arch.activeParamsB * 0.035 + (batchSize - 1) * 0.12)),
  );

  // 4. Training state (LoRA weights + AdamW 8-bit/32-bit moments + gradients + activations)
  let trainingStateGb = 0;
  let effectiveWeightsGb = weightsGb;
  if (workload === "qlora") {
    // QLoRA enforces 4-bit NF4 base weights (~0.55 B/param) + LoRA adapters + activations + optimizer
    effectiveWeightsGb = round1(arch.totalParamsB * 0.55);
    const trainableParamsB = Math.max(0.02, arch.totalParamsB * 0.018);
    const optimizerAndGrads = trainableParamsB * 12; // fp32 master + m + v + grads
    const activationFootprint = round1(
      (contextK / 4) * Math.max(1, batchSize) * (arch.numHiddenLayers * arch.hiddenSize) / 1e8 * 1.4,
    );
    trainingStateGb = round1(optimizerAndGrads + Math.max(0.9, activationFootprint));
  } else if (workload === "lora") {
    // LoRA keeps BF16/FP16 base weights + adapter optimizer + larger activation cache
    effectiveWeightsGb = round1(arch.totalParamsB * 2.0);
    const trainableParamsB = Math.max(0.02, arch.totalParamsB * 0.02);
    const optimizerAndGrads = trainableParamsB * 14;
    const activationFootprint = round1(
      (contextK / 4) * Math.max(1, batchSize) * (arch.numHiddenLayers * arch.hiddenSize) / 1e8 * 2.2,
    );
    trainingStateGb = round1(optimizerAndGrads + Math.max(1.4, activationFootprint));
  }

  const totalMemoryGb = round1(effectiveWeightsGb + kvCacheGb + runtimeOverheadGb + trainingStateGb);

  // 5. Layer offload calculations
  const layerRatio =
    typeof opts.gpuLayerRatio === "number"
      ? Math.max(0, Math.min(1, opts.gpuLayerRatio))
      : pools.gpu >= totalMemoryGb
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (pools.gpu - kvCacheGb - runtimeOverheadGb - trainingStateGb) / Math.max(0.1, effectiveWeightsGb),
            ),
          );

  const gpuLayers = Math.round(arch.numHiddenLayers * layerRatio);
  const offloadedLayers = arch.numHiddenLayers - gpuLayers;

  const gpuAllocatedGb = round1(
    Math.min(
      pools.gpu,
      effectiveWeightsGb * (gpuLayers / Math.max(1, arch.numHiddenLayers)) +
        kvCacheGb +
        runtimeOverheadGb +
        trainingStateGb,
    ),
  );
  const ramOffloadedGb = round1(Math.max(0, totalMemoryGb - gpuAllocatedGb));

  let fit: FitKind = "no";
  let headroomGb = 0;

  if (workload !== "inference") {
    // QLoRA / LoRA training requires full VRAM residency; RAM spill causes thrashing/OOM
    if (totalMemoryGb <= pools.gpu) {
      fit = "gpu";
      headroomGb = round1(pools.gpu - totalMemoryGb);
    } else {
      fit = "no";
      headroomGb = round1(pools.gpu - totalMemoryGb);
    }
  } else if (offloadedLayers === 0 && totalMemoryGb <= pools.gpu) {
    fit = "gpu";
    headroomGb = round1(pools.gpu - totalMemoryGb);
  } else if (gpuLayers > 0 && ramOffloadedGb <= Math.max(0, pools.hybrid - pools.gpu)) {
    fit = "hybrid";
    headroomGb = round1(pools.hybrid - totalMemoryGb);
  } else if (totalMemoryGb <= pools.cpu) {
    fit = "cpu";
    headroomGb = round1(pools.cpu - totalMemoryGb);
  } else {
    fit = "no";
    headroomGb = round1(pools.gpu - totalMemoryGb);
  }

  // 6. Compute exact max VRAM-native context (with current batch & precision)
  const kvPer1kGb = Math.max(0.001, calcExactArchitectureKvGb(arch, 1, kvQuant, batchSize));
  const freeVramForKv = pools.gpu - effectiveWeightsGb - runtimeOverheadGb - trainingStateGb;
  const maxSafeContextK =
    freeVramForKv <= 0
      ? 0
      : Math.min(
          Math.round(arch.maxPositionEmbeddings / 1024),
          Math.floor(freeVramForKv / kvPer1kGb),
        );

  // 7. Bandwidth-grounded throughput estimate
  const hwBw = getHardwareBandwidth(specs);
  const activeWeightGb = (arch.activeParamsB * prec.bpw) / 8;
  const gpuFrac = gpuLayers / Math.max(1, arch.numHiddenLayers);
  const effBw =
    fit === "gpu"
      ? hwBw.bandwidthGbS * 0.72
      : fit === "hybrid"
        ? Math.max(22, hwBw.bandwidthGbS * 0.28 * gpuFrac + 34 * (1 - gpuFrac))
        : 32;

  const batchPenalty = batchSize > 1 ? 1 / (1 + Math.log2(batchSize) * 0.35) : 1;
  const rawTokS = (effBw / Math.max(0.4, activeWeightGb)) * batchPenalty;
  const tokPerSecMin = Math.max(1, Math.round(rawTokS * 0.85));
  const tokPerSecMax = Math.max(tokPerSecMin + 1, Math.round(rawTokS * 1.15));

  const prefillFactor = fit === "gpu" ? 13 : fit === "hybrid" ? 4.2 : 1.8;
  const prefillTokS = Math.max(20, Math.round((effBw * prefillFactor) / Math.max(0.8, arch.activeParamsB)));
  const ttftMs = Math.max(30, Math.round((1000 / prefillTokS) * 1000));

  const cloudFallback = fit === "gpu" ? null : recommendCloudGpu(totalMemoryGb);

  return {
    weightsGb: effectiveWeightsGb,
    kvCacheGb,
    runtimeOverheadGb,
    trainingStateGb,
    totalMemoryGb,
    gpuAllocatedGb,
    ramOffloadedGb,
    offloadedLayers,
    gpuLayers,
    fit,
    headroomGb,
    maxSafeContextK,
    tokPerSecMin,
    tokPerSecMax,
    prefillTokS,
    ttftMs,
    cloudFallback,
  };
}

/**
 * Curated fallback architectures for offline/rate-limited environments or 1-click demos.
 */
export const KNOWN_HF_ARCHITECTURES: Record<string, HfArchitecture> = {
  "Qwen/Qwen3-32B": {
    repoId: "Qwen/Qwen3-32B",
    modelType: "qwen3",
    totalParamsB: 32.8,
    activeParamsB: 32.8,
    numHiddenLayers: 64,
    hiddenSize: 5120,
    numAttentionHeads: 64,
    numKeyValueHeads: 8,
    headDim: 128,
    intermediateSize: 25600,
    vocabSize: 151936,
    maxPositionEmbeddings: 131072,
    isMoe: false,
    numExperts: 1,
    expertsPerTok: 1,
    isMla: false,
    source: "preset-fallback",
  },
  "Qwen/Qwen3-30B-A3B": {
    repoId: "Qwen/Qwen3-30B-A3B",
    modelType: "qwen3_moe",
    totalParamsB: 30.5,
    activeParamsB: 3.3,
    numHiddenLayers: 48,
    hiddenSize: 2048,
    numAttentionHeads: 32,
    numKeyValueHeads: 4,
    headDim: 128,
    intermediateSize: 6144,
    vocabSize: 151936,
    maxPositionEmbeddings: 131072,
    isMoe: true,
    numExperts: 128,
    expertsPerTok: 8,
    isMla: false,
    source: "preset-fallback",
  },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": {
    repoId: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    modelType: "qwen2",
    totalParamsB: 14.8,
    activeParamsB: 14.8,
    numHiddenLayers: 48,
    hiddenSize: 5120,
    numAttentionHeads: 40,
    numKeyValueHeads: 8,
    headDim: 128,
    intermediateSize: 13824,
    vocabSize: 152064,
    maxPositionEmbeddings: 131072,
    isMoe: false,
    numExperts: 1,
    expertsPerTok: 1,
    isMla: false,
    source: "preset-fallback",
  },
  "meta-llama/Llama-3.3-70B-Instruct": {
    repoId: "meta-llama/Llama-3.3-70B-Instruct",
    modelType: "llama",
    totalParamsB: 70.6,
    activeParamsB: 70.6,
    numHiddenLayers: 80,
    hiddenSize: 8192,
    numAttentionHeads: 64,
    numKeyValueHeads: 8,
    headDim: 128,
    intermediateSize: 28672,
    vocabSize: 128256,
    maxPositionEmbeddings: 131072,
    isMoe: false,
    numExperts: 1,
    expertsPerTok: 1,
    isMla: false,
    source: "preset-fallback",
  },
  "deepseek-ai/DeepSeek-R1": {
    repoId: "deepseek-ai/DeepSeek-R1",
    modelType: "deepseek_v3",
    totalParamsB: 671,
    activeParamsB: 37,
    numHiddenLayers: 61,
    hiddenSize: 7168,
    numAttentionHeads: 128,
    numKeyValueHeads: 128,
    headDim: 128,
    intermediateSize: 18432,
    vocabSize: 129280,
    maxPositionEmbeddings: 163840,
    isMoe: true,
    numExperts: 256,
    expertsPerTok: 8,
    isMla: true,
    kvLoraRank: 512,
    source: "preset-fallback",
  },
};
