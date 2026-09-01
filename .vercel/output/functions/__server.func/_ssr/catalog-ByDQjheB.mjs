//#region node_modules/.nitro/vite/services/ssr/assets/catalog-ByDQjheB.js
var q = (rows) => rows.map(([name, vramGb, quality]) => ({
	name,
	vramGb,
	quality
}));
var MODELS = [
	{
		id: "qwen3.8-27b",
		name: "Qwen3.8 27B",
		org: "Qwen",
		params: "27.8B dense",
		paramsB: 27.8,
		moe: false,
		license: "Apache-2.0",
		contextK: 256,
		tasks: [
			"chat",
			"code",
			"reason",
			"vision",
			"agent"
		],
		summary: "Best all-rounder you can actually run. Vision + reasoning + 256k context, Apache-2.0, Unsloth Q4 around 17 GB.",
		released: "2026-08",
		hf: "https://huggingface.co/Qwen/Qwen3.8-27B",
		gguf: "https://huggingface.co/unsloth/Qwen3.8-27B-GGUF",
		ollama: "qwen3.8:27b",
		quants: q([
			[
				"Q4",
				17,
				88
			],
			[
				"Q5",
				20,
				92
			],
			[
				"Q8",
				30,
				96
			],
			[
				"FP16",
				56,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen3.8:27b",
			lmstudio: "Search “Qwen3.8 27B” in LM Studio → download Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen3.8-27B-GGUF:Q4_K_M"
		},
		notes: "Q4 is tight on 16 GB cards; 24 GB is the comfortable home.",
		quality: 93
	},
	{
		id: "qwen3.5-9b",
		name: "Qwen3.5 9B",
		org: "Qwen",
		params: "9B",
		paramsB: 9,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason"
		],
		summary: "The 8 GB card champion. Multilingual, sharp at code, Q4 sits around 5.7 GB with cache room.",
		released: "2026-05",
		hf: "https://huggingface.co/Qwen/Qwen3.5-9B",
		gguf: "https://huggingface.co/unsloth/Qwen3.5-9B-GGUF",
		ollama: "qwen3.5:9b",
		quants: q([
			[
				"Q4",
				5.7,
				86
			],
			[
				"Q5",
				7.2,
				90
			],
			[
				"Q8",
				10,
				95
			],
			[
				"FP16",
				18,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen3.5:9b",
			lmstudio: "Search “Qwen3.5 9B Instruct” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen3.5-9B-GGUF:Q4_K_M"
		},
		quality: 84
	},
	{
		id: "qwen3-8b",
		name: "Qwen3 8B",
		org: "Qwen",
		params: "8B",
		paramsB: 8,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason"
		],
		summary: "Thinking-mode 8B. Fast, cheap, still beats most 7B-class models at reasoning.",
		released: "2025-04",
		hf: "https://huggingface.co/Qwen/Qwen3-8B",
		gguf: "https://huggingface.co/unsloth/Qwen3-8B-GGUF",
		ollama: "qwen3:8b",
		quants: q([
			[
				"Q4",
				5.2,
				84
			],
			[
				"Q5",
				6.6,
				88
			],
			[
				"Q8",
				9,
				94
			],
			[
				"FP16",
				16,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen3:8b",
			lmstudio: "Search “Qwen3 8B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen3-8B-GGUF:Q4_K_M"
		},
		quality: 80
	},
	{
		id: "qwen3-32b",
		name: "Qwen3 32B",
		org: "Qwen",
		params: "32B",
		paramsB: 32,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason",
			"agent"
		],
		summary: "Dense 32B for 24 GB cards at Q4. Serious coding and long-horizon agent work.",
		released: "2025-04",
		hf: "https://huggingface.co/Qwen/Qwen3-32B",
		gguf: "https://huggingface.co/unsloth/Qwen3-32B-GGUF",
		ollama: "qwen3:32b",
		quants: q([
			[
				"Q3",
				16,
				80
			],
			[
				"Q4",
				20,
				88
			],
			[
				"Q5",
				24,
				92
			],
			[
				"Q8",
				35,
				97
			],
			[
				"FP16",
				64,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen3:32b",
			lmstudio: "Search “Qwen3 32B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen3-32B-GGUF:Q4_K_M"
		},
		quality: 88
	},
	{
		id: "qwen3-4b",
		name: "Qwen3 4B",
		org: "Qwen",
		params: "4B",
		paramsB: 4,
		moe: false,
		license: "Apache-2.0",
		contextK: 32,
		tasks: ["chat", "code"],
		summary: "Laptop / 6 GB card model. Surprisingly useful for chat and light coding.",
		released: "2025-04",
		hf: "https://huggingface.co/Qwen/Qwen3-4B",
		gguf: "https://huggingface.co/unsloth/Qwen3-4B-GGUF",
		ollama: "qwen3:4b",
		quants: q([
			[
				"Q4",
				2.6,
				78
			],
			[
				"Q5",
				3.3,
				84
			],
			[
				"Q8",
				4.6,
				92
			],
			[
				"FP16",
				8,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen3:4b",
			lmstudio: "Search “Qwen3 4B” → Q5_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen3-4B-GGUF:Q5_K_M"
		},
		quality: 70
	},
	{
		id: "glm-5.3-flash",
		name: "GLM-5.3 Flash",
		org: "Z.ai",
		params: "321B MoE",
		paramsB: 40,
		totalParamsB: 321,
		moe: true,
		license: "MIT",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason",
			"agent"
		],
		summary: "Frontier-class MoE. 1-bit Unsloth GGUF ~93 GB; 3-bit wants ~120 GB unified. Not a 24 GB card model.",
		released: "2026-08",
		hf: "https://huggingface.co/zai-org/GLM-5.3-Flash",
		gguf: "https://huggingface.co/unsloth/GLM-5.3-Flash-GGUF",
		quants: q([
			[
				"IQ2",
				93,
				71
			],
			[
				"Q3",
				120,
				82
			],
			[
				"Q4",
				200,
				93
			],
			[
				"FP16",
				642,
				100
			]
		]),
		run: {
			lmstudio: "Search “GLM-5.3 Flash Unsloth” — pick IQ1/IQ2 if you have 96–128 GB",
			llamacpp: "llama-cli -hf unsloth/GLM-5.3-Flash-GGUF:UD-IQ2_M"
		},
		notes: "Needs a 128 GB Mac Studio or a multi-GPU + fat RAM box.",
		quality: 96
	},
	{
		id: "glm-5.3",
		name: "GLM-5.3",
		org: "Z.ai",
		params: "753B MoE",
		paramsB: 40,
		totalParamsB: 753,
		moe: true,
		license: "MIT",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason",
			"agent"
		],
		summary: "The big GLM. 2-bit still wants ~245 GB combined memory. Homelab / Mac Studio Ultra territory.",
		released: "2026-06",
		hf: "https://huggingface.co/zai-org/GLM-5.3",
		gguf: "https://huggingface.co/unsloth/GLM-5.3-GGUF",
		quants: q([
			[
				"IQ2",
				245,
				76
			],
			[
				"Q3",
				320,
				84
			],
			[
				"Q4",
				420,
				92
			],
			[
				"FP16",
				1500,
				100
			]
		]),
		run: { llamacpp: "llama-cli -hf unsloth/GLM-5.3-GGUF:UD-IQ2_M" },
		notes: "Skip unless you have 256 GB+ unified or a 4× GPU rig.",
		quality: 97
	},
	{
		id: "deepseek-r1-8b",
		name: "DeepSeek-R1 Distill 8B",
		org: "DeepSeek",
		params: "8B",
		paramsB: 8,
		moe: false,
		license: "MIT",
		contextK: 32,
		tasks: [
			"reason",
			"code",
			"chat"
		],
		summary: "Distilled reasoner. Long traces, strong math, fits any 8 GB card at Q4.",
		released: "2025-01",
		hf: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-8B",
		gguf: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-8B-GGUF",
		ollama: "deepseek-r1:8b",
		quants: q([
			[
				"Q4",
				5.2,
				85
			],
			[
				"Q5",
				6.5,
				89
			],
			[
				"Q8",
				9,
				95
			],
			[
				"FP16",
				16,
				100
			]
		]),
		run: {
			ollama: "ollama run deepseek-r1:8b",
			lmstudio: "Search “DeepSeek R1 Distill 8B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/DeepSeek-R1-Distill-Qwen-8B-GGUF:Q4_K_M"
		},
		quality: 82
	},
	{
		id: "deepseek-r1-32b",
		name: "DeepSeek-R1 Distill 32B",
		org: "DeepSeek",
		params: "32B",
		paramsB: 32,
		moe: false,
		license: "MIT",
		contextK: 32,
		tasks: [
			"reason",
			"code",
			"chat"
		],
		summary: "The distill that still feels like R1. Q4 on a 24 GB card is the intended home.",
		released: "2025-01",
		hf: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
		gguf: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-32B-GGUF",
		ollama: "deepseek-r1:32b",
		quants: q([
			[
				"Q3",
				16,
				82
			],
			[
				"Q4",
				20,
				88
			],
			[
				"Q5",
				24,
				92
			],
			[
				"Q8",
				35,
				97
			],
			[
				"FP16",
				64,
				100
			]
		]),
		run: {
			ollama: "ollama run deepseek-r1:32b",
			lmstudio: "Search “DeepSeek R1 Distill 32B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/DeepSeek-R1-Distill-Qwen-32B-GGUF:Q4_K_M"
		},
		quality: 89
	},
	{
		id: "deepseek-v4-flash",
		name: "DeepSeek-V4 Flash",
		org: "DeepSeek",
		params: "MoE ~150B",
		paramsB: 32,
		totalParamsB: 150,
		moe: true,
		license: "MIT",
		contextK: 256,
		tasks: [
			"chat",
			"code",
			"reason",
			"agent"
		],
		summary: "Agentic MoE with 256k. Aggressive quants land near 40–80 GB combined.",
		released: "2026-07",
		hf: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash",
		gguf: "https://huggingface.co/unsloth/DeepSeek-V4-Flash-GGUF",
		quants: q([
			[
				"IQ2",
				42,
				74
			],
			[
				"Q3",
				58,
				82
			],
			[
				"Q4",
				80,
				90
			],
			[
				"Q8",
				150,
				97
			]
		]),
		run: {
			llamacpp: "llama-cli -hf unsloth/DeepSeek-V4-Flash-GGUF:Q4_K_M",
			lmstudio: "Search “DeepSeek V4 Flash GGUF”"
		},
		quality: 94
	},
	{
		id: "llama-4-scout",
		name: "Llama 4 Scout",
		org: "Meta",
		params: "109B MoE",
		paramsB: 17,
		totalParamsB: 109,
		moe: true,
		license: "Llama 4",
		contextK: 256,
		tasks: [
			"chat",
			"code",
			"vision"
		],
		summary: "Meta’s natively multimodal MoE. Q4 is ~55 GB — 64 GB unified or 2× 24 GB + RAM.",
		released: "2025-04",
		hf: "https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct",
		gguf: "https://huggingface.co/unsloth/Llama-4-Scout-17B-16E-Instruct-GGUF",
		ollama: "llama4:scout",
		quants: q([
			[
				"Q3",
				42,
				80
			],
			[
				"Q4",
				55,
				88
			],
			[
				"Q5",
				68,
				92
			],
			[
				"Q8",
				109,
				97
			],
			[
				"FP16",
				218,
				100
			]
		]),
		run: {
			ollama: "ollama run llama4:scout",
			lmstudio: "Search “Llama 4 Scout” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Llama-4-Scout-17B-16E-Instruct-GGUF:Q4_K_M"
		},
		quality: 90
	},
	{
		id: "llama-3.3-70b",
		name: "Llama 3.3 70B",
		org: "Meta",
		params: "70B",
		paramsB: 70,
		moe: false,
		license: "Llama 3.3",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason"
		],
		summary: "Still the 70B workhorse. Q4 wants ~40 GB (2× 24 GB or 48 GB unified).",
		released: "2024-12",
		hf: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
		gguf: "https://huggingface.co/unsloth/Llama-3.3-70B-Instruct-GGUF",
		ollama: "llama3.3:70b",
		quants: q([
			[
				"Q3",
				32,
				80
			],
			[
				"Q4",
				40,
				88
			],
			[
				"Q5",
				50,
				93
			],
			[
				"Q8",
				75,
				97
			],
			[
				"FP16",
				140,
				100
			]
		]),
		run: {
			ollama: "ollama run llama3.3:70b",
			lmstudio: "Search “Llama 3.3 70B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Llama-3.3-70B-Instruct-GGUF:Q4_K_M"
		},
		quality: 86
	},
	{
		id: "llama-3.2-3b",
		name: "Llama 3.2 3B",
		org: "Meta",
		params: "3B",
		paramsB: 3,
		moe: false,
		license: "Llama 3.2",
		contextK: 128,
		tasks: ["chat"],
		summary: "Edge / CPU-only. Fine for summarization and short chat on 8 GB laptops.",
		released: "2024-09",
		hf: "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct",
		gguf: "https://huggingface.co/unsloth/Llama-3.2-3B-Instruct-GGUF",
		ollama: "llama3.2:3b",
		quants: q([
			[
				"Q4",
				2,
				72
			],
			[
				"Q5",
				2.5,
				78
			],
			[
				"Q8",
				3.4,
				88
			],
			[
				"FP16",
				6,
				100
			]
		]),
		run: {
			ollama: "ollama run llama3.2:3b",
			lmstudio: "Search “Llama 3.2 3B” → Q8_0",
			llamacpp: "llama-cli -hf unsloth/Llama-3.2-3B-Instruct-GGUF:Q8_0"
		},
		quality: 62
	},
	{
		id: "gemma3-12b",
		name: "Gemma 3 12B",
		org: "Google",
		params: "12B",
		paramsB: 12,
		moe: false,
		license: "Gemma",
		contextK: 128,
		tasks: [
			"chat",
			"vision",
			"code"
		],
		summary: "Multimodal 12B. Q4 ~8 GB, Q5 ~10 GB. Excellent on 12 GB cards.",
		released: "2025-03",
		hf: "https://huggingface.co/google/gemma-3-12b-it",
		gguf: "https://huggingface.co/unsloth/gemma-3-12b-it-GGUF",
		ollama: "gemma3:12b",
		quants: q([
			[
				"Q4",
				8.1,
				86
			],
			[
				"Q5",
				10,
				90
			],
			[
				"Q8",
				13,
				95
			],
			[
				"FP16",
				24,
				100
			]
		]),
		run: {
			ollama: "ollama run gemma3:12b",
			lmstudio: "Search “Gemma 3 12B” → Q5_K_M",
			llamacpp: "llama-cli -hf unsloth/gemma-3-12b-it-GGUF:Q5_K_M"
		},
		quality: 83
	},
	{
		id: "gemma3-27b",
		name: "Gemma 3 27B",
		org: "Google",
		params: "27B",
		paramsB: 27,
		moe: false,
		license: "Gemma",
		contextK: 128,
		tasks: [
			"chat",
			"vision",
			"code",
			"reason"
		],
		summary: "Google’s dense 27B with vision. Q4 ~17 GB — same class as Qwen3.8-27B.",
		released: "2025-03",
		hf: "https://huggingface.co/google/gemma-3-27b-it",
		gguf: "https://huggingface.co/unsloth/gemma-3-27b-it-GGUF",
		ollama: "gemma3:27b",
		quants: q([
			[
				"Q4",
				17,
				87
			],
			[
				"Q5",
				20,
				91
			],
			[
				"Q8",
				29,
				96
			],
			[
				"FP16",
				54,
				100
			]
		]),
		run: {
			ollama: "ollama run gemma3:27b",
			lmstudio: "Search “Gemma 3 27B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/gemma-3-27b-it-GGUF:Q4_K_M"
		},
		quality: 87
	},
	{
		id: "gemma3-4b",
		name: "Gemma 3 4B",
		org: "Google",
		params: "4B",
		paramsB: 4,
		moe: false,
		license: "Gemma",
		contextK: 32,
		tasks: ["chat", "vision"],
		summary: "Tiny multimodal. Phone-class, also great on iGPU laptops.",
		released: "2025-03",
		hf: "https://huggingface.co/google/gemma-3-4b-it",
		gguf: "https://huggingface.co/unsloth/gemma-3-4b-it-GGUF",
		ollama: "gemma3:4b",
		quants: q([
			[
				"Q4",
				2.8,
				76
			],
			[
				"Q5",
				3.5,
				82
			],
			[
				"Q8",
				4.8,
				90
			],
			[
				"FP16",
				8,
				100
			]
		]),
		run: {
			ollama: "ollama run gemma3:4b",
			lmstudio: "Search “Gemma 3 4B” → Q5_K_M",
			llamacpp: "llama-cli -hf unsloth/gemma-3-4b-it-GGUF:Q5_K_M"
		},
		quality: 68
	},
	{
		id: "phi-4",
		name: "Phi-4 14B",
		org: "Microsoft",
		params: "14B",
		paramsB: 14,
		moe: false,
		license: "MIT",
		contextK: 16,
		tasks: [
			"chat",
			"code",
			"reason"
		],
		summary: "Small model, dense knowledge. Q4 ~9 GB, Q5 ~11 GB. Punches above 14B on STEM.",
		released: "2024-12",
		hf: "https://huggingface.co/microsoft/phi-4",
		gguf: "https://huggingface.co/unsloth/phi-4-GGUF",
		ollama: "phi4",
		quants: q([
			[
				"Q4",
				9,
				85
			],
			[
				"Q5",
				11,
				90
			],
			[
				"Q8",
				15,
				96
			],
			[
				"FP16",
				28,
				100
			]
		]),
		run: {
			ollama: "ollama run phi4",
			lmstudio: "Search “Phi-4” → Q5_K_M",
			llamacpp: "llama-cli -hf unsloth/phi-4-GGUF:Q5_K_M"
		},
		quality: 81
	},
	{
		id: "phi-4-mini",
		name: "Phi-4 Mini",
		org: "Microsoft",
		params: "3.8B",
		paramsB: 3.8,
		moe: false,
		license: "MIT",
		contextK: 128,
		tasks: ["chat", "code"],
		summary: "CPU-friendly 3.8B with 128k context. Fine default for 8 GB RAM machines.",
		released: "2025-02",
		hf: "https://huggingface.co/microsoft/Phi-4-mini-instruct",
		gguf: "https://huggingface.co/unsloth/Phi-4-mini-instruct-GGUF",
		ollama: "phi4-mini",
		quants: q([
			[
				"Q4",
				2.5,
				74
			],
			[
				"Q5",
				3.1,
				80
			],
			[
				"Q8",
				4.2,
				90
			],
			[
				"FP16",
				7.6,
				100
			]
		]),
		run: {
			ollama: "ollama run phi4-mini",
			lmstudio: "Search “Phi-4 Mini” → Q8_0",
			llamacpp: "llama-cli -hf unsloth/Phi-4-mini-instruct-GGUF:Q8_0"
		},
		quality: 66
	},
	{
		id: "mistral-small-3.2",
		name: "Mistral Small 3.2",
		org: "Mistral",
		params: "24B",
		paramsB: 24,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"vision",
			"agent"
		],
		summary: "Apache-2.0 24B with vision. Q4 ~14 GB — sweet spot for 16 GB cards.",
		released: "2025-06",
		hf: "https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506",
		gguf: "https://huggingface.co/unsloth/Mistral-Small-3.2-24B-Instruct-2506-GGUF",
		ollama: "mistral-small3.2",
		quants: q([
			[
				"Q4",
				14,
				87
			],
			[
				"Q5",
				17,
				91
			],
			[
				"Q8",
				25,
				96
			],
			[
				"FP16",
				48,
				100
			]
		]),
		run: {
			ollama: "ollama run mistral-small3.2",
			lmstudio: "Search “Mistral Small 3.2” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Mistral-Small-3.2-24B-Instruct-2506-GGUF:Q4_K_M"
		},
		quality: 88
	},
	{
		id: "devstral-small",
		name: "Devstral Small",
		org: "Mistral",
		params: "24B",
		paramsB: 24,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: ["code", "agent"],
		summary: "Mistral’s coding specialist. Same 24B footprint, tuned for repos and tools.",
		released: "2025-05",
		hf: "https://huggingface.co/mistralai/Devstral-Small-2507",
		gguf: "https://huggingface.co/unsloth/Devstral-Small-2507-GGUF",
		ollama: "devstral",
		quants: q([
			[
				"Q4",
				14,
				88
			],
			[
				"Q5",
				17,
				92
			],
			[
				"Q8",
				25,
				96
			],
			[
				"FP16",
				48,
				100
			]
		]),
		run: {
			ollama: "ollama run devstral",
			lmstudio: "Search “Devstral Small” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Devstral-Small-2507-GGUF:Q4_K_M"
		},
		quality: 89
	},
	{
		id: "qwen2.5-coder-32b",
		name: "Qwen2.5-Coder 32B",
		org: "Qwen",
		params: "32B",
		paramsB: 32,
		moe: false,
		license: "Apache-2.0",
		contextK: 32,
		tasks: ["code", "agent"],
		summary: "Still one of the best local coding models. Q4 ~20 GB.",
		released: "2024-11",
		hf: "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct",
		gguf: "https://huggingface.co/unsloth/Qwen2.5-Coder-32B-Instruct-GGUF",
		ollama: "qwen2.5-coder:32b",
		quants: q([
			[
				"Q3",
				16,
				82
			],
			[
				"Q4",
				20,
				88
			],
			[
				"Q5",
				24,
				92
			],
			[
				"Q8",
				35,
				97
			],
			[
				"FP16",
				64,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen2.5-coder:32b",
			lmstudio: "Search “Qwen2.5 Coder 32B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen2.5-Coder-32B-Instruct-GGUF:Q4_K_M"
		},
		quality: 87
	},
	{
		id: "nemotron-3-nano",
		name: "Nemotron 3 Nano 30B-A3B",
		org: "NVIDIA",
		params: "30B-A3B",
		paramsB: 3,
		totalParamsB: 30,
		moe: true,
		license: "NVIDIA",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"agent"
		],
		summary: "3B active MoE. Fast on consumer GPUs, official GGUF from ggml-org.",
		released: "2026-08",
		hf: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",
		gguf: "https://huggingface.co/ggml-org/NVIDIA-Nemotron-3-Nano-30B-A3B-GGUF",
		quants: q([
			[
				"Q4",
				18,
				84
			],
			[
				"Q5",
				22,
				88
			],
			[
				"Q8",
				32,
				94
			],
			[
				"FP16",
				60,
				100
			]
		]),
		run: {
			lmstudio: "Search “Nemotron 3 Nano GGUF”",
			llamacpp: "llama-cli -hf ggml-org/NVIDIA-Nemotron-3-Nano-30B-A3B-GGUF:Q4_K_M"
		},
		quality: 85
	},
	{
		id: "olmo-2-13b",
		name: "OLMo 2 13B",
		org: "Ai2",
		params: "13B",
		paramsB: 13,
		moe: false,
		license: "Apache-2.0",
		contextK: 4,
		tasks: ["chat"],
		summary: "Fully open (data + code + weights). Q4 ~8 GB. The research-honest pick.",
		released: "2025-01",
		hf: "https://huggingface.co/allenai/OLMo-2-1124-13B-Instruct",
		gguf: "https://huggingface.co/allenai/OLMo-2-1124-13B-Instruct-GGUF",
		ollama: "olmo2:13b",
		quants: q([
			[
				"Q4",
				8,
				78
			],
			[
				"Q5",
				10,
				84
			],
			[
				"Q8",
				14,
				92
			],
			[
				"FP16",
				26,
				100
			]
		]),
		run: {
			ollama: "ollama run olmo2:13b",
			lmstudio: "Search “OLMo 2 13B” → Q5_K_M",
			llamacpp: "llama-cli -hf allenai/OLMo-2-1124-13B-Instruct-GGUF:Q5_K_M"
		},
		quality: 74
	},
	{
		id: "smollm3",
		name: "SmolLM3 3B",
		org: "Hugging Face",
		params: "3B",
		paramsB: 3,
		moe: false,
		license: "Apache-2.0",
		contextK: 64,
		tasks: ["chat", "code"],
		summary: "On-device 3B from HF. Dual-mode thinking, tiny footprint.",
		released: "2025-07",
		hf: "https://huggingface.co/HuggingFaceTB/SmolLM3-3B",
		gguf: "https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF",
		ollama: "smollm3",
		quants: q([
			[
				"Q4",
				2,
				73
			],
			[
				"Q5",
				2.5,
				80
			],
			[
				"Q8",
				3.3,
				90
			],
			[
				"FP16",
				6,
				100
			]
		]),
		run: {
			ollama: "ollama run smollm3",
			lmstudio: "Search “SmolLM3” → Q8_0",
			llamacpp: "llama-cli -hf HuggingFaceTB/SmolLM3-3B-GGUF:Q8_0"
		},
		quality: 64
	},
	{
		id: "flux-schnell",
		name: "FLUX.1 schnell",
		org: "Black Forest Labs",
		params: "12B",
		paramsB: 12,
		moe: false,
		license: "Apache-2.0",
		contextK: 0,
		tasks: ["image"],
		summary: "Apache image model. 8–12 GB VRAM at fp8/nf4, 24 GB comfortable at fp16.",
		released: "2024-08",
		hf: "https://huggingface.co/black-forest-labs/FLUX.1-schnell",
		quants: q([
			[
				"Q4",
				8,
				82
			],
			[
				"Q8",
				12,
				90
			],
			[
				"FP8",
				16,
				94
			],
			[
				"FP16",
				24,
				100
			]
		]),
		run: {
			lmstudio: "Use ComfyUI or Forge with FLUX.1 schnell nf4",
			llamacpp: "Not an LLM — run via ComfyUI / diffusers"
		},
		notes: "Image gen, not chat. Pair with a 7–9B LLM on the same 12 GB card by swapping.",
		quality: 90
	},
	{
		id: "flux-dev",
		name: "FLUX.1 dev",
		org: "Black Forest Labs",
		params: "12B",
		paramsB: 12,
		moe: false,
		license: "Non-commercial",
		contextK: 0,
		tasks: ["image"],
		summary: "Higher-fidelity FLUX. Wants 16–24 GB. Non-commercial weights.",
		released: "2024-08",
		hf: "https://huggingface.co/black-forest-labs/FLUX.1-dev",
		quants: q([
			[
				"Q4",
				10,
				86
			],
			[
				"FP8",
				16,
				94
			],
			[
				"FP16",
				24,
				100
			]
		]),
		run: { lmstudio: "ComfyUI + FLUX.1 dev fp8" },
		quality: 93
	},
	{
		id: "sd35-medium",
		name: "Stable Diffusion 3.5 Medium",
		org: "Stability",
		params: "2.5B",
		paramsB: 2.5,
		moe: false,
		license: "Stability Community",
		contextK: 0,
		tasks: ["image"],
		summary: "Runs on 8 GB. Open-ish weights, good default if FLUX is too heavy.",
		released: "2024-10",
		hf: "https://huggingface.co/stabilityai/stable-diffusion-3.5-medium",
		quants: q([
			[
				"Q4",
				6,
				80
			],
			[
				"FP8",
				8,
				90
			],
			[
				"FP16",
				12,
				100
			]
		]),
		run: { lmstudio: "ComfyUI / Forge — SD3.5 Medium" },
		quality: 78
	},
	{
		id: "whisper-large-v3",
		name: "Whisper large-v3",
		org: "OpenAI",
		params: "1.5B",
		paramsB: 1.5,
		moe: false,
		license: "MIT",
		contextK: 0,
		tasks: ["audio"],
		summary: "Speech-to-text. Q8 ~3 GB VRAM, CPU-ok. Pair with any chat model.",
		released: "2023-11",
		hf: "https://huggingface.co/openai/whisper-large-v3",
		gguf: "https://huggingface.co/ggerganov/whisper.cpp",
		ollama: "whisper",
		quants: q([
			[
				"Q4",
				1.5,
				84
			],
			[
				"Q8",
				3,
				94
			],
			[
				"FP16",
				6,
				100
			]
		]),
		run: {
			ollama: "whisper.cpp or faster-whisper large-v3",
			llamacpp: "whisper-cli -m ggml-large-v3.bin -f audio.wav"
		},
		quality: 88
	},
	{
		id: "kokoro-82m",
		name: "Kokoro 82M",
		org: "hexgrad",
		params: "82M",
		paramsB: .082,
		moe: false,
		license: "Apache-2.0",
		contextK: 0,
		tasks: ["audio"],
		summary: "Tiny high-quality TTS. Runs on CPU. The local voice stack default.",
		released: "2025-01",
		hf: "https://huggingface.co/hexgrad/Kokoro-82M",
		quants: q([[
			"FP16",
			.5,
			100
		]]),
		run: { lmstudio: "pip install kokoro; or use the HF space weights locally" },
		quality: 80
	},
	{
		id: "nomic-embed",
		name: "Nomic Embed Text v1.5",
		org: "Nomic",
		params: "137M",
		paramsB: .137,
		moe: false,
		license: "Apache-2.0",
		contextK: 8,
		tasks: ["embed"],
		summary: "Local RAG embeddings. CPU is enough. Matryoshka dims.",
		released: "2024-02",
		hf: "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5",
		ollama: "nomic-embed-text",
		quants: q([[
			"Q8",
			.3,
			96
		], [
			"FP16",
			.5,
			100
		]]),
		run: { ollama: "ollama pull nomic-embed-text" },
		quality: 82
	},
	{
		id: "internvl3-8b",
		name: "InternVL3 8B",
		org: "OpenGVLab",
		params: "8B",
		paramsB: 8,
		moe: false,
		license: "MIT",
		contextK: 32,
		tasks: ["vision", "chat"],
		summary: "Strong open vision-language at 8B. Q4 ~6 GB. Screenshot / document QA.",
		released: "2025-04",
		hf: "https://huggingface.co/OpenGVLab/InternVL3-8B",
		gguf: "https://huggingface.co/unsloth/InternVL3-8B-GGUF",
		quants: q([
			[
				"Q4",
				6,
				84
			],
			[
				"Q5",
				7.5,
				88
			],
			[
				"Q8",
				10,
				94
			],
			[
				"FP16",
				16,
				100
			]
		]),
		run: {
			lmstudio: "Search “InternVL3 8B” → Q4_K_M",
			llamacpp: "llama-cli -hf unsloth/InternVL3-8B-GGUF:Q4_K_M --mmproj auto"
		},
		quality: 83
	},
	{
		id: "minicpm-v",
		name: "MiniCPM-V 4.5",
		org: "OpenBMB",
		params: "8B",
		paramsB: 8,
		moe: false,
		license: "Apache-2.0",
		contextK: 32,
		tasks: ["vision", "chat"],
		summary: "OCR and screenshot specialist. Fits 8 GB at Q4.",
		released: "2025-08",
		hf: "https://huggingface.co/openbmb/MiniCPM-V-4_5",
		gguf: "https://huggingface.co/openbmb/MiniCPM-V-4_5-GGUF",
		ollama: "minicpm-v",
		quants: q([
			[
				"Q4",
				5.8,
				84
			],
			[
				"Q5",
				7.2,
				88
			],
			[
				"Q8",
				10,
				94
			],
			[
				"FP16",
				16,
				100
			]
		]),
		run: {
			ollama: "ollama run minicpm-v",
			lmstudio: "Search “MiniCPM-V 4.5”"
		},
		quality: 82
	},
	{
		id: "qwen2.5-7b",
		name: "Qwen2.5 7B",
		org: "Qwen",
		params: "7B",
		paramsB: 7,
		moe: false,
		license: "Apache-2.0",
		contextK: 32,
		tasks: ["chat", "code"],
		summary: "Battle-tested 7B. Still a great 6–8 GB default if you want something boring and stable.",
		released: "2024-09",
		hf: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
		gguf: "https://huggingface.co/unsloth/Qwen2.5-7B-Instruct-GGUF",
		ollama: "qwen2.5:7b",
		quants: q([
			[
				"Q4",
				4.7,
				80
			],
			[
				"Q5",
				5.8,
				86
			],
			[
				"Q8",
				8.1,
				94
			],
			[
				"FP16",
				14,
				100
			]
		]),
		run: {
			ollama: "ollama run qwen2.5:7b",
			lmstudio: "Search “Qwen2.5 7B” → Q5_K_M",
			llamacpp: "llama-cli -hf unsloth/Qwen2.5-7B-Instruct-GGUF:Q5_K_M"
		},
		quality: 76
	},
	{
		id: "granite-3.3-8b",
		name: "Granite 3.3 8B",
		org: "IBM",
		params: "8B",
		paramsB: 8,
		moe: false,
		license: "Apache-2.0",
		contextK: 128,
		tasks: [
			"chat",
			"code",
			"reason"
		],
		summary: "Apache, long context, enterprise-clean. Solid 8 GB citizen.",
		released: "2025-04",
		hf: "https://huggingface.co/ibm-granite/granite-3.3-8b-instruct",
		gguf: "https://huggingface.co/ibm-granite/granite-3.3-8b-instruct-GGUF",
		ollama: "granite3.3:8b",
		quants: q([
			[
				"Q4",
				5.1,
				80
			],
			[
				"Q5",
				6.4,
				86
			],
			[
				"Q8",
				8.8,
				94
			],
			[
				"FP16",
				16,
				100
			]
		]),
		run: {
			ollama: "ollama run granite3.3:8b",
			lmstudio: "Search “Granite 3.3 8B” → Q4_K_M"
		},
		quality: 77
	},
	{
		id: "command-r7b",
		name: "Command R7B",
		org: "Cohere",
		params: "7B",
		paramsB: 7,
		moe: false,
		license: "CC-BY-NC",
		contextK: 128,
		tasks: ["chat", "agent"],
		summary: "RAG-native 7B with tools. Non-commercial license. Great retrieval chat.",
		released: "2024-12",
		hf: "https://huggingface.co/CohereLabs/c4ai-command-r7b-12-2024",
		gguf: "https://huggingface.co/bartowski/c4ai-command-r7b-12-2024-GGUF",
		ollama: "command-r7b",
		quants: q([
			[
				"Q4",
				5,
				80
			],
			[
				"Q5",
				6.2,
				86
			],
			[
				"Q8",
				8.5,
				94
			],
			[
				"FP16",
				14,
				100
			]
		]),
		run: {
			ollama: "ollama run command-r7b",
			lmstudio: "Search “Command R7B” → Q4_K_M"
		},
		quality: 78
	},
	{
		id: "yi-9b",
		name: "Yi 1.5 9B",
		org: "01.AI",
		params: "9B",
		paramsB: 9,
		moe: false,
		license: "Apache-2.0",
		contextK: 16,
		tasks: ["chat", "code"],
		summary: "Bilingual EN/ZH 9B. Q4 ~6 GB. Still a good 8–12 GB pick.",
		released: "2024-05",
		hf: "https://huggingface.co/01-ai/Yi-1.5-9B-Chat",
		gguf: "https://huggingface.co/bartowski/Yi-1.5-9B-Chat-GGUF",
		ollama: "yi:9b",
		quants: q([
			[
				"Q4",
				5.8,
				78
			],
			[
				"Q5",
				7.2,
				84
			],
			[
				"Q8",
				10,
				92
			],
			[
				"FP16",
				18,
				100
			]
		]),
		run: {
			ollama: "ollama run yi:9b",
			lmstudio: "Search “Yi 1.5 9B Chat”"
		},
		quality: 72
	}
];
var PRESETS = [
	{
		id: "8gb-laptop",
		label: "8 GB laptop",
		hint: "iGPU / CPU",
		specs: {
			gpu: "iGPU",
			vramGb: 0,
			ramGb: 8,
			cpu: "laptop CPU",
			os: "any",
			unified: false,
			gpuCount: 0
		}
	},
	{
		id: "rtx-3060",
		label: "RTX 3060 12GB",
		hint: "12 GB + 16 GB RAM",
		specs: {
			gpu: "RTX 3060",
			vramGb: 12,
			ramGb: 16,
			cpu: "desktop",
			os: "Windows",
			unified: false,
			gpuCount: 1
		}
	},
	{
		id: "rtx-4070",
		label: "RTX 4070 12GB",
		hint: "12 GB + 32 GB RAM",
		specs: {
			gpu: "RTX 4070",
			vramGb: 12,
			ramGb: 32,
			cpu: "desktop",
			os: "Windows",
			unified: false,
			gpuCount: 1
		}
	},
	{
		id: "rtx-4090",
		label: "RTX 4090 24GB",
		hint: "24 GB + 64 GB RAM",
		specs: {
			gpu: "RTX 4090",
			vramGb: 24,
			ramGb: 64,
			cpu: "desktop",
			os: "Windows",
			unified: false,
			gpuCount: 1
		}
	},
	{
		id: "dual-rtx-3090",
		label: "2x RTX 3090 (48GB)",
		hint: "Dual GPU Stacking",
		specs: {
			gpu: "2x RTX 3090",
			vramGb: 24,
			ramGb: 128,
			cpu: "AMD Ryzen / Threadripper",
			os: "Linux",
			unified: false,
			gpuCount: 2
		}
	},
	{
		id: "rtx-5090",
		label: "RTX 5090 32GB",
		hint: "32 GB + 64 GB RAM",
		specs: {
			gpu: "RTX 5090",
			vramGb: 32,
			ramGb: 64,
			cpu: "desktop",
			os: "Windows",
			unified: false,
			gpuCount: 1
		}
	},
	{
		id: "m4-16",
		label: "Mac M4 16GB",
		hint: "unified",
		specs: {
			gpu: "Apple M4",
			vramGb: 16,
			ramGb: 16,
			cpu: "Apple M4",
			os: "macOS",
			unified: true,
			gpuCount: 1
		}
	},
	{
		id: "m4-pro-24",
		label: "Mac M4 Pro 24GB",
		hint: "unified",
		specs: {
			gpu: "Apple M4 Pro",
			vramGb: 24,
			ramGb: 24,
			cpu: "Apple M4 Pro",
			os: "macOS",
			unified: true,
			gpuCount: 1
		}
	},
	{
		id: "m4-max-64",
		label: "Mac M4 Max 64GB",
		hint: "unified",
		specs: {
			gpu: "Apple M4 Max",
			vramGb: 64,
			ramGb: 64,
			cpu: "Apple M4 Max",
			os: "macOS",
			unified: true,
			gpuCount: 1
		}
	},
	{
		id: "studio-128",
		label: "Mac Studio 128GB",
		hint: "unified",
		specs: {
			gpu: "Apple M4 Ultra",
			vramGb: 128,
			ramGb: 128,
			cpu: "Apple M4 Ultra",
			os: "macOS",
			unified: true,
			gpuCount: 1
		}
	},
	{
		id: "cpu-32",
		label: "CPU only 32GB",
		hint: "no discrete GPU",
		specs: {
			gpu: "none",
			vramGb: 0,
			ramGb: 32,
			cpu: "desktop CPU",
			os: "Linux",
			unified: false,
			gpuCount: 0
		}
	}
];
//#endregion
export { PRESETS as n, MODELS as t };
