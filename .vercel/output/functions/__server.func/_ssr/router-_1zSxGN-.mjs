import { o as __toESM } from "../_runtime.mjs";
import { _ as Link, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, v as useRouter, y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router_[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-_1zSxGN-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-lg font-medium",
			children: "something went wrong"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-md text-sm break-words text-muted",
			children: error.message || "An unexpected error occurred. Try reloading the page."
		})]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-BOlVT8o8.css";
var APP_NAME = "What Can I Run";
var Route$7 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Paste your PC specs to discover which open-weight AI models fit your hardware, with download links, run commands, and live drops."
			},
			{
				name: "theme-color",
				content: "#0a0a0a"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg font-mono",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter$5 = () => import("./routes-u2yONuir.mjs");
var Route$6 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./drops-ir_Pj0CA.mjs");
var Route$5 = createFileRoute("/drops")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./models-ChrjASzw.mjs");
var Route$4 = createFileRoute("/models")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./share-CLo4pW7D.mjs");
var Route$3 = createFileRoute("/share")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./skills-VTXaCCPI.mjs");
var Route$2 = createFileRoute("/skills")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
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
		slot: "both",
		logo: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
	},
	{
		id: 2,
		company: "VRAMHAUS",
		url: "https://ollama.com",
		tagline: "Run the model. Skip the cloud bill.",
		slot: "both",
		logo: "https://ollama.com/public/ollama.png"
	},
	{
		id: 3,
		company: "NIGHTSHIFT GPU",
		url: "https://lmstudio.ai",
		tagline: "Desktop inference for people with a job in the morning.",
		slot: "both",
		logo: "https://lmstudio.ai/favicon.ico"
	},
	{
		id: 4,
		company: "OPENNODE",
		url: "https://github.com/ggml-org/llama.cpp",
		tagline: "The runtime the rest of the stack pretends to be.",
		slot: "both",
		logo: "https://raw.githubusercontent.com/ggml-org/llama.cpp/master/media/logo.png"
	},
	{
		id: 5,
		company: "SILICON ATTIC",
		url: "https://unsloth.ai",
		tagline: "Quants that still think.",
		slot: "both",
		logo: "https://unsloth.ai/favicon.ico"
	}
];
function SponsorLogoImage({ logo, company }) {
	const [hasError, setHasError] = (0, import_react.useState)(false);
	if (!logo || hasError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex h-3.5 w-3.5 items-center justify-center border border-line bg-bg text-[9px] font-mono font-bold text-fg",
		children: company.charAt(0).toUpperCase()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: logo,
		alt: `${company} logo`,
		onError: () => setHasError(true),
		referrerPolicy: "no-referrer",
		className: "inline-block h-3.5 w-3.5 rounded-none object-contain grayscale contrast-125"
	});
}
function SponsorTicker({ position }) {
	const [sponsors, setSponsors] = (0, import_react.useState)(FALLBACK);
	const [paused, setPaused] = (0, import_react.useState)(false);
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
		className: "group/ticker border-b border-line bg-surface text-2xs uppercase tracking-[0.18em] text-muted",
		onMouseEnter: () => setPaused(true),
		onMouseLeave: () => setPaused(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-stretch",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/sponsor",
				className: "shrink-0 border-r border-line bg-surface px-3 py-2 text-fg hover:bg-fg hover:text-bg transition-colors font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "sponsored — advertise here"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sm:hidden",
					children: "sponsored"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-w-0 flex-1 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-surface to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-surface to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "marquee-track flex w-max items-center gap-10 py-2 pr-10",
						style: { animationPlayState: paused ? "paused" : "running" },
						children: loop.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: s.url,
							target: "_blank",
							rel: "noreferrer",
							className: "flex items-center gap-2 whitespace-nowrap hover:text-fg transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SponsorLogoImage, {
									logo: s.logo,
									company: s.company
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-fg tracking-wide",
									children: s.company
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-dim",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "normal-case tracking-normal text-muted",
									children: s.tagline
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-[8px] text-dim opacity-60",
									children: "◆"
								})
							]
						}, `${s.id}-${i}`))
					})
				]
			})]
		})
	});
}
var BASE_WORLD_ASCII = [
	"┌────────────────────────────────────────────────────────────────┐",
	"│· -180° · · · · -90° · · · · · ·  0° · · · · · · +90° · · +180° ·│",
	"│    __..---..__     .---.             _..----.._           _.._ │",
	"│  .'  · NA ·   '.  /  ·  \\          .'  · EU ·  '.       .'·AP │",
	"│ /   *US/CA* ·   \\|  GL   |·       /  *UK/DE/FR*  \\     / *JP/CN│",
	"│|   [W-COAST] ·  || · · · | ·     |   [CENTRAL] ·  |   |  *IN/KR│",
	"│ \\   [E-COAST]·  / \\  ·  / ·       \\   [MEDIT] ·  /     \\ *SG/AU│",
	"│  '. ·  ·  ·  .'   '---'           '. ·  ·  ·  .'       '.  ·  │",
	"│    '-·_____·-'      · ·             '-·____·-'           '--· │",
	"│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  │",
	"│        _.._                              _.._    · · ·  _.._    │",
	"│      .' ·  '.                          .' ·  '.        .' · '.  │",
	"│     /  LATAM \\                        / AFRICA \\     /  ANZ   \\ │",
	"│    | *BR/MX/AR|·                     | *ZA/KE/NG|   | *AU/NZ* | │",
	"│     \\  · ·   /                        \\  · ·  /   |  · ·  | │",
	"│      '. ·  .'                          '. ·  .'     \\  · · / │",
	"│        '..'                              '..'        '.____.'  │",
	"│[LAT -60°] · · · · · · · · · · · · · · · · · · · · · ·[LAT +60°]│",
	"│ >> ACTIVE NODE RADAR · TELEMETRY MESH // SYNCED VIA TIMEZONE << │",
	"└────────────────────────────────────────────────────────────────┘"
];
function projectToGrid(lat, lng, cols = 64, rows = 18) {
	const clampedLat = Math.max(-60, Math.min(75, lat));
	const xRatio = (Math.max(-180, Math.min(180, lng)) + 180) / 360;
	const yRatio = (75 - clampedLat) / 135;
	const col = Math.round(3 + xRatio * (cols - 8));
	const row = Math.round(2 + yRatio * (rows - 5));
	return {
		col: Math.max(1, Math.min(cols - 2, col)),
		row: Math.max(2, Math.min(rows - 3, row))
	};
}
function AsciiRadarMap({ visitors, userCity }) {
	const [mode, setMode] = (0, import_react.useState)("map");
	const [scanCol, setScanCol] = (0, import_react.useState)(0);
	const [pulseTick, setPulseTick] = (0, import_react.useState)(0);
	const reduce = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduce.current) return;
		const interval = window.setInterval(() => {
			setScanCol((c) => c >= 62 ? 2 : c + 1);
			setPulseTick((t) => (t + 1) % 4);
		}, 110);
		return () => window.clearInterval(interval);
	}, []);
	const renderedMap = (0, import_react.useMemo)(() => {
		const lines = BASE_WORLD_ASCII.map((l) => l.split(""));
		const cols = 64;
		const rows = BASE_WORLD_ASCII.length;
		if (scanCol > 2 && scanCol < 62) {
			for (let r = 2; r < rows - 3; r++) if (lines[r]?.[scanCol] === " ") lines[r][scanCol] = "|";
		}
		visitors.forEach((v, idx) => {
			const pos = projectToGrid(v.lat, v.lng, cols, rows);
			const isRecent = v.agoSec < 20;
			const isUser = userCity && v.city.toLowerCase() === userCity.toLowerCase();
			let nodeChar = "*";
			if (isUser) nodeChar = pulseTick % 2 === 0 ? "@" : "O";
			else if (isRecent) nodeChar = pulseTick % 2 === 0 ? "!" : "#";
			else if (idx % 2 === 0) nodeChar = "+";
			if (lines[pos.row] && lines[pos.row][pos.col] !== void 0) lines[pos.row][pos.col] = nodeChar;
		});
		return lines.map((l) => l.join("")).join("\n");
	}, [
		visitors,
		scanCol,
		pulseTick,
		userCity
	]);
	const regionalMetrics = (0, import_react.useMemo)(() => {
		let americas = 0;
		let emea = 0;
		let apac = 0;
		visitors.forEach((v) => {
			if (v.lng < -30) americas++;
			else if (v.lng >= -30 && v.lng <= 55) emea++;
			else apac++;
		});
		const total = Math.max(1, visitors.length);
		const pAmer = Math.round(americas / total * 100);
		const pEmea = Math.round(emea / total * 100);
		const pApac = Math.round(apac / total * 100);
		const makeBar = (pct, width = 16) => {
			const filled = Math.round(pct / 100 * width);
			return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
		};
		return {
			americas: {
				count: americas,
				pct: pAmer,
				bar: makeBar(pAmer)
			},
			emea: {
				count: emea,
				pct: pEmea,
				bar: makeBar(pEmea)
			},
			apac: {
				count: apac,
				pct: pApac,
				bar: makeBar(pApac)
			}
		};
	}, [visitors]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-line pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMode("map"),
					className: `border px-2 py-0.5 text-2xs uppercase tracking-wider transition-colors ${mode === "map" ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`,
					children: "[1] 🗺️ ASCII World Radar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMode("matrix"),
					className: `border px-2 py-0.5 text-2xs uppercase tracking-wider transition-colors ${mode === "matrix" ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`,
					children: "[2] ⚡ Node Cluster Matrix"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-2xs uppercase tracking-widest text-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Live Mesh" })]
			})]
		}), mode === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			"aria-hidden": "true",
			className: "overflow-x-auto whitespace-pre font-mono text-[9.5px] leading-[1.12] text-fg sm:text-[10.5px]",
			children: renderedMap
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-dim",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "[@] You" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "[!] New (<20s)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "[+] Active Node" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "[│] Radar Sweep" })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Nodes: ", visitors.length] })]
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "font-mono text-xs text-muted space-y-3 py-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-surface/50 p-3 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-widest text-fg border-b border-line/60 pb-1",
					children: "Regional Traffic Distribution"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5 text-2xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-24 text-fg font-medium",
									children: "AMER (US/LATAM)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-fg",
									children: regionalMetrics.americas.bar
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-12 text-right tabular-nums",
									children: [regionalMetrics.americas.pct, "%"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-24 text-fg font-medium",
									children: "EMEA (EU/AFRICA)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-fg",
									children: regionalMetrics.emea.bar
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-12 text-right tabular-nums",
									children: [regionalMetrics.emea.pct, "%"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-24 text-fg font-medium",
									children: "APAC (ASIA/ANZ)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-fg",
									children: regionalMetrics.apac.bar
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-12 text-right tabular-nums",
									children: [regionalMetrics.apac.pct, "%"]
								})
							]
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-bg p-3 space-y-1 text-2xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-2xs uppercase tracking-widest text-fg border-b border-line/60 pb-1 flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Live Ingress Stream" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Protocol: TLS 1.3 / P2P" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1 pt-1",
					children: visitors.slice(0, 5).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-dim",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-fg font-mono",
							children: [
								"[",
								v.city.toUpperCase(),
								"] (",
								v.lat > 0 ? `${v.lat.toFixed(1)}N` : `${Math.abs(v.lat).toFixed(1)}S`,
								",",
								" ",
								v.lng > 0 ? `${v.lng.toFixed(1)}E` : `${Math.abs(v.lng).toFixed(1)}W`,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums text-emerald-400",
							children: [
								"● ",
								v.agoSec,
								"s ago"
							]
						})]
					}, v.id))
				})]
			})]
		})]
	});
}
var getVisitors = createServerFn({ method: "GET" }).handler(createSsrRpc("d6ccf6d0bbaae0347170620da947a906604559cde29ab3f0d7a932ebb5d5382b"));
var pingVisitor = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("24d50309f08a3565a4816e61411c6630d8150923748189a2c2efd2a7f578535c"));
function fmtCount(n) {
	return (typeof n === "number" && !isNaN(n) ? n : 18420).toLocaleString("en-US");
}
function AnimatedCount({ value }) {
	const [display, setDisplay] = (0, import_react.useState)(value);
	const prevRef = (0, import_react.useRef)(value);
	(0, import_react.useEffect)(() => {
		if (prevRef.current === value) return;
		const from = prevRef.current;
		const to = value;
		const diff = to - from;
		const dur = 900;
		const start = performance.now();
		let raf = 0;
		const step = (now) => {
			const p = Math.min(1, (now - start) / dur);
			const eased = 1 - Math.pow(1 - p, 3);
			setDisplay(Math.round(from + diff * eased));
			if (p < 1) raf = requestAnimationFrame(step);
			else prevRef.current = to;
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fmtCount(display) });
}
function agoLabel(sec) {
	const s = typeof sec === "number" && !isNaN(sec) ? sec : 0;
	if (s < 5) return "now";
	if (s < 60) return `${s}s`;
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	return `${Math.floor(s / 3600)}h`;
}
function VisitorDock() {
	const [count, setCount] = (0, import_react.useState)(18420);
	const [live, setLive] = (0, import_react.useState)([]);
	const [you, setYou] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = () => {
			getVisitors().then((s) => {
				if (cancelled || !s) return;
				if (typeof s.monthCount === "number") setCount(s.monthCount);
				if (Array.isArray(s.live)) setLive(s.live);
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
			className: "mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-[0.28em] text-muted",
					children: "live telemetry"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-lg",
					children: "real-time global visitors"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-md text-sm leading-relaxed text-muted",
					children: "Coarse location inferred from browser timezone without fingerprinting or tracking cookies. Every blinking node represents an active hardware builder browsing the open-weight registry."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-baseline gap-3 flex-wrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-3xl tabular-nums tracking-tight",
							children: count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedCount, { value: count }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl",
								children: "growing"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs uppercase tracking-widest text-muted",
							children: count > 0 ? "visitors this month" : "early builders · be early"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-1 inline-flex items-center gap-1.5 text-2xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400 dot-live inline-block" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-emerald-400 uppercase tracking-widest",
									children: "live"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums text-muted",
									children: [
										live.filter((v) => !v.city.includes("sample")).length,
										" active",
										live.some((v) => v.city.includes("sample")) ? " · sample nodes shown" : ""
									]
								})
							]
						})
					]
				}),
				you ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 inline-flex items-center gap-2 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-300",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" }),
						"you · ",
						you.toLowerCase(),
						" · pinged ",
						agoLabel(live.find((v) => v.city.toLowerCase() === you.toLowerCase())?.agoSec ?? 0),
						" ago"
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-5 space-y-0 text-xs text-muted border border-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between bg-surface px-2 py-1 text-2xs uppercase tracking-widest text-dim",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "recent pings · timezone-derived" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [live.length, " nodes"] })]
						}),
						live.slice(0, 6).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-4 border-t border-line px-2 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-fg flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `inline-block h-1 w-1 rounded-full ${v.agoSec < 20 ? "bg-emerald-400 dot-live" : v.agoSec < 60 ? "bg-amber-400" : "bg-dim"}` }), v.city.toLowerCase()]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-dim",
								children: [
									agoLabel(v.agoSec),
									" · ",
									v.lat > 0 ? `${v.lat.toFixed(0)}N` : `${Math.abs(v.lat).toFixed(0)}S`
								]
							})]
						}, v.id)),
						live.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-2 py-3 text-center text-dim",
							children: "listening for hardware builders…"
						}) : null
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden border border-line bg-bg p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AsciiRadarMap, {
					visitors: live,
					userCity: you
				})
			})]
		})
	});
}
var NAV = [
	{
		to: "/",
		label: "bench"
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
	},
	{
		to: "/share",
		label: "share card"
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
var Route$1 = createFileRoute("/sponsor")({ component: SponsorPage });
function SponsorPage() {
	const [company, setCompany] = (0, import_react.useState)("");
	const [website, setWebsite] = (0, import_react.useState)("");
	const [tagline, setTagline] = (0, import_react.useState)("");
	const [logo, setLogo] = (0, import_react.useState)("");
	const [slot, setSlot] = (0, import_react.useState)("both");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onSubmit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const res = await requestSponsor({ data: {
				company,
				website,
				tagline,
				logo: logo.trim() || void 0,
				slot
			} });
			if (!res.ok) setError(res.error);
			else setDone(true);
		} catch {
			setError("Could not submit sponsorship request. Please verify inputs and try again.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "companies & projects only"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl",
			children: "put your logo and name on the tape"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
			children: "Visitors never sign up. The top and bottom ticker bars showcase hardware makers, model labs, and local inference tools. Submit your brand name, icon logo, site URL, and a punchy 1-line hook."
		}),
		done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 border border-line bg-surface p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium",
				children: "✓ Request received."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted leading-relaxed",
				children: "We will review your company, logo, and website link. Once approved, your badge and tagline will begin streaming across the live ticker."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit,
			className: "mt-10 max-w-xl space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "company name *"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						placeholder: "e.g. OLLAMA, VRAMHAUS, SILICON ATTIC",
						value: company,
						onChange: (e) => setCompany(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xs uppercase tracking-widest text-muted",
							children: "company logo url (svg or png)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "url",
							placeholder: "https://example.com/logo.svg or icon URL",
							value: logo,
							onChange: (e) => setLogo(e.target.value),
							className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-2xs text-dim",
							children: "Provide a direct image/SVG URL. If left empty, your company's initial monogram will be displayed."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "website link *"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						type: "url",
						placeholder: "https://yourcompany.com",
						value: website,
						onChange: (e) => setWebsite(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xs uppercase tracking-widest text-muted",
							children: "tagline / pitch *"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-2xs tabular-nums text-dim",
							children: [120 - tagline.length, " left"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						maxLength: 120,
						placeholder: "e.g. Run open-weight models at full throttle without cloud bills.",
						value: tagline,
						onChange: (e) => setTagline(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "ticker slot placement"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: slot,
						onChange: (e) => setSlot(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "both",
								children: "Top + Bottom Bars (Full Exposure)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "top",
								children: "Top Bar Only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "bottom",
								children: "Bottom Bar Only"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 border border-line bg-surface/50 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-dim block mb-2",
						children: "Live Ticker Preview:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 border border-line bg-bg px-3 py-2 text-2xs uppercase tracking-wider text-muted",
						children: [
							logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: logo,
								alt: "Preview",
								referrerPolicy: "no-referrer",
								className: "inline-block h-4 w-4 object-contain grayscale",
								onError: (e) => {
									e.target.style.display = "none";
								}
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex h-4 w-4 items-center justify-center border border-line bg-surface text-[9px] font-mono font-bold text-fg",
								children: company ? company.charAt(0).toUpperCase() : "?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-fg",
								children: company || "YOUR COMPANY"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-dim",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "normal-case text-muted tracking-normal",
								children: tagline || "Your one-line tagline will scroll here."
							})
						]
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-red-400",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: busy,
					className: "min-h-12 bg-fg px-6 text-sm uppercase tracking-widest text-bg transition-opacity disabled:opacity-50 hover:opacity-90",
					children: busy ? "submitting…" : "submit sponsorship request"
				})
			]
		})
	] });
}
var $$splitComponentImporter = () => import("./can._slug-B7CNr_be.mjs");
var Route = createFileRoute("/can/$slug")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$6.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$7
	}),
	DropsRoute: Route$5.update({
		id: "/drops",
		path: "/drops",
		getParentRoute: () => Route$7
	}),
	ModelsRoute: Route$4.update({
		id: "/models",
		path: "/models",
		getParentRoute: () => Route$7
	}),
	ShareRoute: Route$3.update({
		id: "/share",
		path: "/share",
		getParentRoute: () => Route$7
	}),
	SkillsRoute: Route$2.update({
		id: "/skills",
		path: "/skills",
		getParentRoute: () => Route$7
	}),
	SponsorRoute: Route$1.update({
		id: "/sponsor",
		path: "/sponsor",
		getParentRoute: () => Route$7
	}),
	CanSlugRoute: Route.update({
		id: "/can/$slug",
		path: "/can/$slug",
		getParentRoute: () => Route$7
	})
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { createSsrRpc as i, Route as n, SiteShell as r, router_exports as t };
