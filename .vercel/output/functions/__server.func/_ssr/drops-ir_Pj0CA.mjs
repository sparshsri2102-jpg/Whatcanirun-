import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router_[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { i as createSsrRpc, r as SiteShell } from "./router-_1zSxGN-.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drops-ir_Pj0CA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listDrops = createServerFn({ method: "GET" }).handler(createSsrRpc("0f20ea8d88e6bca0e347ae704b101ad632c0e28596608d962176764d0f59d589"));
var getRssFeedXml = createServerFn({ method: "GET" }).handler(createSsrRpc("7575e7289b9d9fdbe0ea30f57754748e0491cacec1b712a9e1af873c24faed46"));
var sendWebhookTest = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1b40b08eeab31fb674b55215b4db668ba7fc638fd7322a443208d339ddd7a2ff"));
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
function isGguf(item) {
	const hay = `${item.name} ${item.tags.join(" ")} ${item.summary}`.toLowerCase();
	return hay.includes("gguf") || hay.includes("llama.cpp") || hay.includes("unsloth") || hay.includes("quant");
}
function DropsPage() {
	const [items, setItems] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [onlyGguf, setOnlyGguf] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [savedSpecs, setSavedSpecs] = (0, import_react.useState)(null);
	const [showWebhookDrawer, setShowWebhookDrawer] = (0, import_react.useState)(false);
	const [showRssModal, setShowRssModal] = (0, import_react.useState)(false);
	const [rssXml, setRssXml] = (0, import_react.useState)(null);
	const [webhookUrl, setWebhookUrl] = (0, import_react.useState)("");
	const [webhookVramFilter, setWebhookVramFilter] = (0, import_react.useState)(24);
	const [webhookStatus, setWebhookStatus] = (0, import_react.useState)(null);
	const [webhookTesting, setWebhookTesting] = (0, import_react.useState)(false);
	const [copiedRss, setCopiedRss] = (0, import_react.useState)(false);
	const [notifyEnabled, setNotifyEnabled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const s = localStorage.getItem("whatcanirun_last_specs");
			if (s) setSavedSpecs(JSON.parse(s));
			const savedWh = localStorage.getItem("whatcanirun_webhook_url");
			if (savedWh) setWebhookUrl(savedWh);
			if (typeof window !== "undefined" && "Notification" in window) setNotifyEnabled(Notification.permission === "granted");
		} catch {}
	}, []);
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
	const filteredItems = (0, import_react.useMemo)(() => {
		if (!items) return null;
		return items.filter((i) => {
			if (onlyGguf && !isGguf(i)) return false;
			if (search) {
				if (!`${i.name} ${i.summary} ${i.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
			}
			return true;
		});
	}, [
		items,
		onlyGguf,
		search
	]);
	const hf = filteredItems?.filter((i) => i.source === "huggingface") ?? [];
	const gh = filteredItems?.filter((i) => i.source === "github") ?? [];
	async function handleOpenRss() {
		setShowRssModal(true);
		if (!rssXml) {
			const xml = await getRssFeedXml();
			setRssXml(xml);
		}
	}
	async function handleCopyRss() {
		if (!rssXml) {
			const xml = await getRssFeedXml();
			setRssXml(xml);
			await navigator.clipboard.writeText(xml);
		} else await navigator.clipboard.writeText(rssXml);
		setCopiedRss(true);
		setTimeout(() => setCopiedRss(false), 2e3);
	}
	function handleDownloadRss() {
		if (!rssXml) return;
		const blob = new Blob([rssXml], { type: "application/rss+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "whatcanirun-drops.xml";
		a.click();
		URL.revokeObjectURL(url);
	}
	async function handleTestWebhook() {
		if (!webhookUrl.trim()) {
			setWebhookStatus("Please enter a Discord or Slack Webhook URL.");
			return;
		}
		setWebhookTesting(true);
		setWebhookStatus(null);
		try {
			localStorage.setItem("whatcanirun_webhook_url", webhookUrl.trim());
			const res = await sendWebhookTest({ data: {
				webhookUrl: webhookUrl.trim(),
				vramTierGb: webhookVramFilter
			} });
			if (res.ok) setWebhookStatus(`✓ ${res.message}`);
			else setWebhookStatus(`✗ ${res.error}`);
		} catch {
			setWebhookStatus("✗ Connection failed. Please check the Webhook URL.");
		} finally {
			setWebhookTesting(false);
		}
	}
	async function handleToggleNotifications() {
		if (!("Notification" in window)) {
			alert("Desktop notifications are not supported in this browser.");
			return;
		}
		if (Notification.permission === "granted") {
			new Notification("What Can I Run?", { body: "Drop alerts are active. You will receive notifications when new GGUF quants drop!" });
			setNotifyEnabled(true);
		} else {
			const perm = await Notification.requestPermission();
			setNotifyEnabled(perm === "granted");
			if (perm === "granted") new Notification("What Can I Run?", { body: "Subscribed to live open-weight model drop notifications!" });
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-baseline justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-2xs uppercase tracking-[0.28em] text-muted",
				children: "live feed & alert radar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-2xl sm:text-3xl",
				children: "open-weight drops"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleToggleNotifications,
						className: cn("min-h-9 border px-3 text-2xs uppercase tracking-widest transition-colors", notifyEnabled ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg"),
						children: notifyEnabled ? "🔔 alerts on" : "🔔 enable alerts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setShowWebhookDrawer(!showWebhookDrawer),
						className: cn("min-h-9 border px-3 text-2xs uppercase tracking-widest transition-colors", showWebhookDrawer ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg"),
						children: showWebhookDrawer ? "hide webhooks" : "⚡ webhook relay"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleOpenRss,
						className: "min-h-9 border border-line bg-surface px-3 text-2xs uppercase tracking-widest text-fg hover:border-fg",
						children: "📡 rss feed"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
			children: ["Real-time radar scanning Hugging Face text-generation + GGUF uploads and GitHub open-weight repos.", savedSpecs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block mt-1 text-xs text-fg",
				children: [
					"Filtered for your active rig:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono",
						children: [
							savedSpecs.gpu,
							" (",
							savedSpecs.vramGb,
							" GB VRAM)"
						]
					})
				]
			}) : null]
		}),
		showWebhookDrawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 border border-line bg-surface p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-[0.24em] text-muted",
						children: "Discord / Slack Webhook Alerts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs font-mono text-dim",
						children: "Automated Push Relay"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted leading-relaxed",
					children: "Paste your Discord server channel Webhook URL to get instant notifications when new high-profile LLM weights and GGUF quantizations drop."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "url",
							value: webhookUrl,
							onChange: (e) => setWebhookUrl(e.target.value),
							placeholder: "https://discord.com/api/webhooks/...",
							className: "min-h-11 border border-line bg-bg px-3 text-xs font-mono text-fg focus:border-fg focus:outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: webhookVramFilter,
							onChange: (e) => setWebhookVramFilter(Number(e.target.value)),
							className: "min-h-11 border border-line bg-bg px-3 text-xs text-fg focus:border-fg focus:outline-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 12,
									children: "Fits ≤ 12GB VRAM"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 16,
									children: "Fits ≤ 16GB VRAM"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 24,
									children: "Fits ≤ 24GB VRAM"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 48,
									children: "Fits ≤ 48GB VRAM"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: 128,
									children: "All Drops"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: webhookTesting,
							onClick: handleTestWebhook,
							className: "min-h-11 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg hover:opacity-90 disabled:opacity-50",
							children: webhookTesting ? "dispatching…" : "send test ping"
						})
					]
				}),
				webhookStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("mt-3 text-xs font-mono p-2 border", webhookStatus.startsWith("✓") ? "border-emerald-600/40 text-emerald-400 bg-emerald-950/20" : "border-rose-600/40 text-rose-400 bg-rose-950/20"),
					children: webhookStatus
				}) : null
			]
		}) : null,
		showRssModal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 border border-line bg-surface p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-[0.24em] text-muted",
						children: "Live RSS 2.0 Feed Spec"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setShowRssModal(false),
						className: "text-2xs uppercase text-muted hover:text-fg",
						children: "close [✕]"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-muted",
					children: "Add this syndication feed to Feedly, NetNewsWire, Slack RSS, or Zapier to track model drops:"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 max-h-56 overflow-auto border border-line bg-bg p-3 text-2xs font-mono text-dim",
					children: rssXml || "Generating RSS feed XML payload…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleCopyRss,
						className: "min-h-9 border border-fg bg-fg px-3 text-2xs uppercase tracking-widest text-bg hover:opacity-90",
						children: copiedRss ? "✓ copied xml" : "copy xml feed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: handleDownloadRss,
						className: "min-h-9 border border-line bg-bg px-3 text-2xs uppercase tracking-widest text-fg hover:border-fg",
						children: "download .xml"
					})]
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-wrap items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: search,
				onChange: (e) => setSearch(e.target.value),
				placeholder: "filter live drops by name / lab / tag…",
				className: "min-h-11 flex-1 min-w-[200px] border border-line bg-surface px-3 text-xs focus:border-fg focus:outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setOnlyGguf(!onlyGguf),
				className: cn("min-h-11 border px-3 text-xs uppercase tracking-widest transition-colors", onlyGguf ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"),
				children: onlyGguf ? "✓ GGUF only" : "show all formats"
			})]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: error
		}) : null,
		!items ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-sm text-muted",
			children: "listening for drops…"
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-10 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "text-sm uppercase tracking-[0.22em] text-muted",
					children: [
						"huggingface (",
						hf.length,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 divide-y divide-line border border-line",
				children: hf.map((d) => {
					const gguf = isGguf(d);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: d.url,
						target: "_blank",
						rel: "noreferrer",
						className: "block px-4 py-3 hover:bg-surface transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "break-all text-sm font-medium flex items-center gap-2",
								children: [d.name, gguf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "border border-line px-1.5 py-0.5 text-2xs uppercase tracking-wider text-fg",
									children: "GGUF"
								}) : null]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "shrink-0 text-2xs tabular-nums text-muted",
								children: timeAgo(d.when)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [d.likes, " likes"] }),
								d.downloads ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"· ",
									d.downloads.toLocaleString(),
									" dl"
								] }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", d.summary] })
							]
						})]
					}, d.id);
				})
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "text-sm uppercase tracking-[0.22em] text-muted",
					children: [
						"github (",
						gh.length,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 divide-y divide-line border border-line",
				children: gh.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: d.url,
					target: "_blank",
					rel: "noreferrer",
					className: "block px-4 py-3 hover:bg-surface transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "break-all text-sm font-medium",
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
