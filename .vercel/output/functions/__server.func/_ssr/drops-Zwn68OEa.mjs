import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drops-Zwn68OEa.js
var cache = null;
var TTL = 12e4;
var KNOWN = [
	"qwen/",
	"meta-llama/",
	"google/",
	"mistralai/",
	"zai-org/",
	"deepseek-ai/",
	"unsloth/",
	"ggml-org/",
	"microsoft/",
	"nvidia/",
	"tencent/",
	"openai/",
	"black-forest-labs/",
	"stabilityai/",
	"huggingface/",
	"ibm-granite/",
	"allenai/",
	"openbmb/",
	"opengvlab/",
	"coherelabs/"
];
async function fetchHf(url) {
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) return [];
	const json = await res.json();
	return Array.isArray(json) ? json : [];
}
async function fetchGithub() {
	const queries = [
		"gguf stars:>20",
		"llama.cpp stars:>50",
		"topic:gguf"
	];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of queries) {
		const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(raw)}&sort=updated&order=desc&per_page=8`, { headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "canirunthis/1.0"
		} });
		if (!res.ok) continue;
		const json = await res.json();
		for (const r of json.items ?? []) {
			if (seen.has(r.full_name)) continue;
			seen.add(r.full_name);
			out.push({
				id: `gh:${r.full_name}`,
				name: r.full_name,
				source: "github",
				url: r.html_url,
				likes: r.stargazers_count,
				stars: r.stargazers_count,
				when: r.updated_at,
				tags: r.topics ?? [],
				summary: r.description || "Open-weight related repository."
			});
		}
	}
	out.sort((a, b) => +new Date(b.when) - +new Date(a.when));
	return out;
}
function notable(m) {
	const id = (m.id ?? "").toLowerCase();
	if (KNOWN.some((k) => id.startsWith(k))) return true;
	const likes = m.likes ?? 0;
	const downloads = m.downloads ?? 0;
	return likes >= 20 || downloads >= 500;
}
var listDrops_createServerFn_handler = createServerRpc({
	id: "0f20ea8d88e6bca0e347ae704b101ad632c0e28596608d962176764d0f59d589",
	name: "listDrops",
	filename: "src/lib/server/drops.ts"
}, (opts) => listDrops.__executeServer(opts));
var listDrops = createServerFn({ method: "GET" }).handler(listDrops_createServerFn_handler, async () => {
	if (cache && Date.now() - cache.at < TTL) return cache.items;
	const [trending, recent, gguf, github] = await Promise.all([
		fetchHf("https://huggingface.co/api/models?sort=likes&limit=24&pipeline_tag=text-generation"),
		fetchHf("https://huggingface.co/api/models?sort=lastModified&limit=40&pipeline_tag=text-generation"),
		fetchHf("https://huggingface.co/api/models?sort=lastModified&limit=24&filter=gguf"),
		fetchGithub().catch(() => [])
	]);
	const seen = /* @__PURE__ */ new Set();
	const hfItems = [];
	for (const m of [
		...trending,
		...recent,
		...gguf
	]) {
		if (!m.id || seen.has(m.id) || !notable(m)) continue;
		seen.add(m.id);
		hfItems.push({
			id: `hf:${m.id}`,
			name: m.id,
			source: "huggingface",
			url: `https://huggingface.co/${m.id}`,
			likes: m.likes ?? 0,
			downloads: m.downloads ?? 0,
			when: m.lastModified ?? (/* @__PURE__ */ new Date()).toISOString(),
			tags: (m.tags ?? []).slice(0, 6),
			summary: m.pipeline_tag || "model"
		});
	}
	hfItems.sort((a, b) => +new Date(b.when) - +new Date(a.when));
	const items = [...hfItems.slice(0, 28), ...github.slice(0, 10)];
	cache = {
		at: Date.now(),
		items
	};
	return items;
});
//#endregion
export { listDrops_createServerFn_handler };
