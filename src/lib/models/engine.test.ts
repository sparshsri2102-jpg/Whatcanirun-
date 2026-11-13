import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSpecsHeuristic } from "./parse-specs.ts";
import { getHardwareBandwidth, estimateTokensPerSec, getActiveParamsB } from "./bandwidth.ts";
import { calcKvCacheGb, calcMaxSafeContextK, matchModels } from "./match.ts";
import { evaluateLocalStack, compareRigs } from "./stack.ts";
import {
  calcExactArchitectureKvGb,
  evaluateHfArchitecture,
  KNOWN_HF_ARCHITECTURES,
  parseHfConfigJson,
} from "./hf-architecture.ts";
import { getModel } from "./catalog.ts";
import type { Specs } from "./types.ts";

describe("parseSpecsHeuristic", () => {
  it("parses NVIDIA RTX PRO 6000 Blackwell and RTX 50-series GPUs", () => {
    const pro6000 = parseSpecsHeuristic("GPU: NVIDIA RTX PRO 6000 Blackwell, 128 GB RAM, Linux");
    assert.ok(pro6000);
    assert.equal(pro6000.vramGb, 96);
    assert.equal(pro6000.ramGb, 128);
    assert.equal(pro6000.os, "Linux");

    const rtx5080 = parseSpecsHeuristic("NVIDIA GeForce RTX 5080 16GB VRAM, 32GB DDR5 RAM, Windows 11");
    assert.ok(rtx5080);
    assert.equal(rtx5080.gpu, "RTX 5080");
    assert.equal(rtx5080.vramGb, 16);
  });

  it("parses AMD Strix Halo and Apple M5 unified memory rigs", () => {
    const halo = parseSpecsHeuristic("AMD Ryzen AI Max+ 395 Strix Halo 128GB unified memory Linux");
    assert.ok(halo);
    assert.equal(halo.unified, true);
    assert.equal(halo.vramGb, 128);

    const m5 = parseSpecsHeuristic("Apple M5 Max, 64GB unified memory, macOS");
    assert.ok(m5);
    assert.equal(m5.unified, true);
    assert.equal(m5.ramGb, 64);
    assert.equal(m5.os, "macOS");
  });

  it("parses multi-GPU nvidia-smi / explicit multiplier specs", () => {
    const dual3090 = parseSpecsHeuristic("2x RTX 3090, 128GB RAM, Linux");
    assert.ok(dual3090);
    assert.equal(dual3090.gpuCount, 2);
    assert.equal(dual3090.vramGb, 24);
  });
});

describe("bandwidth & MoE active-parameter speed estimates", () => {
  it("uses active parameters for MoE throughput rather than total parameters", () => {
    const gptOss120 = getModel("gpt-oss-120b");
    const dense70 = getModel("llama-3.3-70b");
    assert.ok(gptOss120 && dense70);
    assert.equal(getActiveParamsB(gptOss120), 5.1);

    const studio128: Specs = {
      gpu: "Apple M4 Ultra",
      vramGb: 128,
      ramGb: 128,
      cpu: "Apple M4 Ultra",
      os: "macOS",
      unified: true,
      gpuCount: 1,
      source: "preset",
    };

    const moeSpeed = estimateTokensPerSec(gptOss120, gptOss120.quants[2], "gpu", studio128);
    const denseSpeed = estimateTokensPerSec(dense70, dense70.quants[1], "gpu", studio128);
    assert.ok(moeSpeed.tokPerSecMin > denseSpeed.tokPerSecMin);
    assert.ok(moeSpeed.prefillTokS > 100);
    assert.ok(moeSpeed.ttftMs > 0);
  });

  it("recognizes M5 Max and Strix Halo bandwidth tiers", () => {
    const bw = getHardwareBandwidth({
      gpu: "AMD Radeon 8060S (Strix Halo)",
      vramGb: 128,
      ramGb: 128,
      cpu: "AMD Ryzen AI Max+ 395",
      os: "Linux",
      unified: true,
      gpuCount: 1,
      source: "preset",
    });
    assert.equal(bw.bandwidthGbS, 256);
  });
});

describe("KV cache quantization, batch concurrency & match engine", () => {
  it("reduces KV cache footprint significantly with q8_0 and q4_0 and scales with batchSize", () => {
    const qwen32 = getModel("qwen3-32b");
    assert.ok(qwen32);
    const fp16 = calcKvCacheGb(qwen32, 32, "fp16", 1);
    const q8 = calcKvCacheGb(qwen32, 32, "q8_0", 1);
    const q4 = calcKvCacheGb(qwen32, 32, "q4_0", 1);
    const batch4 = calcKvCacheGb(qwen32, 32, "fp16", 4);
    assert.ok(q8 < fp16);
    assert.ok(q4 < q8);
    assert.ok(batch4 > fp16 * 3);
  });

  it("computes maxSafeContextK and returns effective memory pools", () => {
    const rtx5090: Specs = {
      gpu: "RTX 5090",
      vramGb: 32,
      ramGb: 64,
      cpu: "desktop",
      os: "Windows",
      unified: false,
      gpuCount: 1,
      source: "preset",
    };
    const res = matchModels(rtx5090, "code", 32, "q8_0", 4);
    assert.ok(res.picks.length >= 3);
    assert.equal(res.kvQuant, "q8_0");
    assert.equal(res.batchSize, 4);
    assert.ok((res.effectivePoolGb ?? 0) > 25);
    const qwen8 = getModel("qwen3-8b");
    assert.ok(qwen8);
    const maxCtx = calcMaxSafeContextK(qwen8, qwen8.quants[0], rtx5090, "q8_0", 1);
    assert.ok(maxCtx >= 64);
  });
});

describe("co-resident stack planner & rig upgrade comparator", () => {
  it("evaluates co-resident chat + embeddings + audio stacks against VRAM ceiling", () => {
    const rtx4070: Specs = {
      gpu: "RTX 4070",
      vramGb: 12,
      ramGb: 32,
      cpu: "desktop",
      os: "Windows",
      unified: false,
      gpuCount: 1,
      source: "preset",
    };
    const fitsStack = evaluateLocalStack(
      [
        { modelId: "qwen3-8b", quantName: "Q4" },
        { modelId: "bge-m3", quantName: "Q8" },
        { modelId: "kokoro-82m", quantName: "FP16" },
      ],
      rtx4070,
      8,
      "q8_0",
    );
    assert.equal(fitsStack.fit, "gpu");
    assert.ok(fitsStack.headroomGb > 0);

    const heavyStack = evaluateLocalStack(
      [
        { modelId: "qwen3-32b", quantName: "Q4" },
        { modelId: "flux-schnell", quantName: "FP8" },
      ],
      rtx4070,
      32,
      "fp16",
    );
    assert.equal(heavyStack.fit, "no");
  });

  it("compares baseline vs upgrade rig bandwidth and newly unlocked GPU models", () => {
    const base: Specs = {
      gpu: "RTX 4070",
      vramGb: 12,
      ramGb: 32,
      cpu: "desktop",
      os: "Windows",
      unified: false,
      gpuCount: 1,
      source: "preset",
    };
    const target: Specs = {
      gpu: "RTX 5090",
      vramGb: 32,
      ramGb: 64,
      cpu: "desktop",
      os: "Windows",
      unified: false,
      gpuCount: 1,
      source: "preset",
    };
    const cmp = compareRigs(base, target, 8, "fp16");
    assert.ok(cmp.bandwidthGainX > 3);
    assert.ok(cmp.targetPoolGb > cmp.basePoolGb);
    assert.ok(cmp.newlyGpuFittedModels.length > 0);
  });
});

describe("Hugging Face config.json math, QLoRA training & Cloud GPU fallback", () => {
  it("parses standard transformer and MLA MoE config.json accurately", () => {
    const parsedDense = parseHfConfigJson("Qwen/Qwen3-14B", {
      model_type: "qwen3",
      num_hidden_layers: 40,
      hidden_size: 5120,
      num_attention_heads: 40,
      num_key_value_heads: 8,
      head_dim: 128,
      intermediate_size: 17408,
      vocab_size: 151936,
      max_position_embeddings: 131072,
    });
    assert.equal(parsedDense.isMoe, false);
    assert.equal(parsedDense.numKeyValueHeads, 8);
    assert.ok(parsedDense.totalParamsB > 12 && parsedDense.totalParamsB < 18);

    const dsMla = KNOWN_HF_ARCHITECTURES["deepseek-ai/DeepSeek-R1"];
    assert.equal(dsMla.isMla, true);
    const kv32k = calcExactArchitectureKvGb(dsMla, 32, "fp16", 1);
    assert.ok(kv32k < 5, `MLA KV should stay compact (${kv32k} GB)`);
  });

  it("evaluates inference, QLoRA fine-tuning, partial layer offload, and cloud fallback", () => {
    const rtx5080: Specs = {
      gpu: "RTX 5080",
      vramGb: 16,
      ramGb: 32,
      cpu: "Ryzen 7 9800X3D",
      os: "Windows",
      unified: false,
      gpuCount: 1,
      source: "preset",
    };

    const qwen32 = KNOWN_HF_ARCHITECTURES["Qwen/Qwen3-32B"];
    const inf = evaluateHfArchitecture(qwen32, rtx5080, {
      precision: "Q4_K_M",
      contextK: 8,
      kvQuant: "fp16",
      batchSize: 1,
      workload: "inference",
    });
    assert.equal(inf.fit, "hybrid");
    assert.ok(inf.offloadedLayers > 0 && inf.gpuLayers > 0);
    assert.ok(inf.cloudFallback && inf.cloudFallback.vramGb >= 24);

    const ds14 = KNOWN_HF_ARCHITECTURES["deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"];
    const qlora = evaluateHfArchitecture(ds14, rtx5080, {
      precision: "Q4_K_M",
      contextK: 4,
      kvQuant: "fp16",
      batchSize: 1,
      workload: "qlora",
    });
    const lora = evaluateHfArchitecture(ds14, rtx5080, {
      precision: "Q4_K_M",
      contextK: 4,
      kvQuant: "fp16",
      batchSize: 1,
      workload: "lora",
    });
    assert.ok(qlora.trainingStateGb > 0);
    assert.ok(lora.totalMemoryGb > qlora.totalMemoryGb * 2);

    const oversizedQlora = evaluateHfArchitecture(qwen32, rtx5080, {
      precision: "Q4_K_M",
      contextK: 8,
      kvQuant: "fp16",
      batchSize: 1,
      workload: "qlora",
    });
    assert.equal(oversizedQlora.fit, "no");
    assert.ok(oversizedQlora.headroomGb < 0);
  });
});
