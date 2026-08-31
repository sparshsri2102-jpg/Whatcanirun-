import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as matchModels } from "./match-D4FNJ2sp.mjs";
import { n as specsFromUnknown, t as parseSpecsHeuristic } from "./parse-specs-C1H6yj3R.mjs";
import { t as grokJson } from "./xai-DfxfEhHz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/match-Db2Xl88i.js
var matchHardware_createServerFn_handler = createServerRpc({
	id: "e271323a77e71d3096f944cf1828bcbfd3ffbbec40ca9b0f9e18f73fc5fb9a76",
	name: "matchHardware",
	filename: "src/lib/server/match.ts"
}, (opts) => matchHardware.__executeServer(opts));
var matchHardware = createServerFn({ method: "POST" }).validator((input) => input).handler(matchHardware_createServerFn_handler, async ({ data }) => {
	if (data.presetSpecs) return matchModels(data.presetSpecs, data.prefer, data.contextK ?? 8);
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
	return matchModels(specs, data.prefer, data.contextK ?? 8);
});
//#endregion
export { matchHardware_createServerFn_handler };
