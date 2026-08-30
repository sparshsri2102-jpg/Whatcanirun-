import { o as __toESM } from "../_runtime.mjs";
import { _ as Link, y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-shell-CbHb2Jlq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var listSponsors = createServerFn({ method: "GET" }).handler(createSsrRpc("609823e73f8ad04de7d6c8bd4c11d25f799c8fc9f55ab09acf45ef35f56ed8b2"));
var requestSponsor = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("50b1eb53820029655ea8dc105ced965adc7689b7241576868eefdff46ab685ab"));
var FALLBACK = [
	{
		id: 1,
		company: "LOCALWEIGHTS",
		url: "https://huggingface.co",
		tagline: "GGUF drops, ranked by what actually fits.",
		slot: "both"
	},
	{
		id: 2,
		company: "VRAMHAUS",
		url: "https://ollama.com",
		tagline: "Run the model. Skip the cloud bill.",
		slot: "both"
	},
	{
		id: 3,
		company: "NIGHTSHIFT GPU",
		url: "https://lmstudio.ai",
		tagline: "Desktop inference for people with a job in the morning.",
		slot: "both"
	},
	{
		id: 4,
		company: "OPENNODE",
		url: "https://github.com/ggml-org/llama.cpp",
		tagline: "The runtime the rest of the stack pretends to be.",
		slot: "both"
	},
	{
		id: 5,
		company: "SILICON ATTIC",
		url: "https://unsloth.ai",
		tagline: "Quants that still think.",
		slot: "both"
	}
];
function SponsorTicker({ position }) {
	const [sponsors, setSponsors] = (0, import_react.useState)(FALLBACK);
	(0, import_react.useEffect)(() => {
		listSponsors().then((rows) => {
			if (rows.length) setSponsors(rows);
		}).catch(() => {});
	}, []);
	const row = sponsors.filter((s) => s.slot === "both" || s.slot === position);
	const items = row.length ? row : FALLBACK;
	const loop = [
		...items,
		...items,
		...items,
		...items
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-b border-line bg-surface text-2xs uppercase tracking-[0.18em] text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-stretch",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/sponsor",
				className: "shrink-0 border-r border-line px-3 py-2 text-fg hover:bg-fg hover:text-bg",
				children: "sponsored"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative min-w-0 flex-1 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "marquee-track flex w-max items-center gap-10 py-2 pr-10",
					children: loop.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: s.url,
						target: "_blank",
						rel: "noreferrer",
						className: "whitespace-nowrap hover:text-fg",
						children: [
							s.company,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-3 text-dim",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "normal-case tracking-normal text-dim",
								children: s.tagline
							})
						]
					}, `${s.id}-${i}`))
				})
			})]
		})
	});
}
function project(lat, lng, rot, cx, cy, r) {
	const phi = lat * Math.PI / 180;
	const lam = lng * Math.PI / 180 + rot;
	const x = Math.cos(phi) * Math.sin(lam);
	const y = Math.sin(phi);
	const z = Math.cos(phi) * Math.cos(lam);
	if (z < 0) return null;
	return {
		col: Math.round(cx + x * r * 2.05),
		row: Math.round(cy - y * r),
		z
	};
}
function renderGlobe(rot, visitors, cols, rows) {
	const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));
	const cx = (cols - 1) / 2;
	const cy = (rows - 1) / 2;
	const r = Math.min(cols / 4.3, rows / 2.15) - .4;
	const set = (c, row, ch, pri, prio) => {
		if (row < 0 || row >= rows || c < 0 || c >= cols) return;
		if (pri >= (prio[row * cols + c] ?? 0)) {
			grid[row][c] = ch;
			prio[row * cols + c] = pri;
		}
	};
	const prio = new Array(rows * cols).fill(0);
	for (let row = 0; row < rows; row++) for (let c = 0; c < cols; c++) {
		const nx = (c - cx) / (r * 2.05);
		const ny = (cy - row) / r;
		const d = nx * nx + ny * ny;
		if (d > 1.02) continue;
		if (d > .96) {
			set(c, row, d > 1 ? "." : ":", 1, prio);
			continue;
		}
		const z = Math.sqrt(Math.max(0, 1 - d));
		const x = nx;
		const y = ny;
		const lam = Math.atan2(x, z) - rot;
		const phi = Math.asin(Math.max(-1, Math.min(1, y)));
		const lat = phi * 180 / Math.PI;
		const lon = (lam * 180 / Math.PI + 540) % 360 - 180;
		const land = Math.abs(Math.sin(phi * 3 + lon / 40)) * .45 + Math.abs(Math.cos(lon / 18 + phi * 2)) * .35 > .42;
		const meridian = Math.abs((lon + 180) % 30 - 0) < 1.2;
		const parallel = Math.abs(lat % 30) < 1.4;
		let ch = ".";
		if (land) ch = ":";
		if (meridian || parallel) ch = land ? "+" : ",";
		set(c, row, ch, 1, prio);
	}
	for (const v of visitors) {
		const p = project(v.lat, v.lng, rot, cx, cy, r);
		if (!p) continue;
		const ch = v.agoSec < 8 ? "@" : v.agoSec < 40 ? "*" : "+";
		set(p.col, p.row, ch, 5, prio);
	}
	return grid.map((row) => row.join("")).join("\n");
}
function AsciiGlobe({ visitors, width = 52, height = 24 }) {
	const [rot, setRot] = (0, import_react.useState)(.4);
	const reduce = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduce.current) return;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			const dt = now - last;
			last = now;
			setRot((r) => r + dt * 22e-5);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);
	const frame = (0, import_react.useMemo)(() => renderGlobe(rot, visitors, width, height), [
		rot,
		visitors,
		width,
		height
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
		"aria-hidden": "true",
		className: "overflow-hidden whitespace-pre font-mono text-[10px] leading-[1.05] text-fg sm:text-[11px]",
		children: frame
	});
}
var getVisitors = createServerFn({ method: "GET" }).handler(createSsrRpc("d6ccf6d0bbaae0347170620da947a906604559cde29ab3f0d7a932ebb5d5382b"));
var pingVisitor = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("24d50309f08a3565a4816e61411c6630d8150923748189a2c2efd2a7f578535c"));
function fmtCount(n) {
	return n.toLocaleString("en-US");
}
function agoLabel(sec) {
	if (sec < 5) return "now";
	if (sec < 60) return `${sec}s`;
	if (sec < 3600) return `${Math.floor(sec / 60)}m`;
	return `${Math.floor(sec / 3600)}h`;
}
function VisitorDock() {
	const [count, setCount] = (0, import_react.useState)(18420);
	const [live, setLive] = (0, import_react.useState)([]);
	const [you, setYou] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = () => {
			getVisitors().then((s) => {
				if (cancelled) return;
				setCount(s.monthCount);
				setLive(s.live);
			}).catch(() => {});
		};
		load();
		const id = window.setInterval(load, 8e3);
		const key = "cir-pinged";
		if (!sessionStorage.getItem(key)) {
			sessionStorage.setItem(key, "1");
			pingVisitor({ data: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone } }).then((r) => {
				if (!cancelled && r.ok) setYou(r.city);
				load();
			}).catch(() => {});
		}
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-t border-line bg-surface",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-[0.28em] text-muted",
					children: "live map"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-lg",
					children: "visitors this month"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-md text-sm leading-relaxed text-muted",
					children: "Coarse city from timezone only. No accounts, no IPs, no names. Dots are people who opened the page."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-baseline gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-3xl tabular-nums tracking-tight",
						children: fmtCount(count)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs uppercase tracking-widest text-muted",
						children: "this month"
					})]
				}),
				you ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-xs text-muted",
					children: [
						"you · ",
						you.toLowerCase(),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "dot-live",
							children: "@"
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-1 text-xs text-muted",
					children: live.slice(0, 6).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between gap-4 border-b border-line py-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: v.city.toLowerCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: agoLabel(v.agoSec)
						})]
					}, v.id))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto border border-line bg-bg p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AsciiGlobe, { visitors: live })
			})]
		})
	});
}
var NAV = [
	{
		to: "/",
		label: "this"
	},
	{
		to: "/models",
		label: "models"
	},
	{
		to: "/drops",
		label: "drops"
	},
	{
		to: "/skills",
		label: "skills"
	}
];
function SiteShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SponsorTicker, { position: "top" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "group block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xs uppercase tracking-[0.28em] text-muted",
							children: "open weights × hardware"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xl font-medium tracking-tight sm:text-2xl",
							children: ["can i run this", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "caret-blink text-muted",
								children: "_"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-wrap items-center gap-x-4 gap-y-2 text-sm",
						children: [NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							className: "text-muted hover:text-fg data-[status=active]:text-fg data-[status=active]:underline data-[status=active]:underline-offset-4",
							children: item.label
						}, item.to)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/sponsor",
							className: "whitespace-nowrap border border-line-strong px-3 py-2 text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg",
							children: "add sponsor"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisitorDock, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SponsorTicker, { position: "bottom" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-2xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "no account for visitors · companies sponsor the tape" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "estimates · Q4/Q5/Q8 GGUF · leave ~10% VRAM for KV cache" })]
				})
			})
		]
	});
}
//#endregion
export { createSsrRpc as n, requestSponsor as r, SiteShell as t };
