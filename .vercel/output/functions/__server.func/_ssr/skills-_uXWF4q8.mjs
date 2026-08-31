import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as grokJson } from "./xai-DfxfEhHz.mjs";
import { t as searchLocalSkills } from "./catalog-CRaP_Poh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills-_uXWF4q8.js
var starCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 36e5;
async function fetchLiveRepoStars(repo, fallbackStars) {
	const cached = starCache.get(repo);
	if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.stars;
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2e3);
		const res = await fetch(`https://api.github.com/repos/${repo}`, {
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "whatcanirun-skills/1.0"
			},
			signal: controller.signal
		});
		clearTimeout(timeout);
		if (res.ok) {
			const json = await res.json();
			if (typeof json.stargazers_count === "number" && json.stargazers_count > 0) {
				starCache.set(repo, {
					stars: json.stargazers_count,
					at: Date.now()
				});
				return json.stargazers_count;
			}
		}
	} catch {}
	return cached ? cached.stars : fallbackStars;
}
async function githubSearch(q) {
	try {
		const cleanQ = q.replace(/[^a-zA-Z0-9\s-]/g, " ").trim();
		if (!cleanQ) return [];
		const query = encodeURIComponent(`${cleanQ} (SKILL.md OR "agent skill" OR "claude skill" OR topic:claude-skills OR topic:agent-skills)`);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2500);
		const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=8`, {
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "whatcanirun-skills/1.0"
			},
			signal: controller.signal
		});
		clearTimeout(timeout);
		if (!res.ok) return [];
		return ((await res.json()).items ?? []).map((r) => {
			starCache.set(r.full_name, {
				stars: r.stargazers_count,
				at: Date.now()
			});
			return {
				id: `gh:${r.full_name}`,
				name: r.full_name.split("/")[1] ?? r.full_name,
				repo: r.full_name,
				url: r.html_url,
				stars: r.stargazers_count,
				description: r.description || "GitHub open agent skill & workflow repository.",
				tags: ["github", "agent-skill"],
				role: "GitHub Skill",
				category: "engineering",
				origin: "github",
				matchReason: `GitHub live repository: ${r.full_name}`,
				matchScore: Math.round(50 + Math.log10(r.stargazers_count || 10) * 10)
			};
		});
	} catch {
		return [];
	}
}
var searchSkills_createServerFn_handler = createServerRpc({
	id: "0f6958fd4d867134aee86748ef9d51f24deaf4ebaa1d51f524d4d942bc11bd4a",
	name: "searchSkills",
	filename: "src/lib/server/skills.ts"
}, (opts) => searchSkills.__executeServer(opts));
var searchSkills = createServerFn({ method: "POST" }).validator((input) => input).handler(searchSkills_createServerFn_handler, async ({ data }) => {
	const query = (data?.query ?? "").trim().slice(0, 240);
	const rawLocalHits = searchLocalSkills(query).map((s) => ({
		...s,
		origin: "catalog"
	}));
	const localHits = await Promise.all(rawLocalHits.map(async (skill) => {
		const liveStars = await fetchLiveRepoStars(skill.repo, skill.stars);
		return {
			...skill,
			stars: liveStars
		};
	}));
	if (!query) {
		localHits.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || b.stars - a.stars);
		return localHits;
	}
	let searchKeywords = query;
	try {
		const ai = await grokJson({
			maxTokens: 100,
			prompt: `Convert this skill request into 2-4 GitHub repository search terms. Focus on role, engineering domain, and agent skills.
Request: ${query}
JSON: {"keywords":"..."}`
		});
		if (ai.ok && ai.data?.keywords) searchKeywords = ai.data.keywords;
	} catch {}
	const remote = await githubSearch(searchKeywords).catch(() => []);
	const seen = /* @__PURE__ */ new Set();
	const merged = [];
	for (const s of [...localHits, ...remote]) {
		const key = s.repo.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(s);
	}
	merged.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || b.stars - a.stars);
	return merged.slice(0, 25);
});
//#endregion
export { searchSkills_createServerFn_handler };
