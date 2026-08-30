import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as grokJson } from "./xai-BGj4Qahd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills-UKrbhgrr.js
var SKILLS = [
	{
		id: "cmo-growth",
		name: "CMO / growth operator",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "C-level advisory pack: positioning, campaign briefs, brand voice, funnel copy, and a marketing org in markdown.",
		tags: [
			"cmo",
			"marketing",
			"growth",
			"brand",
			"copy",
			"campaigns",
			"seo"
		],
		role: "CMO"
	},
	{
		id: "awesome-agent-skills",
		name: "Awesome Agent Skills",
		repo: "VoltAgent/awesome-agent-skills",
		url: "https://github.com/VoltAgent/awesome-agent-skills",
		stars: 4100,
		description: "Curated index of 1000+ agent skills for Claude Code, Codex, Cursor, Gemini CLI, Windsurf.",
		tags: [
			"index",
			"catalog",
			"claude",
			"cursor",
			"codex"
		],
		role: "directory"
	},
	{
		id: "awesome-claude-skills",
		name: "Awesome Claude Skills",
		repo: "travisvn/awesome-claude-skills",
		url: "https://github.com/travisvn/awesome-claude-skills",
		stars: 2800,
		description: "Hand-picked Claude skills, plugins, and workflow notes. Good starting map.",
		tags: [
			"claude",
			"index",
			"workflow"
		],
		role: "directory"
	},
	{
		id: "anthropic-skills",
		name: "Anthropic document skills",
		repo: "anthropics/skills",
		url: "https://github.com/anthropics/skills",
		stars: 8900,
		description: "Official docx / pptx / pdf / xlsx skills. The reference implementation of SKILL.md.",
		tags: [
			"docs",
			"pdf",
			"xlsx",
			"pptx",
			"office"
		],
		role: "ops"
	},
	{
		id: "superpowers",
		name: "Superpowers",
		repo: "obra/superpowers",
		url: "https://github.com/obra/superpowers",
		stars: 6400,
		description: "TDD, debugging, and collaboration skills that make coding agents less sloppy.",
		tags: [
			"engineering",
			"tdd",
			"debug",
			"code-review"
		],
		role: "CTO"
	},
	{
		id: "frontend-design",
		name: "Frontend design skill",
		repo: "anthropics/skills",
		url: "https://github.com/anthropics/skills",
		stars: 8900,
		description: "UI taste, layout, and anti-generic frontend direction for coding agents.",
		tags: [
			"design",
			"frontend",
			"ui",
			"css"
		],
		role: "design"
	},
	{
		id: "research-analyst",
		name: "Research analyst",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Competitive research, source triangulation, memo writing. A junior analyst in a folder.",
		tags: [
			"research",
			"analyst",
			"memo",
			"competitive"
		],
		role: "analyst"
	},
	{
		id: "product-manager",
		name: "Product manager",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "PRDs, spec writing, prioritization, user stories. Acts as a PM sitting next to you.",
		tags: [
			"pm",
			"product",
			"prd",
			"specs",
			"roadmap"
		],
		role: "PM"
	},
	{
		id: "cfo-finance",
		name: "CFO / finance ops",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Unit economics, runway, board-level finance language. Not a replacement for an accountant.",
		tags: [
			"cfo",
			"finance",
			"runway",
			"pricing"
		],
		role: "CFO"
	},
	{
		id: "legal-counsel",
		name: "Counsel-in-a-box",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Contract redlines, privacy checklists, open-source license triage. Still not your lawyer.",
		tags: [
			"legal",
			"contracts",
			"license",
			"privacy"
		],
		role: "counsel"
	},
	{
		id: "seo-content",
		name: "SEO + content engine",
		repo: "VoltAgent/awesome-agent-skills",
		url: "https://github.com/VoltAgent/awesome-agent-skills",
		stars: 4100,
		description: "Keyword briefs, outline, on-page, internal links. Pairs with the CMO pack.",
		tags: [
			"seo",
			"content",
			"writing",
			"blog"
		],
		role: "content"
	},
	{
		id: "sales-ae",
		name: "Account executive",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Outbound sequences, discovery questions, proposal drafts, objection handling.",
		tags: [
			"sales",
			"ae",
			"outbound",
			"gtm"
		],
		role: "AE"
	},
	{
		id: "sre-devops",
		name: "SRE / devops",
		repo: "travisvn/awesome-claude-skills",
		url: "https://github.com/travisvn/awesome-claude-skills",
		stars: 2800,
		description: "Incident notes, runbooks, CI, k8s, observability prompts packaged as skills.",
		tags: [
			"sre",
			"devops",
			"k8s",
			"ci",
			"oncall"
		],
		role: "SRE"
	},
	{
		id: "data-engineer",
		name: "Data engineer",
		repo: "VoltAgent/awesome-agent-skills",
		url: "https://github.com/VoltAgent/awesome-agent-skills",
		stars: 4100,
		description: "SQL, dbt-style modeling, pipeline debugging, warehouse hygiene.",
		tags: [
			"data",
			"sql",
			"dbt",
			"etl"
		],
		role: "data"
	},
	{
		id: "security-review",
		name: "Security review",
		repo: "obra/superpowers",
		url: "https://github.com/obra/superpowers",
		stars: 6400,
		description: "Threat model, dependency audit, secret-leak hunt, OWASP-style pass over a repo.",
		tags: [
			"security",
			"owasp",
			"audit",
			"appsec"
		],
		role: "security"
	},
	{
		id: "qa-tester",
		name: "QA / test engineer",
		repo: "obra/superpowers",
		url: "https://github.com/obra/superpowers",
		stars: 6400,
		description: "Test plans, Playwright flows, regression matrices generated from the product spec.",
		tags: [
			"qa",
			"testing",
			"playwright",
			"regression"
		],
		role: "QA"
	},
	{
		id: "technical-writer",
		name: "Technical writer",
		repo: "anthropics/skills",
		url: "https://github.com/anthropics/skills",
		stars: 8900,
		description: "Docs, changelogs, README surgery, API reference tone.",
		tags: [
			"docs",
			"writing",
			"readme",
			"api"
		],
		role: "writer"
	},
	{
		id: "recruiter",
		name: "Recruiter / hiring",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Scorecards, outreach, interview loops, debrief notes.",
		tags: [
			"hiring",
			"recruiter",
			"interview",
			"hr"
		],
		role: "recruiter"
	},
	{
		id: "customer-success",
		name: "Customer success",
		repo: "alirezarezvani/claude-skills",
		url: "https://github.com/alirezarezvani/claude-skills",
		stars: 5200,
		description: "Onboarding plans, QBR decks, churn-risk language, ticket macros.",
		tags: [
			"cs",
			"success",
			"onboarding",
			"support"
		],
		role: "CS"
	},
	{
		id: "brand-designer",
		name: "Brand designer",
		repo: "anthropics/skills",
		url: "https://github.com/anthropics/skills",
		stars: 8900,
		description: "Voice, visual system, naming, landing-page critique. Pairs with frontend-design.",
		tags: [
			"brand",
			"design",
			"identity",
			"voice"
		],
		role: "brand"
	}
];
function searchLocalSkills(query) {
	const q = query.toLowerCase().trim();
	if (!q) return [...SKILLS].sort((a, b) => b.stars - a.stars);
	const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 1);
	return SKILLS.map((s) => {
		const hay = `${s.name} ${s.role} ${s.description} ${s.tags.join(" ")} ${s.repo}`.toLowerCase();
		let n = 0;
		for (const w of words) {
			if (hay.includes(w)) n += 3;
			if (s.tags.some((t) => t === w)) n += 5;
			if (s.role.toLowerCase() === w) n += 8;
		}
		if (q.includes("cmo") && s.role === "CMO") n += 20;
		return {
			s,
			n
		};
	}).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || b.s.stars - a.s.stars).map((x) => x.s);
}
async function githubSearch(q) {
	const query = encodeURIComponent(`${q} (SKILL.md OR "claude skill" OR "agent skill" OR topic:claude-skills OR topic:agent-skills)`);
	const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`, { headers: {
		Accept: "application/vnd.github+json",
		"User-Agent": "canirunthis/1.0"
	} });
	if (!res.ok) return [];
	return ((await res.json()).items ?? []).map((r) => ({
		id: `gh:${r.full_name}`,
		name: r.full_name.split("/")[1] ?? r.full_name,
		repo: r.full_name,
		url: r.html_url,
		stars: r.stargazers_count,
		description: r.description || "GitHub skill / agent pack.",
		tags: ["github"],
		role: "github",
		origin: "github"
	}));
}
var searchSkills_createServerFn_handler = createServerRpc({
	id: "0f6958fd4d867134aee86748ef9d51f24deaf4ebaa1d51f524d4d942bc11bd4a",
	name: "searchSkills",
	filename: "src/lib/server/skills.ts"
}, (opts) => searchSkills.__executeServer(opts));
var searchSkills = createServerFn({ method: "POST" }).validator((input) => input).handler(searchSkills_createServerFn_handler, async ({ data }) => {
	const query = data.query.trim().slice(0, 240);
	if (!query) return searchLocalSkills("").map((s) => ({
		...s,
		origin: "catalog"
	}));
	let keywords = query;
	const ai = await grokJson({
		maxTokens: 120,
		prompt: `Turn this skill request into a short GitHub search string (3–7 keywords). Focus on role (CMO, SRE, PM), domain, and "claude skill" synonyms.
Request: ${query}
JSON: {"keywords":"..."}`
	});
	if (ai.ok && ai.data.keywords) keywords = ai.data.keywords;
	const local = searchLocalSkills(`${query} ${keywords}`).map((s) => ({
		...s,
		origin: "catalog"
	}));
	const remote = await githubSearch(keywords).catch(() => []);
	const seen = /* @__PURE__ */ new Set();
	const merged = [];
	for (const s of [...local, ...remote]) {
		const key = s.repo.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(s);
	}
	merged.sort((a, b) => b.stars - a.stars);
	return merged.slice(0, 16);
});
//#endregion
export { searchSkills_createServerFn_handler };
