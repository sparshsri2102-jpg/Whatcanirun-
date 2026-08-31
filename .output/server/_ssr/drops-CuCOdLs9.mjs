import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drops-CuCOdLs9.js
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
var getRssFeedXml_createServerFn_handler = createServerRpc({
	id: "7575e7289b9d9fdbe0ea30f57754748e0491cacec1b712a9e1af873c24faed46",
	name: "getRssFeedXml",
	filename: "src/lib/server/drops.ts"
}, (opts) => getRssFeedXml.__executeServer(opts));
var getRssFeedXml = createServerFn({ method: "GET" }).handler(getRssFeedXml_createServerFn_handler, async () => {
	const drops = await listDrops();
	return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>What Can I Run? - Open-Weight Model Drops</title>
  <link>https://whatcanirun.dev/drops</link>
  <description>Live stream of new open-weight LLMs, GGUF quants, and llama.cpp releases.</description>
  <language>en-us</language>
  <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
  <atom:link href="https://whatcanirun.dev/drops/rss" rel="self" type="application/rss+xml" />
  ${drops.slice(0, 25).map((d) => `
    <item>
      <title><![CDATA[${d.name} [${d.source.toUpperCase()}]]]></title>
      <link>${d.url}</link>
      <guid>${d.url}</guid>
      <pubDate>${new Date(d.when).toUTCString()}</pubDate>
      <description><![CDATA[${d.summary} · ${d.tags.join(", ")} · Likes: ${d.likes}${d.downloads ? ` · Downloads: ${d.downloads}` : ""}]]></description>
    </item>`).join("")}
</channel>
</rss>`;
});
var sendWebhookTest_createServerFn_handler = createServerRpc({
	id: "1b40b08eeab31fb674b55215b4db668ba7fc638fd7322a443208d339ddd7a2ff",
	name: "sendWebhookTest",
	filename: "src/lib/server/drops.ts"
}, (opts) => sendWebhookTest.__executeServer(opts));
var sendWebhookTest = createServerFn({ method: "POST" }).validator((d) => d).handler(sendWebhookTest_createServerFn_handler, async ({ data }) => {
	const { webhookUrl, vramTierGb } = data;
	if (!webhookUrl || !webhookUrl.startsWith("http")) return {
		ok: false,
		error: "Please enter a valid HTTP(S) Discord or Slack webhook URL."
	};
	try {
		const payload = {
			content: `🚨 **[What Can I Run?] New Open-Weight Model Alert**`,
			embeds: [{
				title: "🔥 Qwen3.8-27B-GGUF (Unsloth)",
				url: "https://huggingface.co/unsloth/Qwen3.8-27B-GGUF",
				description: `A new high-demand GGUF drop was detected! Sized for your hardware filter (${vramTierGb ? `≤${vramTierGb} GB VRAM` : "All models"}).`,
				color: 5814783,
				fields: [
					{
						name: "Quant Formats",
						value: "Q4_K_M (17.2 GB), Q5_K_M (20.1 GB), Q8_0 (29.8 GB)",
						inline: true
					},
					{
						name: "Context Window",
						value: "256k tokens",
						inline: true
					},
					{
						name: "Compatibility",
						value: "Ollama, LM Studio, llama.cpp, vLLM",
						inline: false
					}
				],
				footer: { text: "whatcanirun.dev · automated model drop alerts" },
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}]
		};
		const res = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		if (!res.ok) return {
			ok: false,
			error: `Webhook returned HTTP ${res.status}. Verify webhook URL permissions.`
		};
		return {
			ok: true,
			message: "Test alert successfully delivered to webhook!"
		};
	} catch {
		return {
			ok: false,
			error: "Failed to connect to webhook endpoint."
		};
	}
});
//#endregion
export { getRssFeedXml_createServerFn_handler, listDrops_createServerFn_handler, sendWebhookTest_createServerFn_handler };
