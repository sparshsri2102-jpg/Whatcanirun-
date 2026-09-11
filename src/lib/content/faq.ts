/**
 * Answer capsules: question-phrased H2s with direct, extractable answers.
 * Rendered on the homepage (FAQ section + FAQPage JSON-LD) and consumed by
 * the SEO keyword harness + AEO statement harness as the answer corpus.
 *
 * Convention: every answer LEADS with the direct answer in ~40-60 words
 * (AI Overviews cite from opening content), then adds specifics with numbers.
 */
export type Faq = { q: string; a: string; cat: string };

export const FAQS: Faq[] = [
  {
    q: "Can my laptop run an LLM?",
    a: "Yes — most laptops and notebooks run a 7-9B model at usable speed with no discrete GPU. A typical 8B model in Q4 quantization needs about 5-6 GB of RAM, runs fully on CPU at a few tokens per second, and offloads to any iGPU when available. Paste your specs on the bench to get an exact fit.",
    cat: "basics",
  },
  {
    q: "What LLM can I run with 8GB VRAM?",
    a: "With 8GB VRAM, run 7-9B dense models at Q4 or Q5: Qwen3 8B (5.2 GB), Gemma 3 12B is too big — pick Gemma 3 4B, Phi-4 Mini, or Mistral Small 3.2 at high quant. Leave ~10% headroom for KV cache. The bench ranks every fitting option for your exact card.",
    cat: "vram",
  },
  {
    q: "What LLM can I run with 12GB VRAM?",
    a: "12GB VRAM fits 12-14B models comfortably at Q4-Q5 (Phi-4 14B at 9 GB, Mistral Small 24B is too big) plus 7-9B models at Q8. An RTX 3060 12GB runs Qwen3 8B Q5, Gemma 3 12B Q4, and Phi-4 Q4 with room for 8k context.",
    cat: "vram",
  },
  {
    q: "What LLM can I run with 16GB VRAM?",
    a: "16GB VRAM is the 24B sweet spot: Mistral Small 3.2 24B at Q4 (14 GB), Devstral Small for coding, or Qwen3 32B at Q3. You can also run 70B models at IQ2 with heavy RAM offload, but expect RAM-offload speeds.",
    cat: "vram",
  },
  {
    q: "What LLM can I run with 24GB VRAM?",
    a: "24GB VRAM (RTX 4090) runs 32B models at Q4-Q5 with headroom (Qwen3 32B Q4 is 20 GB, DeepSeek-R1 Distill 32B Q4 is 20 GB) and 70B models at Q3-Q4 with partial offload. Llama 3.3 70B Q4 wants 40 GB total, so pair the card with 64 GB RAM for hybrid runs.",
    cat: "vram",
  },
  {
    q: "What LLM can I run with 32GB VRAM?",
    a: "32GB VRAM (RTX 5090) runs Llama 3.3 70B at Q4 (40 GB with KV cache fits via 64 GB system RAM offload, or nearly fully on-card at Q3), Qwen3 32B at Q8, and GLM-class MoEs at aggressive quants. It is the first single card that makes 70B-class models comfortable.",
    cat: "vram",
  },
  {
    q: "Can I run DeepSeek-V4 Flash locally?",
    a: "Yes, with big iron. DeepSeek-V4 Flash is a 284B MoE with only 13B active parameters and 1M context. The smallest Unsloth quant (UD-IQ2_M, about 76 GB) needs roughly 80 GB of combined memory — a 128GB unified Mac Studio or multi-GPU plus fat RAM. It is not a single-24GB-card model.",
    cat: "models",
  },
  {
    q: "How much VRAM does Llama 3.3 70B need?",
    a: "Llama 3.3 70B needs about 40 GB at Q4_K_M, 32 GB at Q3, 50 GB at Q5, and 140 GB at FP16 — plus KV cache (roughly 1 GB per 8k context at these sizes). Plan 2x24GB cards, a 48GB card, or a 24GB card with 64 GB RAM for hybrid offload.",
    cat: "models",
  },
  {
    q: "How much VRAM does Qwen3 32B need?",
    a: "Qwen3 32B needs about 20 GB at Q4_K_M, 16 GB at Q3, 24 GB at Q5, and 64 GB at FP16, plus KV cache. It is the classic 24GB-card model at Q4 with headroom left for 32k context.",
    cat: "models",
  },
  {
    q: "How much VRAM does an 8B model need?",
    a: "An 8B model needs about 5 GB at Q4_K_M, 6.5 GB at Q5, 9 GB at Q8, and 16 GB at FP16, plus KV cache. Any 8GB card — or even CPU-only laptops with 16 GB RAM — runs 8B models comfortably.",
    cat: "models",
  },
  {
    q: "What does Q4_K_M mean and how big is it?",
    a: "Q4_K_M is the default llama.cpp 4-bit LLM quantization (quantisation) sweet spot: roughly 0.55 bytes per parameter. Explained as file size in GB — multiply billions of params by 0.55: 8B ≈ 5 GB, 32B ≈ 20 GB, 70B ≈ 40 GB, 284B ≈ 160 GB. Add KV cache on top (grows with context length).",
    cat: "quants",
  },
  {
    q: "Q4 vs Q5 vs Q8 — which quant should I download?",
    a: "Download the largest quant that fits with ~10% headroom: Q8 preserves the most quality, Q5 is the balanced pick, Q4 is the standard default, and IQ2/Q3 exist for huge MoEs on tight rigs. If Q4 leaves 5+ GB free, step up to Q5 — quality scales with bits.",
    cat: "quants",
  },
  {
    q: "Can I run LLMs with CPU only and no GPU?",
    a: "Yes. CPU-only rigs run 3-8B models at Q4-Q8: SmolLM3 3B, Qwen3 4B, Phi-4 Mini, and Qwen3 8B all work on a modern desktop CPU at 3-10 tokens per second. With 32 GB RAM you can run 32B models on CPU slowly. llama.cpp and Ollama both support pure CPU inference.",
    cat: "cpu",
  },
  {
    q: "Which LLMs run best on a Mac with unified memory?",
    a: "Macs pool CPU+GPU memory, so usable space is about 70% of total RAM: 16GB Macs run 7-13B models, 24GB Macs run 24B models, 64GB Macs run 70B at Q4, and 128GB Studios run 284B-class MoEs at IQ2. Qwen, Gemma 3, Llama, and Mistral all ship Mac-friendly GGUF builds.",
    cat: "mac",
  },
  {
    q: "Ollama vs llama.cpp vs LM Studio — which should I use?",
    a: "Ollama is the fastest start (one command, `ollama run qwen3:8b`, great defaults). llama.cpp gives maximum control (quant choice, GPU layers, 1M context flags). LM Studio is the friendliest GUI with one-click GGUF downloads. All three run the same GGUF weights — pick by comfort, not capability.",
    cat: "runners",
  },
  {
    q: "Where do I download GGUF models safely?",
    a: "Download GGUFs from Hugging Face quant publishers with download counts: Unsloth (largest library, UD dynamic quants), bartowski (reliable Q4_K_M staples), ggml-org (official builds), and model-vendor orgs (openbmb, allenai, nvidia). Every model card here links the exact GGUF repo.",
    cat: "gguf",
  },
  {
    q: "What is KV cache and how much memory does it need?",
    a: "KV cache stores attention keys/values so generation doesn't recompute the prompt — explained simply, KV cache VRAM usage grows with context length and model width. Budget roughly 0.3-2 GB at 8k context for 7-70B models, and much more at 128k+. The bench adds KV cache to every recommendation automatically.",
    cat: "memory",
  },
  {
    q: "What is an MoE model and do active parameters matter?",
    a: "Mixture-of-Experts models keep most parameters dormant, explained: only a few billion 'active' params run per token. DeepSeek-V4 Flash is 284B total but 13B active; Llama 4 Scout is 109B total but 17B active. Speed follows active params; VRAM follows total params at your quant.",
    cat: "models",
  },
  {
    q: "Best local LLM for coding on my GPU?",
    a: "For coding: Qwen2.5-Coder 32B (24GB cards at Q4), Devstral Small 24B (16GB cards), Qwen3 8B/32B (8GB/24GB cards), and DeepSeek-R1 Distill 32B for reasoning-heavy tasks. Paste your VRAM on the bench to see which coding model fits with headroom.",
    cat: "tasks",
  },
  {
    q: "Best local LLM with vision for screenshots?",
    a: "For screenshot and document Q&A: InternVL3 8B (6 GB at Q4), MiniCPM-V 4.5 (OCR specialist), Gemma 3 12B/27B (multimodal), Llama 4 Scout 109B MoE (64GB+ rigs), or Qwen3.8-Flash-Next 180B (128GB+ rigs). Vision models also need their mmproj file in llama.cpp.",
    cat: "tasks",
  },
  {
    q: "Best small LLM for an 8GB laptop?",
    a: "Qwen3 4B, Phi-4 Mini 3.8B, SmolLM3 3B, and Gemma 3 4B all fit 8 GB laptops at Q4-Q8 with room to spare. For chat quality per gigabyte, Qwen3.5 9B at Q4 (5.7 GB) is the current sweet spot if you have a little headroom.",
    cat: "tasks",
  },
  {
    q: "Can I run a 70B model on a single GPU?",
    a: "Yes on 32GB+ cards at Q3-Q4 (RTX 5090), or on 24GB cards (RTX 4090) with 64 GB system RAM for hybrid offload at Q3. Below that, use IQ2 quants or 128GB unified Macs. Expect RAM-offload speeds (3-18 tok/s) unless weights fit fully in VRAM.",
    cat: "models",
  },
  {
    q: "How do I check my GPU and RAM specs for LLM sizing?",
    a: "Windows: Win+R, type dxdiag, copy the Display and System tabs (or Task Manager → Performance → GPU). macOS: Apple menu → About This Mac (chip + memory). Linux: run `nvidia-smi` for VRAM and `free -g` for RAM. Paste any of it into the bench — the parser reads all three formats.",
    cat: "howto",
  },
  {
    q: "What is the best GGUF quant for RTX 4070 12GB?",
    a: "On a 12GB RTX 4070, download Q5_K_M for 7-9B models (sharper than Q4 at ~6 GB) and Q4_K_M for 12-14B models (Phi-4, Gemma 3 12B). The rule: biggest quant that leaves ~10% VRAM free after weights plus KV cache.",
    cat: "quants",
  },
  {
    q: "Can I run Qwen3 8B on 8GB VRAM?",
    a: "Yes — Qwen3 8B needs 5.2 GB at Q4_K_M or 6.6 GB at Q5, leaving room for 32k+ context on any 8GB card. It is one of the best quality-per-gigabyte picks for 8GB GPUs and runs fine on CPU-only machines too.",
    cat: "models",
  },
  {
    q: "Can I run Gemma 3 27B on 24GB VRAM?",
    a: "Yes — Gemma 3 27B needs 17 GB at Q4_K_M, fitting a 24GB card with headroom for 128k context. It is Google's dense 27B with vision, in the same weight class as Qwen3.8-27B.",
    cat: "models",
  },
  {
    q: "Which local LLM is best for agents and tool calling?",
    a: "The best LLM agents run on Qwen3 32B, Mistral Small 3.2 24B, Devstral Small, and DeepSeek-V4 Flash (big rigs) — all support tool calling. Smaller rigs should use Qwen3 8B or MiniCPM5 2B with tool-calling templates. The bench tags every agentic pick.",
    cat: "tasks",
  },
  {
    q: "How do I run DeepSeek-R1 on my PC?",
    a: "Run the distilled versions, not the 671B original: DeepSeek-R1 Distill 8B fits any 8GB card (`ollama run deepseek-r1:8b`), and the 32B distill fits 24GB cards at Q4. Expect long reasoning traces — great for math and code, slower than chat models.",
    cat: "models",
  },
  {
    q: "What is the best speech-to-text model to run locally?",
    a: "OpenAI Whisper large-v3 (~3 GB at Q8) remains the local speech-to-text default and runs on CPU. Pair it with local TTS Kokoro 82M (CPU text-to-speech) and any chat model for a full local voice stack.",
    cat: "tasks",
  },
  {
    q: "What is the best local embedding model for RAG?",
    a: "Nomic Embed Text v1.5 runs on CPU (~0.5 GB) with Matryoshka dimensions — the default local RAG embeddings backend. Pair it with a 7-9B chat model and pgvector or Qdrant for a fully offline retrieval stack.",
    cat: "tasks",
  },
  {
    q: "Can I run FLUX image generation on 12GB VRAM?",
    a: "Yes — FLUX.1 schnell runs on 12GB cards at fp8/nf4 (8-16 GB footprint), and Stable Diffusion 3.5 Medium fits 8GB cards. Use ComfyUI or Forge; image models swap VRAM with your chat model, so run one at a time on small cards.",
    cat: "tasks",
  },
  {
    q: "How much RAM do I need for llama.cpp CPU inference?",
    a: "Budget weights plus 30-40% overhead: an 8B Q4 (~5 GB weights) wants 8 GB RAM minimum, 16 GB comfortable; 32B Q4 (~20 GB) wants 32 GB RAM. The bench computes a CPU pool at 62% of system RAM and only recommends fits with headroom.",
    cat: "cpu",
  },
  {
    q: "What context length can my GPU handle?",
    a: "KV cache scales with context: doubling context roughly doubles KV memory. At 8k, KV is under 2 GB for most 7-70B models; at 128k it can exceed weights. If you need long context, pick a smaller quant or a GQA/MLA model (Qwen, DeepSeek) with efficient KV.",
    cat: "memory",
  },
  {
    q: "Which models support 1M token context locally?",
    a: "DeepSeek-V4 Flash (1M), Qwen3.8-Flash-Next class (256k-1M), GLM-5.3 family (1M), and Llama 4 Scout (10M) advertise million-plus context. Locally, usable context is bounded by KV cache: start at 32k and scale until headroom runs out.",
    cat: "models",
  },
  {
    q: "Is Mistral Small 3.2 good for 16GB VRAM?",
    a: "Yes — it is the 16GB sweet spot: 24B parameters at Q4 (14 GB) with vision and Apache-2.0 license, leaving room for 128k context. Devstral Small shares the footprint for coding-specialist work.",
    cat: "models",
  },
  {
    q: "Can I stack two GPUs for bigger LLMs?",
    a: "Yes — 2x RTX 3090 (48 GB) runs 70B at Q4-Q5 split across cards and 284B-class MoEs at IQ2 with RAM help. The bench models multi-GPU with a small split-communication penalty and ranks dual-GPU fits explicitly.",
    cat: "memory",
  },
  {
    q: "What is the best local LLM for privacy and offline use?",
    a: "Any GGUF run via Ollama, llama.cpp, or LM Studio is fully offline — no account, no cloud. For sensitive work, prefer Apache-2.0/MIT weights (Qwen, Mistral, Phi, Gemma terms vary) and verify checksums from the publisher's Hugging Face repo.",
    cat: "tasks",
  },
  {
    q: "How do I install Ollama and run my first model?",
    a: "Install Ollama from ollama.com, then run `ollama run qwen3:8b` — it downloads ~5 GB and drops you into chat. For a 70B model on a big rig: `ollama run llama3.3:70b`. Every model card here lists the exact one-line command.",
    cat: "howto",
  },
  {
    q: "Why is my LLM slow and how do I speed it up?",
    a: "Speed is memory bandwidth divided by active weights: fully-loaded GPU weights run fastest, RAM offload drops to PCIe speeds (3-18 tok/s), CPU-only is slowest. Speed up by fitting weights fully in VRAM (smaller quant), lowering context, or using an MoE with few active params.",
    cat: "memory",
  },
  {
    q: "What is the best model for RTX 3060 12GB in 2026?",
    a: "RTX 3060 12GB sweet spots: Qwen3 8B Q5, Gemma 3 12B Q4, Phi-4 Q4, and Mistral Small 3.2 Q3 with offload. For coding, Qwen2.5-Coder 32B will not fit — use Devstral-scale 24B at Q3 or Qwen3 8B instead.",
    cat: "vram",
  },
  {
    q: "What runs on RTX 5090 32GB?",
    a: "An RTX 5090 32GB runs Llama 3.3 70B Q4 (with RAM assist for KV), Qwen3 32B Q8, GLM-5.3 Flash IQ2-Q3, and any 24B model fully on-card. It is currently the best single-GPU value for 70B-class local inference.",
    cat: "vram",
  },
  {
    q: "Can a MacBook Air M4 run LLMs?",
    a: "Yes — a 16GB MacBook Air runs 7-13B models well (Qwen3 8B, Gemma 3 12B, Phi-4) using unified memory, at strong tokens/sec for the size. Stick to Q4-Q5 quants and 8-32k context; 70B needs 64GB+ unified machines.",
    cat: "mac",
  },
  {
    q: "What is GGUF and why does local LLM use it?",
    a: "GGUF is llama.cpp's single-file model format bundling weights plus metadata, with per-layer quantization (Q4_K_M, Q5_K_M, IQ2...). One download runs in Ollama, LM Studio, llama.cpp, and Jan. Publishers like Unsloth and bartowski ship GGUFs for nearly every open model.",
    cat: "gguf",
  },
  {
    q: "How do I verify a GGUF download is safe?",
    a: "Download only from the publisher's official Hugging Face org or high-download quant repos (Unsloth, bartowski, ggml-org), check file sizes match the listing, and prefer repos with imatrix calibration files. Never run GGUFs from random re-uploads with no provenance.",
    cat: "gguf",
  },
  {
    q: "Best local model for summarization on CPU?",
    a: "Qwen3 4B, SmolLM3 3B, and Llama 3.2 3B summarize well on CPU at Q8 for max quality per gigabyte. For long documents, MiniCPM5 2B offers 128k context in a 1.6 GB download.",
    cat: "tasks",
  },
  {
    q: "Can I run Qwen3.8-27B on RTX 4090?",
    a: "Easily — Qwen3.8 27B needs 17 GB at Q4_K_M, leaving 7 GB headroom on a 24GB RTX 4090 for 256k context plus vision. Step up to Q5 (20 GB) for extra quality; it remains the best all-rounder for 24GB cards.",
    cat: "models",
  },
  {
    q: "What are Ollama's VRAM requirements?",
    a: "Ollama's VRAM requirements equal the model weights plus overhead: an 8B Q4 needs ~6 GB, 32B Q4 needs ~21 GB, 70B Q4 needs ~42 GB. Ollama loads one model by default and unloads idle ones — check `ollama ps` to see live VRAM requirements per loaded model.",
    cat: "runners",
  },
  {
    q: "How do NGL layers and partial offload work in llama.cpp?",
    a: "The NGL layers setting (-ngl) controls how many transformer layers live on GPU; the rest spills to RAM as partial offload. Full offload (all layers) is fastest; partial offload trades speed for fit. Start at -ngl 99 and lower it until the model plus KV cache fits your VRAM.",
    cat: "memory",
  },
  {
    q: "Can I chat with PDFs offline?",
    a: "Yes — chat with PDFs offline using a vision model (InternVL3 8B, MiniCPM-V 4.5, Gemma 3 12B) that reads page screenshots, or a RAG pipeline (Nomic embeddings + 7-9B chat model) that retrieves PDF chunks. Both run 100% locally with no cloud.",
    cat: "tasks",
  },
  {
    q: "Can I run DeepSeek-V4 Flash or GLM-5.3 on a Mac?",
    a: "Only on big unified-memory Macs: DeepSeek-V4 Flash needs ~80 GB combined (Mac Studio 128GB at UD-IQ2), and GLM-5.3 Flash needs ~120 GB combined (Mac Studio 192GB+ or multi-GPU). A MacBook Air or 24GB Mac cannot fit these MoEs — pick Qwen3 32B or Llama 3.3 70B instead.",
    cat: "mac",
  },
  {
    q: "What tokens-per-second should I expect locally?",
    a: "Tokens-per-second explained by fit: fully GPU-loaded 7-9B models hit 50-100+ tok/s on RTX cards; 70B on a 4090 does 20-40 tok/s; RAM offload drops to 3-18 tok/s; CPU-only does 1-8 tok/s. MoEs with few active params (13B active) punch above their weight class.",
    cat: "memory",
  },
  {
    q: "How do I set up local RAG?",
    a: "Local RAG setup in three parts: Nomic Embed Text for embeddings, Qdrant or pgvector to store them, and a 7-9B chat model to answer from retrieved chunks. Chunk documents at 512-1024 tokens, embed once, and query offline — no API keys needed.",
    cat: "howto",
  },
  {
    q: "What is IQ2_XXS and when is 1-bit quality worth it?",
    a: "IQ2_XXS is an ultra-low-bit imatrix quant (~0.25 bytes/param): file size in GB is roughly a quarter of params, so a 284B MoE shrinks near 70 GB. Versus Q4 quality it loses nuance and long-context coherence, but for huge models that otherwise would not fit at all, IQ2_XXS on a big rig beats any smaller model.",
    cat: "quants",
  },
];

export const FAQ_JSONLD = () =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
