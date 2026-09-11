/**
 * SEO keyword harness: ~370 problem keywords/phrases must EACH be covered by
 * something indexable — an FAQ capsule, site copy, or sitemap URL slug.
 *
 * Usage: node --experimental-strip-types scripts/seo-keywords.mjs [--verbose]
 * Exit 0 only if coverage is 100%.
 */
import { MODELS, PRESETS, covered } from "./seo-corpus.mjs";

// ---- keyword universe: hand seeds + programmatic expansion ----
const SEEDS = [
  "can my laptop run llm", "what llm can i run", "which llm fits my gpu",
  "best local llm", "run llama locally", "run llm without gpu", "run llm on cpu",
  "ollama vram requirements", "ollama best models", "ollama run 70b",
  "llama vram calculator", "how much vram for 70b", "how much vram for 32b",
  "how much vram for 8b model", "q4_k_m size explained", "q4 vs q5 vs q8",
  "best quant for 12gb vram", "gguf download safe", "where to download gguf",
  "unsloth vs bartowski gguf", "llama.cpp vs ollama vs lm studio",
  "how to install ollama", "ollama run qwen", "lm studio download model",
  "mac unified memory llm", "macbook air llm", "m4 mac llm",
  "mac studio 128gb llm", "apple silicon llama", "rtx 3060 best llm",
  "rtx 4070 best llm", "rtx 4090 best llm", "rtx 5090 best llm",
  "8gb vram llm", "12gb vram llm", "16gb vram llm", "24gb vram llm", "32gb vram llm",
  "dual gpu llm", "2x rtx 3090 llm", "cpu only llm", "32gb ram llm cpu",
  "kv cache explained", "kv cache vram usage", "context length vram",
  "moe active params explained", "what is quantisation llm",
  "best coding llm local", "best vision llm local", "best llm for agents",
  "local speech to text whisper", "local tts kokoro", "local embeddings rag",
  "nomic embed local", "flux schnell vram", "stable diffusion 12gb",
  "qwen3 vram", "llama 4 scout vram", "deepseek v4 flash vram",
  "glm flash vram", "mistral small vram", "gemma 3 vram", "phi 4 vram",
  "devstral vram", "nemotron vram", "qwen coder 32b vram",
  "check gpu specs dxdiag", "neofetch gpu ram", "about this mac specs",
  "nvidia-smi vram check", "is my pc good for ai", "laptop for local ai",
  "will it run llama", "can i run qwen", "can i run mistral",
  "paste specs get models", "no signup ai tools", "private offline llm",
  "free forever open weights", "no cloud bill llm", "local rag setup",
  "hybrid gpu ram offload", "partial offload llama.cpp", "ngl layers setting",
  "tokens per second explained", "why is my llm slow", "speed up local llm",
  "best llm for rtx 3060 2026", "best llm for macbook pro", "vision model screenshots",
  "ocr screenshot model local", "document qa local model", "chat with pdf offline",
  "summarize long documents local", "128k context local model", "1m context local model",
];

const KEYWORDS = [...SEEDS];
for (const m of MODELS) {
  const name = m.name.toLowerCase();
  KEYWORDS.push(`${name} vram requirements`);
  KEYWORDS.push(`can i run ${name} locally`);
  KEYWORDS.push(`${name} quant size`);
  KEYWORDS.push(`${name} ollama command`);
  KEYWORDS.push(`run ${name} on rtx 4090`);
  KEYWORDS.push(`run ${name} on macbook`);
}
const rigPhrases = ["rtx 3060 12gb", "rtx 4070 12gb", "rtx 4090 24gb", "rtx 5090 32gb", "macbook air m4", "mac studio", "8gb laptop", "cpu only pc"];
for (const r of rigPhrases) {
  KEYWORDS.push(`best llm for ${r}`);
  KEYWORDS.push(`best local model ${r}`);
  KEYWORDS.push(`what fits ${r} vram`);
}
for (const t of ["coding", "vision", "chat", "reasoning", "agents"]) {
  KEYWORDS.push(`best local llm for ${t}`);
  KEYWORDS.push(`best open model for ${t} 2026`);
}
for (const q of ["q4_k_m", "q5_k_m", "q8_0", "iq2_xxs", "fp16"]) {
  KEYWORDS.push(`${q} file size gb`);
  KEYWORDS.push(`${q} vs q4 quality`);
}

// ---- run ----
const verbose = process.argv.includes("--verbose");
const uniq = [...new Set(KEYWORDS)];
let coveredCount = 0;
const gaps = [];
const viaCounts = {};
for (const kw of uniq) {
  const r = covered(kw);
  if (r.ok) {
    coveredCount++;
    viaCounts[r.via] = (viaCounts[r.via] || 0) + 1;
  } else {
    gaps.push(kw);
  }
}
const pct = (coveredCount / uniq.length) * 100;
console.log(`keywords: ${uniq.length} | covered: ${coveredCount} (${pct.toFixed(1)}%) | via: ${JSON.stringify(viaCounts)}`);
if (verbose && gaps.length) {
  const { toks } = await import("./seo-corpus.mjs");
  console.log("--- gaps ---");
  for (const g of gaps) console.log("GAP |", g, "| tokens:", toks(g).join(","));
}
console.log(gaps.length === 0 ? "KEYWORDS PASS" : "KEYWORDS FAIL");
process.exit(gaps.length === 0 ? 0 : 1);
