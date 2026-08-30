import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as SiteShell } from "./site-shell-CbHb2Jlq.mjs";
import { t as MODELS } from "./catalog-Behu-X92.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/models-JjpXeCRV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "all",
		label: "all"
	},
	{
		id: "chat",
		label: "chat"
	},
	{
		id: "code",
		label: "code"
	},
	{
		id: "reason",
		label: "reason"
	},
	{
		id: "vision",
		label: "vision"
	},
	{
		id: "image",
		label: "image"
	},
	{
		id: "audio",
		label: "audio"
	},
	{
		id: "agent",
		label: "agent"
	}
];
function ModelsPage() {
	const [q, setQ] = (0, import_react.useState)("");
	const [task, setTask] = (0, import_react.useState)("all");
	const [vram, setVram] = (0, import_react.useState)(0);
	const rows = (0, import_react.useMemo)(() => {
		return MODELS.filter((m) => {
			if (task !== "all" && !m.tasks.includes(task)) return false;
			if (vram && m.quants.every((x) => x.vramGb > vram)) return false;
			if (q) {
				if (!`${m.name} ${m.org} ${m.summary} ${m.license}`.toLowerCase().includes(q.toLowerCase())) return false;
			}
			return true;
		}).sort((a, b) => b.quality - a.quality);
	}, [
		q,
		task,
		vram
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "catalog"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl",
			children: "every model we match against"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
			children: "Curated open-weight catalog with GGUF sizes. Live Hugging Face noise lives on drops. Filter by VRAM ceiling to see what a card can hold at Q4."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-3 sm:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "search name, org, license",
				className: "min-h-12 flex-1 border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex min-h-12 items-center gap-3 border border-line bg-surface px-3 text-xs text-muted",
				children: ["max VRAM", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: vram,
					onChange: (e) => setVram(Number(e.target.value)),
					className: "bg-transparent text-fg focus:outline-none",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 0,
							children: "any"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 8,
							children: "8 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 12,
							children: "12 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 16,
							children: "16 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 24,
							children: "24 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 32,
							children: "32 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 64,
							children: "64 GB"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 128,
							children: "128 GB"
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTask(f.id),
				className: cn("min-h-11 border px-3 text-xs uppercase tracking-widest", task === f.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"),
				children: f.label
			}, f.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 text-xs text-muted",
			children: [rows.length, " models"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 divide-y divide-line border border-line",
			children: rows.map((m) => {
				const q4 = m.quants.find((x) => x.name === "Q4") ?? m.quants[0];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xs uppercase tracking-widest text-muted",
							children: m.org
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-base",
							children: m.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: m.summary
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: m.hf,
									className: "underline underline-offset-4",
									target: "_blank",
									rel: "noreferrer",
									children: "huggingface"
								}),
								m.gguf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: m.gguf,
									className: "underline underline-offset-4",
									target: "_blank",
									rel: "noreferrer",
									children: "GGUF"
								}) : null,
								m.run.ollama ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "text-muted",
									children: m.run.ollama
								}) : null
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid grid-cols-2 gap-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-dim",
								children: "params"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: m.params })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-dim",
								children: "license"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: m.license })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-dim",
								children: "Q4-ish"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular-nums",
								children: q4 ? `${q4.vramGb} GB` : "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-dim",
								children: "context"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: m.contextK ? `${m.contextK}k` : "n/a" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-dim",
									children: "tasks"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: m.tasks.join(" · ") })]
							})
						]
					})]
				}, m.id);
			})
		})
	] });
}
//#endregion
export { ModelsPage as component };
