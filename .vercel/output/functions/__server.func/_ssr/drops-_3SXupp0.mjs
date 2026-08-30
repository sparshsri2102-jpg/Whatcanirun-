import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as createSsrRpc, t as SiteShell } from "./site-shell-CbHb2Jlq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drops-_3SXupp0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listDrops = createServerFn({ method: "GET" }).handler(createSsrRpc("0f20ea8d88e6bca0e347ae704b101ad632c0e28596608d962176764d0f59d589"));
function timeAgo(iso) {
	const ms = Date.now() - Date.parse(iso);
	if (!Number.isFinite(ms) || ms < 0) return "just now";
	const m = Math.floor(ms / 6e4);
	if (m < 1) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 48) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}
function DropsPage() {
	const [items, setItems] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let n = 0;
		const load = () => {
			listDrops().then((rows) => {
				setItems(rows);
				setError(null);
			}).catch(() => {
				if (!n) setError("Could not reach Hugging Face / GitHub right now.");
			});
			n += 1;
		};
		load();
		const id = window.setInterval(load, 9e4);
		return () => window.clearInterval(id);
	}, []);
	const hf = items?.filter((i) => i.source === "huggingface") ?? [];
	const gh = items?.filter((i) => i.source === "github") ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "live feed"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl",
			children: "open-weight drops"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
			children: "Hugging Face text-generation + GGUF, filtered for known labs and anything with real likes. GitHub repos tagged gguf / llama.cpp / open-weight from the last weeks. Refreshes on its own."
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: error
		}) : null,
		!items ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-sm text-muted",
			children: "listening…"
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-10 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm uppercase tracking-[0.22em] text-muted",
				children: "huggingface"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 divide-y divide-line border border-line",
				children: hf.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: d.url,
					target: "_blank",
					rel: "noreferrer",
					className: "block px-4 py-3 hover:bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "break-all text-sm",
							children: d.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 text-2xs tabular-nums text-muted",
							children: timeAgo(d.when)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-xs text-muted",
						children: [
							d.likes,
							" likes",
							d.downloads ? ` · ${d.downloads.toLocaleString()} dl` : "",
							" · ",
							d.summary
						]
					})]
				}, d.id))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm uppercase tracking-[0.22em] text-muted",
				children: "github"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 divide-y divide-line border border-line",
				children: gh.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: d.url,
					target: "_blank",
					rel: "noreferrer",
					className: "block px-4 py-3 hover:bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "break-all text-sm",
							children: d.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 text-2xs tabular-nums text-muted",
							children: timeAgo(d.when)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-xs text-muted",
						children: [
							d.stars ?? d.likes,
							" stars · ",
							d.summary
						]
					})]
				}, d.id))
			})] })]
		})
	] });
}
//#endregion
export { DropsPage as component };
