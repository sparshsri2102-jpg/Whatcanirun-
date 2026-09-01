import { n as PRESETS, t as MODELS } from "./catalog-ByDQjheB.mjs";
import { t as matchModels } from "./match-D4FNJ2sp.mjs";
import { _ as Link, y as require_jsx_runtime } from "../_libs/@tanstack/react-router_[...].mjs";
import { n as Route, r as SiteShell } from "./router-_1zSxGN-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/can._slug-B7CNr_be.js
var import_jsx_runtime = require_jsx_runtime();
function parseSlug(slug) {
	const parts = slug.toLowerCase().split("-on-");
	if (parts.length !== 2) return {
		modelId: null,
		presetId: null
	};
	const modelSlug = parts[0];
	const rigSlug = parts[1];
	const model = MODELS.find((m) => m.id === modelSlug || m.id.replaceAll(".", "-") === modelSlug);
	const preset = PRESETS.find((p) => p.id === rigSlug || rigSlug.startsWith(p.id));
	return {
		modelId: model?.id ?? null,
		presetId: preset?.id ?? null
	};
}
function CanPage() {
	const { slug } = Route.useParams();
	const { modelId, presetId } = parseSlug(slug);
	const model = modelId ? MODELS.find((m) => m.id === modelId) ?? null : null;
	const preset = presetId ? PRESETS.find((p) => p.id === presetId) ?? null : null;
	if (!model || !preset) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl",
			children: "Not found"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-muted",
			children: [
				"Try ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/models",
					className: "underline",
					children: "browse models"
				}),
				" or ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "underline",
					children: "check your rig"
				}),
				"."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-xs text-dim",
			children: "URL format: /can/qwen3-8b-on-rtx-4060"
		})
	] });
	const specs = {
		...preset.specs,
		source: "preset",
		raw: preset.label
	};
	const res = matchModels(specs, void 0, 8);
	const pick = res.picks.find((p) => p.model.id === model.id) ?? res.also.find((p) => p.model.id === model.id);
	const title = !!pick ? `Yes — ${model.name} runs on ${preset.label}` : `No — ${model.name} won't fit ${preset.label} at Q4`;
	const desc = pick ? `${model.name} (${model.params}) needs ${pick.quant.vramGb}GB VRAM at ${pick.quant.name} vs your ${preset.specs.vramGb || preset.specs.ramGb}GB ${preset.specs.unified ? "unified" : "VRAM"}. Estimated ${pick.speed}.` : `${model.name} needs ${model.quants[0]?.vramGb}GB+ and exceeds ${preset.label}. Try a smaller quant or model.`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "can i run · seo"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl leading-tight",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
			children: desc
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-dim",
			children: model.summary
		}),
		pick ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 border border-line bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-widest text-dim",
					children: "best fit on this rig"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "border border-fg bg-fg px-2 py-1 text-xs text-bg",
							children: [
								pick.quant.name,
								" · ",
								pick.quant.vramGb,
								"GB"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "border border-line px-2 py-1 text-xs text-muted",
							children: pick.fit === "gpu" ? "fits GPU" : pick.fit
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "border border-line px-2 py-1 text-xs text-muted",
							children: pick.speed
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 text-xs font-mono break-all bg-bg border border-line px-3 py-2",
					children: model.run.ollama || model.run.llamacpp || model.hf
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-3 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: model.hf,
						target: "_blank",
						rel: "noreferrer",
						className: "underline",
						children: "huggingface"
					}), model.gguf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: model.gguf,
						target: "_blank",
						rel: "noreferrer",
						className: "underline",
						children: "GGUF"
					}) : null]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 border border-line bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-sm",
				children: [
					"Alternatives that do fit ",
					preset.label,
					":"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: res.picks.slice(0, 4).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: `/can/${p.model.id}-on-${preset.id}`,
					className: "border border-line px-2 py-1 text-xs hover:border-fg",
					children: [
						p.model.name,
						" · ",
						p.quant.name
					]
				}, p.model.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 border-t border-line pt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-widest text-dim",
					children: "faq"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-2 text-sm font-medium",
					children: [
						"Can ",
						model.name,
						" run on ",
						preset.label,
						"?"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted leading-relaxed",
					children: [
						desc,
						" Model context ",
						model.contextK,
						"k. Compare with ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/models",
							className: "underline",
							children: "all models"
						}),
						" or re-check with your exact specs on ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "underline",
							children: "the bench"
						}),
						"."
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 text-xs",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "underline",
				children: "Check your own rig →"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
			type: "application/ld+json",
			dangerouslySetInnerHTML: { __html: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "FAQPage",
				"mainEntity": [{
					"@type": "Question",
					"name": `Can ${model.name} run on ${preset.label}?`,
					"acceptedAnswer": {
						"@type": "Answer",
						"text": desc
					}
				}]
			}) }
		})
	] });
}
//#endregion
export { CanPage as component };
