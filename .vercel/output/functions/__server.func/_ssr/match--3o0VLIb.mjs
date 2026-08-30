import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as MODELS } from "./catalog-Behu-X92.mjs";
import { t as grokJson } from "./xai-BGj4Qahd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/match--3o0VLIb.js
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
function pools(specs) {
	const vram = Math.max(0, specs.vramGb) * Math.max(1, specs.gpuCount || 1);
	const ram = Math.max(0, specs.ramGb);
	if (specs.unified) {
		const usable = ram * .72;
		return {
			gpu: usable,
			hybrid: usable,
			cpu: usable
		};
	}
	return {
		gpu: vram * .9,
		hybrid: vram * .9 + ram * .5,
		cpu: ram * .62
	};
}
function bestQuant(model, specs) {
	const p = pools(specs);
	const ordered = [...model.quants].sort((a, b) => b.quality - a.quality);
	let cpu = null;
	let hybrid = null;
	for (const quant of ordered) {
		if (quant.vramGb <= p.gpu) return {
			quant,
			fit: "gpu",
			headroomGb: p.gpu - quant.vramGb
		};
		if (!hybrid && quant.vramGb <= p.hybrid) hybrid = {
			quant,
			headroomGb: p.hybrid - quant.vramGb
		};
		if (!cpu && quant.vramGb <= p.cpu) cpu = {
			quant,
			headroomGb: p.cpu - quant.vramGb
		};
	}
	if (hybrid) return {
		...hybrid,
		fit: "hybrid"
	};
	if (cpu) return {
		...cpu,
		fit: "cpu"
	};
	return null;
}
function speedHint(fit, specs, model) {
	if (fit === "gpu") {
		if (specs.unified) return model.paramsB >= 20 ? "~12–25 tok/s unified" : "~25–50 tok/s unified";
		if (specs.vramGb >= 24) return model.paramsB >= 24 ? "~40–80 tok/s" : "~80–150 tok/s";
		if (specs.vramGb >= 12) return "~25–50 tok/s";
		return "~15–30 tok/s";
	}
	if (fit === "hybrid") return "partial offload · slower, still usable";
	return "CPU · expect single-digit tok/s";
}
function why(model, fit, quant, specs) {
	const task = model.tasks.filter((t) => t !== "chat").slice(0, 2).map((t) => TASK_LABEL[t]).join(" + ");
	const where = fit === "gpu" ? "fully on GPU" : fit === "hybrid" ? "GPU + RAM offload" : "CPU RAM";
	const card = specs.unified ? `${specs.ramGb} GB unified` : `${specs.vramGb} GB VRAM`;
	return `${quant.name} is ${quant.vramGb} GB · ${where} on ${card}${task ? ` · ${task}` : ""}`;
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
function matchModels(specs, prefer) {
	const fits = [];
	for (const model of MODELS) {
		const found = bestQuant(model, specs);
		if (!found) continue;
		const { quant, fit, headroomGb } = found;
		fits.push({
			model,
			quant,
			fit,
			headroomGb,
			score: scoreFit(model, fit, quant, headroomGb, prefer),
			why: why(model, fit, quant, specs),
			speed: speedHint(fit, specs, model)
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
	return {
		specs,
		picks,
		also,
		blurb: gpuPicks ? `${gpuPicks} of ${picks.length} run fully on this machine. Bigger weights exist — they just do not fit.` : picks.length ? "Nothing here sits fully in VRAM. These are the least-painful offload / CPU options." : "This machine is below the floor for current open-weight LLMs. Try a 3B Q4 on CPU, or add RAM."
	};
}
var GPU_VRAM = [
	{
		re: /rtx\s*5090/i,
		name: "RTX 5090",
		vram: 32
	},
	{
		re: /rtx\s*5080/i,
		name: "RTX 5080",
		vram: 16
	},
	{
		re: /rtx\s*5070\s*ti/i,
		name: "RTX 5070 Ti",
		vram: 16
	},
	{
		re: /rtx\s*5070/i,
		name: "RTX 5070",
		vram: 12
	},
	{
		re: /rtx\s*4090/i,
		name: "RTX 4090",
		vram: 24
	},
	{
		re: /rtx\s*4080\s*super/i,
		name: "RTX 4080 Super",
		vram: 16
	},
	{
		re: /rtx\s*4080/i,
		name: "RTX 4080",
		vram: 16
	},
	{
		re: /rtx\s*4070\s*ti\s*super/i,
		name: "RTX 4070 Ti Super",
		vram: 16
	},
	{
		re: /rtx\s*4070\s*ti/i,
		name: "RTX 4070 Ti",
		vram: 12
	},
	{
		re: /rtx\s*4070\s*super/i,
		name: "RTX 4070 Super",
		vram: 12
	},
	{
		re: /rtx\s*4070/i,
		name: "RTX 4070",
		vram: 12
	},
	{
		re: /rtx\s*4060\s*ti\s*16/i,
		name: "RTX 4060 Ti 16GB",
		vram: 16
	},
	{
		re: /rtx\s*4060\s*ti/i,
		name: "RTX 4060 Ti",
		vram: 8
	},
	{
		re: /rtx\s*4060/i,
		name: "RTX 4060",
		vram: 8
	},
	{
		re: /rtx\s*3090\s*ti/i,
		name: "RTX 3090 Ti",
		vram: 24
	},
	{
		re: /rtx\s*3090/i,
		name: "RTX 3090",
		vram: 24
	},
	{
		re: /rtx\s*3080\s*ti/i,
		name: "RTX 3080 Ti",
		vram: 12
	},
	{
		re: /rtx\s*3080/i,
		name: "RTX 3080",
		vram: 10
	},
	{
		re: /rtx\s*3070\s*ti/i,
		name: "RTX 3070 Ti",
		vram: 8
	},
	{
		re: /rtx\s*3070/i,
		name: "RTX 3070",
		vram: 8
	},
	{
		re: /rtx\s*3060\s*ti/i,
		name: "RTX 3060 Ti",
		vram: 8
	},
	{
		re: /rtx\s*3060/i,
		name: "RTX 3060",
		vram: 12
	},
	{
		re: /rtx\s*3050/i,
		name: "RTX 3050",
		vram: 8
	},
	{
		re: /rx\s*7900\s*xtx/i,
		name: "RX 7900 XTX",
		vram: 24
	},
	{
		re: /rx\s*7900\s*xt/i,
		name: "RX 7900 XT",
		vram: 20
	},
	{
		re: /rx\s*7800\s*xt/i,
		name: "RX 7800 XT",
		vram: 16
	},
	{
		re: /rx\s*7600/i,
		name: "RX 7600",
		vram: 8
	},
	{
		re: /arc\s*b580/i,
		name: "Arc B580",
		vram: 12
	},
	{
		re: /arc\s*a770/i,
		name: "Arc A770",
		vram: 16
	},
	{
		re: /a100\s*80/i,
		name: "A100 80GB",
		vram: 80
	},
	{
		re: /a100/i,
		name: "A100",
		vram: 40
	},
	{
		re: /h100/i,
		name: "H100",
		vram: 80
	},
	{
		re: /h200/i,
		name: "H200",
		vram: 141
	},
	{
		re: /l40s/i,
		name: "L40S",
		vram: 48
	},
	{
		re: /rtx\s*a6000|rtx\s*6000\s*ada/i,
		name: "RTX 6000 Ada",
		vram: 48
	}
];
function appleChip(text) {
	const m = text.match(/\b(M[1-5](?:\s*(?:Pro|Max|Ultra))?)\b/i);
	if (!m) return null;
	return {
		name: `Apple ${m[1].replace(/\s+/g, " ")}`,
		unified: true
	};
}
function numGb(text, patterns) {
	for (const re of patterns) {
		const m = text.match(re);
		if (!m) continue;
		const n = Number(m[1] ?? m[2]);
		if (Number.isFinite(n) && n > 0 && n < 2048) return n;
	}
	return null;
}
function parseSpecsHeuristic(text) {
	const raw = text.trim();
	if (!raw) return null;
	const apple = appleChip(raw);
	const gpuHit = GPU_VRAM.find((g) => g.re.test(raw));
	const vramFromText = numGb(raw, [
		/(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s*(?:vram|video|dedicated)/i,
		/vram[:\s]+(\d+(?:\.\d+)?)\s*(?:gb|gi?b)/i,
		/dedicated\s*(?:gpu|video)?\s*memory[:\s]+(\d+(?:\.\d+)?)/i
	]);
	const ramFromText = numGb(raw, [
		/(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s*(?:(?:of\s+)?(?:system\s+)?ram|memory|ddr[45]|unified)/i,
		/(?:system\s+)?(?:ram|memory)[:\s]+(\d+(?:\.\d+)?)\s*(?:gb|gi?b)/i,
		/installed\s+physical\s+memory[^0-9]*(\d+(?:\.\d+)?)/i,
		/(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s+unified/i
	]);
	let os = "unknown";
	if (/windows|win\s*1[01]|dxdiag/i.test(raw)) os = "Windows";
	else if (/macos|os\s*x|darwin|apple\s+m\d/i.test(raw)) os = "macOS";
	else if (/linux|ubuntu|fedora|arch|debian|nixos/i.test(raw)) os = "Linux";
	const cpu = raw.match(/((?:intel|amd|apple)\s+(?:core\s+)?(?:i[3579]|ryzen|xeon|epyc|m[1-5])[^\n,]{0,40})/i)?.[1]?.trim() ?? (apple ? apple.name : "unknown");
	const gpuCount = Math.max(1, (raw.match(/rtx\s*\d{4}/gi) ?? []).length > 1 ? 2 : 1);
	const unified = Boolean(apple);
	const gpu = apple?.name ?? gpuHit?.name ?? (vramFromText ? "discrete GPU" : "none");
	const vramGb = unified ? ramFromText ?? 16 : vramFromText ?? gpuHit?.vram ?? 0;
	const ramGb = ramFromText ?? (unified ? vramGb : 16);
	if (!gpuHit && !apple && vramFromText == null && ramFromText == null) {
		if (!raw.match(/\b(\d{1,3})\s*gb\b/i)) return null;
	}
	return {
		gpu,
		vramGb,
		ramGb,
		cpu,
		os,
		unified,
		gpuCount: gpuHit || apple ? gpuCount : 0,
		source: "paste",
		raw: raw.slice(0, 4e3)
	};
}
function specsFromUnknown(data) {
	return {
		gpu: data.gpu || "unknown",
		vramGb: Number(data.vramGb) || 0,
		ramGb: Number(data.ramGb) || 16,
		cpu: data.cpu || "unknown",
		os: data.os || "unknown",
		unified: Boolean(data.unified),
		gpuCount: Number(data.gpuCount) || (data.vramGb ? 1 : 0),
		source: data.source || "paste",
		raw: data.raw
	};
}
var matchHardware_createServerFn_handler = createServerRpc({
	id: "e271323a77e71d3096f944cf1828bcbfd3ffbbec40ca9b0f9e18f73fc5fb9a76",
	name: "matchHardware",
	filename: "src/lib/server/match.ts"
}, (opts) => matchHardware.__executeServer(opts));
var matchHardware = createServerFn({ method: "POST" }).validator((input) => input).handler(matchHardware_createServerFn_handler, async ({ data }) => {
	if (data.presetSpecs) return matchModels(data.presetSpecs, data.prefer);
	const text = (data.text ?? "").slice(0, 8e3);
	const image = data.imageDataUrl?.startsWith("data:image/") ? data.imageDataUrl.slice(0, 9e5) : void 0;
	if (!text && !image) return { error: "Paste specs or drop a screenshot first." };
	let specs = text ? parseSpecsHeuristic(text) : null;
	const ai = await grokJson({
		maxTokens: 400,
		imageDataUrl: image,
		prompt: `Extract PC / Mac hardware for local LLM VRAM matching.
Return JSON:
{"gpu":string,"vramGb":number,"ramGb":number,"cpu":string,"os":string,"unified":boolean,"gpuCount":number}
Rules:
- unified=true for Apple Silicon (M1–M5). Then vramGb = ramGb = total unified memory.
- vramGb is dedicated GPU memory in GB. 0 if none.
- If a GPU name implies VRAM (RTX 4090=24, 4070=12, 3060=12, 5090=32) and VRAM is missing, fill it.
- gpuCount is number of discrete GPUs, 0 if none.
- Ignore monitors, disks, and peripherals.
${text ? `SPECS TEXT:\n${text}` : "Read the screenshot of Task Manager / About This Mac / dxdiag / neofetch / GPU-Z."}`
	});
	if (ai.ok) specs = specsFromUnknown({
		...ai.data,
		source: image ? "screenshot" : "paste",
		raw: text
	});
	if (!specs) return { error: "Could not read those specs. Name the GPU and RAM, e.g. “RTX 4070 12GB, 32GB RAM”." };
	return matchModels(specs, data.prefer);
});
//#endregion
export { matchHardware_createServerFn_handler };
