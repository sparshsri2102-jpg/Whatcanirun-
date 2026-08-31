import { t as MODELS } from "./catalog-ByDQjheB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/match-D4FNJ2sp.js
/**
* Returns estimated memory bandwidth in GB/s based on GPU / CPU architecture.
*/
function getHardwareBandwidth(specs) {
	const g = (specs.gpu || "").toLowerCase();
	const c = (specs.cpu || "").toLowerCase();
	const gpuCount = Math.max(1, specs.gpuCount || 1);
	if (specs.unified || g.includes("apple") || c.includes("apple")) {
		if (g.includes("ultra") || c.includes("ultra")) return {
			bandwidthGbS: 800,
			type: "Apple Unified Memory (Ultra)"
		};
		if (g.includes("max") || c.includes("max")) return {
			bandwidthGbS: 400,
			type: "Apple Unified Memory (Max)"
		};
		if (g.includes("pro") || c.includes("pro")) return {
			bandwidthGbS: 150,
			type: "Apple Unified Memory (Pro)"
		};
		return {
			bandwidthGbS: 100,
			type: "Apple Unified Memory (Base)"
		};
	}
	if (g.includes("h100") || g.includes("h200")) return {
		bandwidthGbS: 3350 * gpuCount,
		type: `${gpuCount}x H100/H200 HBM3`
	};
	if (g.includes("a100")) return {
		bandwidthGbS: 1935 * gpuCount,
		type: `${gpuCount}x A100 80GB HBM2e`
	};
	if (g.includes("5090")) return {
		bandwidthGbS: 1792 * gpuCount,
		type: `${gpuCount}x RTX 5090 GDDR7`
	};
	if (g.includes("5080")) return {
		bandwidthGbS: 1e3 * gpuCount,
		type: `${gpuCount}x RTX 5080 GDDR7`
	};
	if (g.includes("4090")) return {
		bandwidthGbS: 1008 * gpuCount,
		type: `${gpuCount}x RTX 4090 GDDR6X`
	};
	if (g.includes("3090")) return {
		bandwidthGbS: 936 * gpuCount,
		type: `${gpuCount}x RTX 3090 GDDR6X`
	};
	if (g.includes("4080")) return {
		bandwidthGbS: 716 * gpuCount,
		type: `${gpuCount}x RTX 4080 GDDR6X`
	};
	if (g.includes("3080")) return {
		bandwidthGbS: 760 * gpuCount,
		type: `${gpuCount}x RTX 3080 GDDR6X`
	};
	if (g.includes("4070") || g.includes("3070")) return {
		bandwidthGbS: 504 * gpuCount,
		type: `${gpuCount}x RTX 4070/3070 GDDR6X`
	};
	if (g.includes("4060") || g.includes("3060")) return {
		bandwidthGbS: 288 * gpuCount,
		type: `${gpuCount}x RTX 3060/4060 GDDR6`
	};
	if (g.includes("7900 xtx")) return {
		bandwidthGbS: 960 * gpuCount,
		type: `${gpuCount}x RX 7900 XTX`
	};
	if (g.includes("7900 xt")) return {
		bandwidthGbS: 800 * gpuCount,
		type: `${gpuCount}x RX 7900 XT`
	};
	if (g.includes("7800 xt")) return {
		bandwidthGbS: 624 * gpuCount,
		type: `${gpuCount}x RX 7800 XT`
	};
	if (specs.vramGb >= 24) return {
		bandwidthGbS: 900 * gpuCount,
		type: `${gpuCount}x Discrete VRAM 24GB+`
	};
	if (specs.vramGb >= 16) return {
		bandwidthGbS: 550 * gpuCount,
		type: `${gpuCount}x Discrete VRAM 16GB`
	};
	if (specs.vramGb >= 8) return {
		bandwidthGbS: 300 * gpuCount,
		type: `${gpuCount}x Discrete VRAM 8GB`
	};
	if (c.includes("ryzen 7") || c.includes("ryzen 9") || c.includes("13th") || c.includes("14th") || c.includes("core ultra")) return {
		bandwidthGbS: 75,
		type: "Dual-Channel DDR5 System RAM"
	};
	return {
		bandwidthGbS: 45,
		type: "Dual-Channel DDR4 System RAM"
	};
}
/**
* Calculates estimated active parameters in Billions for inference.
* For dense models, activeParams = paramsB.
* For MoE models (DeepSeek V3/R1, Mixtral, Qwen MoE), activeParams is significantly lower.
*/
function getActiveParamsB(model) {
	if (model.id.includes("deepseek-r1") || model.id.includes("deepseek-v3")) return 37;
	if (model.id.includes("mixtral-8x7b") || model.name.toLowerCase().includes("8x7b")) return 12.8;
	if (model.id.includes("mixtral-8x22b") || model.name.toLowerCase().includes("8x22b")) return 39;
	if (model.id.includes("qwen") && model.moe) return Math.max(3, Math.round(model.paramsB * .25));
	return model.paramsB;
}
/**
* Accurately estimates autoregressive token generation speed (tok/s)
* based on memory bandwidth, weight footprint per token, and device offload mode.
*/
function estimateTokensPerSec(model, quant, fit, specs) {
	const hw = getHardwareBandwidth(specs);
	const activeParams = getActiveParamsB(model);
	let bytesPerParam = .55;
	if (quant.name === "IQ2") bytesPerParam = .32;
	else if (quant.name === "Q3") bytesPerParam = .44;
	else if (quant.name === "Q4") bytesPerParam = .56;
	else if (quant.name === "Q5") bytesPerParam = .68;
	else if (quant.name === "Q8") bytesPerParam = 1.05;
	else if (quant.name === "FP8") bytesPerParam = 1;
	else if (quant.name === "FP16") bytesPerParam = 2;
	const activeGbPerToken = Math.max(.8, activeParams * bytesPerParam);
	let effectiveBandwidth = hw.bandwidthGbS;
	let efficiency = .68;
	if (fit === "gpu") {
		effectiveBandwidth = hw.bandwidthGbS;
		if (specs.unified) efficiency = .62;
	} else if (fit === "hybrid") {
		effectiveBandwidth = 45;
		efficiency = .5;
	} else if (fit === "cpu") {
		effectiveBandwidth = Math.min(65, hw.bandwidthGbS);
		efficiency = .45;
	} else return {
		tokPerSecMin: 0,
		tokPerSecMax: 0,
		tokPerSecLabel: "0 tok/s (exceeds memory)",
		bandwidthGbS: hw.bandwidthGbS,
		busType: hw.type
	};
	const baseTokS = effectiveBandwidth * efficiency / activeGbPerToken;
	let minTok = Math.max(1, Math.round(baseTokS * .85));
	let maxTok = Math.max(1, Math.round(baseTokS * 1.15));
	if (fit === "gpu") {
		if (specs.gpuCount > 1) {
			minTok = Math.round(minTok * .92);
			maxTok = Math.round(maxTok * .95);
		}
	} else if (fit === "hybrid") {
		minTok = Math.min(18, Math.max(3, minTok));
		maxTok = Math.min(28, Math.max(6, maxTok));
	} else if (fit === "cpu") {
		minTok = Math.min(8, Math.max(1, minTok));
		maxTok = Math.min(14, Math.max(2, maxTok));
	}
	let tokPerSecLabel = `~${minTok}–${maxTok} tok/s`;
	if (minTok >= 100) tokPerSecLabel = `~${minTok}+ tok/s (blazing)`;
	else if (fit === "hybrid") tokPerSecLabel = `~${minTok}–${maxTok} tok/s (RAM offload)`;
	else if (fit === "cpu") tokPerSecLabel = `~${minTok}–${maxTok} tok/s (CPU bound)`;
	return {
		tokPerSecMin: minTok,
		tokPerSecMax: maxTok,
		tokPerSecLabel,
		bandwidthGbS: hw.bandwidthGbS,
		busType: hw.type
	};
}
var TASK_LABEL = {
	chat: "chat",
	code: "code",
	reason: "reasoning",
	vision: "vision",
	image: "image gen",
	video: "video",
	audio: "audio",
	embed: "embeddings",
	agent: "agents"
};
function calcKvCacheGb(model, contextK) {
	if (contextK <= 0) return 0;
	if (model.id.toLowerCase().includes("deepseek") && model.moe) return Math.round(contextK * .04 * 10) / 10;
	const params = model.paramsB || 8;
	let factor = .045;
	if (params <= 4) factor = .025;
	else if (params <= 9) factor = .045;
	else if (params <= 20) factor = .08;
	else if (params <= 40) factor = .12;
	else if (params <= 80) factor = .18;
	else factor = .25;
	return Math.round(contextK * factor * 10) / 10;
}
function pools(specs) {
	const count = Math.max(1, specs.gpuCount || 1);
	const totalVram = Math.max(0, specs.vramGb) * count;
	const ram = Math.max(0, specs.ramGb);
	if (specs.unified) {
		const usable = ram * .72;
		return {
			gpu: usable,
			hybrid: usable,
			cpu: usable,
			totalVram
		};
	}
	const splitBufferLoss = count > 1 ? (count - 1) * .8 : 0;
	const usableGpu = Math.max(0, totalVram * .9 - splitBufferLoss);
	return {
		gpu: usableGpu,
		hybrid: usableGpu + ram * .5,
		cpu: ram * .62,
		totalVram
	};
}
function evaluateQuant(quant, model, specs, contextK) {
	const p = pools(specs);
	const kvCache = calcKvCacheGb(model, contextK);
	const totalNeeded = Math.round((quant.vramGb + kvCache) * 10) / 10;
	let fit = "no";
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
		totalNeededGb: totalNeeded
	};
}
function bestQuant(model, specs, contextK) {
	const quantOptions = model.quants.map((q) => evaluateQuant(q, model, specs, contextK));
	const usableOptions = quantOptions.filter((q) => q.fit !== "no");
	if (usableOptions.length === 0) return null;
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
		quantOptions
	};
}
function why(model, fit, quant, specs, contextK = 8) {
	const task = model.tasks.filter((t) => t !== "chat").slice(0, 2).map((t) => TASK_LABEL[t]).join(" + ");
	const count = Math.max(1, specs.gpuCount || 1);
	const where = fit === "gpu" ? count > 1 ? `split across ${count}x GPUs in VRAM` : "fully on GPU" : fit === "hybrid" ? "GPU + RAM offload" : "CPU RAM";
	const card = specs.unified ? `${specs.ramGb} GB unified` : count > 1 ? `${count}x ${specs.vramGb} GB (${count * specs.vramGb} GB total VRAM)` : `${specs.vramGb} GB VRAM`;
	const kv = calcKvCacheGb(model, contextK);
	const total = Math.round((quant.vramGb + kv) * 10) / 10;
	return `${quant.name} is ${quant.vramGb} GB (+${kv} GB @ ${contextK}k context = ${total} GB) · ${where} on ${card}${task ? ` · ${task}` : ""}`;
}
function scoreFit(model, fit, quant, headroomGb, prefer) {
	let s = model.quality * .55 + quant.quality * .2;
	if (fit === "gpu") s += 40;
	else if (fit === "hybrid") s += 12;
	else s -= 8;
	if (fit === "gpu") {
		const used = quant.vramGb;
		s += Math.min(18, used * .35);
		if (headroomGb > 20 && model.paramsB < 8) s -= 12;
	}
	if (prefer && model.tasks.includes(prefer)) s += 10;
	if (model.license.toLowerCase().includes("apache") || model.license === "MIT") s += 2;
	const recency = Date.parse(`${model.released}-01`) || 0;
	s += Math.max(0, (recency - Date.parse("2024-01-01")) / 3456e6);
	return s;
}
function matchModels(specs, prefer, contextK = 8) {
	const fits = [];
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
			quantOptions
		});
	}
	fits.sort((a, b) => b.score - a.score);
	const picks = [];
	const seenOrg = /* @__PURE__ */ new Set();
	const seenTaskKey = /* @__PURE__ */ new Set();
	for (const f of fits) {
		if (picks.length >= 4) break;
		const key = `${f.model.org}:${f.model.tasks[0]}`;
		if (seenOrg.has(f.model.org) && seenTaskKey.has(key) && picks.length < 3) continue;
		if (seenOrg.has(f.model.org) && picks.length >= 2) continue;
		picks.push(f);
		seenOrg.add(f.model.org);
		seenTaskKey.add(key);
	}
	if (picks.length < 3) for (const f of fits) {
		if (picks.length >= 4) break;
		if (picks.some((p) => p.model.id === f.model.id)) continue;
		picks.push(f);
	}
	const pickIds = new Set(picks.map((p) => p.model.id));
	const also = fits.filter((f) => !pickIds.has(f.model.id)).slice(0, 6);
	const gpuPicks = picks.filter((p) => p.fit === "gpu").length;
	const count = Math.max(1, specs.gpuCount || 1);
	const totalVramText = specs.unified ? `${specs.ramGb} GB Unified` : count > 1 ? `${count}x GPUs (${count * specs.vramGb} GB VRAM)` : `${specs.vramGb} GB VRAM`;
	return {
		specs,
		picks,
		also,
		blurb: gpuPicks ? `${gpuPicks} of ${picks.length} run fully in ${totalVramText} with ${contextK}k context. Bigger weights exist — they just do not fit.` : picks.length ? `Nothing here sits fully in VRAM at ${contextK}k context. These are the least-painful offload / CPU options.` : `This machine is below the floor for current open-weight LLMs at ${contextK}k context. Try a 3B Q4 on CPU, or add RAM.`,
		contextK
	};
}
//#endregion
export { matchModels as t };
