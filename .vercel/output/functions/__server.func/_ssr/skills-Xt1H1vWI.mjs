import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as createSsrRpc, t as SiteShell } from "./site-shell-CbHb2Jlq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills-Xt1H1vWI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var searchSkills = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("0f6958fd4d867134aee86748ef9d51f24deaf4ebaa1d51f524d4d942bc11bd4a"));
var EXAMPLES = [
	"I want a skill that can work as my CMO",
	"act as a staff SRE during incidents",
	"product manager who writes PRDs",
	"security review for a web app",
	"technical writer for API docs"
];
function SkillsPage() {
	const [q, setQ] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [hits, setHits] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	async function run(query) {
		setBusy(true);
		setError(null);
		try {
			const rows = await searchSkills({ data: { query } });
			setHits(rows);
		} catch {
			setError("Search failed. Showing nothing new.");
		} finally {
			setBusy(false);
		}
	}
	(0, import_react.useEffect)(() => {
		run("");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "find skill"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl",
			children: "describe the job. get the skill."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
			children: "Agent skills from GitHub, ranked by stars. Say what you want in plain language — “be my CMO”, “review this like appsec”, “write the PRD”."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-6 flex flex-col gap-3 sm:flex-row",
			onSubmit: (e) => {
				e.preventDefault();
				run(q);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "I want a skill that can work as my CMO",
				className: "min-h-12 flex-1 border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				disabled: busy,
				className: "min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg disabled:opacity-50",
				children: busy ? "ranking…" : "rank skills"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: EXAMPLES.map((ex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-11 border border-line px-3 text-left text-xs text-muted hover:text-fg",
				onClick: () => {
					setQ(ex);
					run(ex);
				},
				children: ex
			}, ex))
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 divide-y divide-line border border-line",
			children: (hits ?? []).map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: s.url,
				target: "_blank",
				rel: "noreferrer",
				className: "grid gap-2 px-4 py-4 hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:items-baseline",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xs tabular-nums text-muted",
						children: String(i + 1).padStart(2, "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm",
							children: [
								s.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: ["· ", s.repo]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-relaxed text-muted",
							children: s.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 text-2xs uppercase tracking-widest text-dim",
							children: [
								s.origin,
								" · ",
								s.role,
								" · ",
								s.tags.slice(0, 4).join(" · ")
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs tabular-nums text-fg",
						children: [s.stars.toLocaleString(), " stars"]
					})
				]
			}, s.id))
		})
	] });
}
//#endregion
export { SkillsPage as component };
