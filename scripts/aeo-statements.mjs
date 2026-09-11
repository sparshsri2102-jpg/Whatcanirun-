/**
 * AEO statement harness: 1000 natural problem statements (the way users
 * describe the problem to an AI model) must EACH be answerable from site
 * content — an FAQ capsule, site copy, or a verdict URL.
 *
 * This is the controllable proxy for "would an AI model cite/suggest us":
 * if every token of the problem statement is retrievable from our pages,
 * retrieval/citation pipelines can ground on us.
 *
 * Usage: node --experimental-strip-types scripts/aeo-statements.mjs [--verbose]
 * Exit 0 only if answerability is >= 97%.
 */
import { MODELS, PRESETS, covered, toks } from "./seo-corpus.mjs";

const STATEMENTS = [];

// T1: rig + task recommendations (300)
{
  const discrete = PRESETS.filter((p) => !p.specs.unified && p.specs.vramGb > 0);
  const tasks = ["coding", "chat", "vision", "agents", "reasoning", "image generation"];
  let i = 0;
  for (const p of discrete) {
    for (const t of tasks) {
      const vram = p.specs.vramGb * Math.max(1, p.specs.gpuCount || 1);
      STATEMENTS.push(`I have ${p.specs.gpu} with ${vram}GB VRAM, which LLM should I run for ${t}?`);
      if (++i >= 300) break;
    }
    if (i >= 300) break;
  }
  // pad with paraphrases if presets run short
  const verbs = ["recommend", "suggest", "pick"];
  while (STATEMENTS.length < 300) {
    const p = discrete[STATEMENTS.length % discrete.length];
    const t = tasks[STATEMENTS.length % tasks.length];
    STATEMENTS.push(`${verbs[STATEMENTS.length % 3]} an LLM for ${t} on ${p.specs.gpu} ${p.specs.vramGb}GB`);
  }
}

// T2: can-model-on-rig verdicts (200 sampled from the full matrix)
{
  const pairs = [];
  for (const m of MODELS) for (const p of PRESETS) pairs.push([m, p]);
  const step = Math.max(1, Math.floor(pairs.length / 200));
  for (let i = 0; i < pairs.length && STATEMENTS.length < 500; i += step) {
    const [m, p] = pairs[i];
    STATEMENTS.push(`Can ${m.name} run on ${p.label}?`);
  }
  let j = 0;
  while (STATEMENTS.length < 500) {
    const [m, p] = pairs[j++ % pairs.length];
    STATEMENTS.push(`Will ${m.name} fit ${p.label} at Q4?`);
  }
}

// T3: quant VRAM needs (150)
{
  const quants = ["Q4", "Q5", "Q8"];
  let i = 0;
  for (const m of MODELS) {
    for (const q of quants) {
      STATEMENTS.push(`How much VRAM does ${m.name} need at ${q}?`);
      if (++i >= 150) break;
    }
    if (i >= 150) break;
  }
}

// T4: size x OS (100)
{
  const sizes = ["smallest", "8B", "70B"];
  const oss = ["windows", "mac", "linux"];
  const models8 = MODELS.filter((m) => (m.paramsB || 99) <= 9).slice(0, 6).map((m) => m.name);
  const models70 = MODELS.filter((m) => (m.paramsB || 0) >= 60 && !(m.moe && m.totalParamsB)).slice(0, 6).map((m) => m.name);
  const pools = { smallest: ["SmolLM3 3B", "Qwen3 4B", "Phi-4 Mini"], "8B": models8, "70B": models70 };
  outer: for (const s of sizes) {
    for (const o of oss) {
      for (const m of pools[s]) {
        STATEMENTS.push(`What is the best ${s} model for ${o}? ${m}?`);
        if (STATEMENTS.length >= 750) break outer;
      }
    }
  }
  while (STATEMENTS.length < 750) STATEMENTS.push(`What is the best 8B model for windows? Qwen3 8B?`);
}

// T5: laptop RAM, no GPU (100)
{
  const machines = ["laptop", "macbook", "notebook", "desktop"];
  const rams = ["8", "16", "32"];
  const tasks = ["chat", "coding", "study", "writing"];
  outer: for (const mc of machines) {
    for (const r of rams) {
      for (const t of tasks) {
        STATEMENTS.push(`My ${mc} has ${r}GB RAM and no GPU. Can I run ${t} locally?`);
        if (STATEMENTS.length >= 850) break outer;
      }
    }
  }
  while (STATEMENTS.length < 850) STATEMENTS.push(`My laptop has 16GB RAM and no GPU. Can I run chat locally?`);
}

// T6: quant comparisons (100)
{
  const pairs = [["Q4", "Q5"], ["Q4", "Q8"], ["Q5", "Q8"], ["IQ2", "Q4"], ["Q3", "Q4"]];
  let i = 0;
  outer: for (const m of MODELS) {
    for (const [a, b] of pairs) {
      STATEMENTS.push(`${a} vs ${b} for ${m.name}: which quant?`);
      if (++i >= 100 || STATEMENTS.length >= 950) break outer;
    }
  }
  while (STATEMENTS.length < 950) STATEMENTS.push(`Q4 vs Q8 for Llama 3.3 70B: which quant?`);
}

// T8: head-to-head comparisons on rigs (150)
{
  const pairs = [];
  for (let i = 0; i < MODELS.length; i += 2) {
    pairs.push([MODELS[i], MODELS[(i + 7) % MODELS.length]]);
  }
  let i = 0;
  outer: for (const [a, b] of pairs) {
    for (const p of PRESETS) {
      STATEMENTS.push(`Is ${a.name} or ${b.name} better for ${p.label}?`);
      if (++i >= 150 || STATEMENTS.length >= 1100) break outer;
    }
  }
}

// T9: fit-my-vram + OS task asks (150)
{
  const oss = ["windows", "mac", "linux"];
  let i = 0;
  outer: for (const p of PRESETS) {
    const vramPool = p.specs.vramGb * Math.max(1, p.specs.gpuCount || 1);
    const memText = p.specs.unified
      ? `${p.specs.ramGb}GB unified memory`
      : vramPool > 0
        ? `${vramPool}GB VRAM`
        : `${p.specs.ramGb}GB RAM with no GPU`;
    for (const t of ["coding", "chat", "vision", "agents"]) {
      STATEMENTS.push(`What can I run on ${p.label} for ${t}?`);
      STATEMENTS.push(`Tell me if a 32B model fits ${memText} on ${oss[i % 3]}`);
      if ((i += 2) >= 150 || STATEMENTS.length >= 1250) break outer;
    }
  }
}

// T10: paraphrase pack — same vocabulary, new phrasings (250)
{
  const hows = [
    "How do I check my GPU specs on Windows?",
    "How do I check VRAM with nvidia-smi?",
    "How do I install Ollama on Windows?",
    "How do I install LM Studio on Mac?",
    "How do I download a GGUF from Hugging Face?",
    "How do I paste dxdiag into the bench?",
    "How do I run llama.cpp with GPU offload?",
    "How do I pick a quant for 12GB VRAM?",
    "How do I run RAG fully offline?",
    "How do I speed up a slow local LLM?",
  ];
  const tasks = ["coding", "chat", "vision", "agents", "reasoning"];
  const oss = ["on windows", "on my mac", "on linux"];
  let i = 0;
  outer: for (const m of MODELS) {
    for (const t of tasks) {
      STATEMENTS.push(`Please recommend ${m.name} for ${t} ${oss[i % 3]}?`.replace(" ?", "?"));
      STATEMENTS.push(`Suggest me a good setup: ${m.name}, ${t} ${oss[(i + 1) % 3]}`);
      STATEMENTS.push(`Does ${m.name} fit a 24GB VRAM rig for ${t}?`);
      if ((i += 3) >= 200 || STATEMENTS.length >= 1450) break outer;
    }
  }
  for (const h of hows) {
    STATEMENTS.push(h.replace("How do I", "Can you explain how I"));
    if (STATEMENTS.length >= 1500) break;
  }
}

// T11: fit-check narratives (to 1000+)
{
  const tasks = ["coding", "chat", "vision", "agents"];
  const vrams = ["8GB", "12GB", "16GB", "24GB", "32GB"];
  let i = 0;
  outer: for (const m of MODELS) {
    for (const t of tasks) {
      STATEMENTS.push(`I want to run ${m.name} for ${t} locally, I have ${vrams[i % 5]} VRAM — will it fit?`);
      STATEMENTS.push(`My GPU has ${vrams[(i + 2) % 5]} VRAM. Is ${m.name} too big for ${t}?`);
      if ((i += 2) >= 120 || STATEMENTS.length >= 1600) break outer;
    }
  }
}

// T7: how-to (50)
{
  const hows = [
    "How do I check my GPU specs on Windows?",
    "How do I check VRAM with nvidia-smi?",
    "How do I install Ollama on Windows?",
    "How do I install LM Studio on Mac?",
    "How do I download a GGUF from Hugging Face?",
    "How do I paste dxdiag into the bench?",
    "How do I run llama.cpp with GPU offload?",
    "How do I pick a quant for 12GB VRAM?",
    "How do I run RAG fully offline?",
    "How do I speed up a slow local LLM?",
  ];
  while (STATEMENTS.length < 1000) STATEMENTS.push(hows[STATEMENTS.length % hows.length]);
}

const verbose = process.argv.includes("--verbose");
const uniq = [...new Set(STATEMENTS)];
let okCount = 0;
const gaps = [];
for (const st of uniq) {
  const r = covered(st);
  if (r.ok) okCount++;
  else gaps.push(st);
}
const pct = (okCount / uniq.length) * 100;
console.log(`statements: ${uniq.length} | answerable: ${okCount} (${pct.toFixed(1)}%)`);
if (verbose && gaps.length) {
  const { toks: tk } = await import("./seo-corpus.mjs");
  console.log("--- gaps ---");
  for (const g of gaps.slice(0, 60)) {
    const r = covered(g);
    console.log("GAP |", g, "| missing:", (r.missing || []).join(","));
  }
  if (gaps.length > 60) console.log(`... and ${gaps.length - 60} more`);
}
const PASS = 0.97;
console.log(pct / 100 >= PASS ? "AEO PASS" : "AEO FAIL");
process.exit(pct / 100 >= PASS ? 0 : 1);
