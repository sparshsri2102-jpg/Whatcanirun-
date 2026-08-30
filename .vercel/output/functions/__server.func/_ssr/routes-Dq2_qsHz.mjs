import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as createSsrRpc, t as SiteShell } from "./site-shell-CbHb2Jlq.mjs";
import { n as PRESETS } from "./catalog-Behu-X92.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dq2_qsHz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var matchHardware = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("e271323a77e71d3096f944cf1828bcbfd3ffbbec40ca9b0f9e18f73fc5fb9a76"));
function FitBadge({ fit }) {
	const label = fit === "gpu" ? "fits GPU" : fit === "hybrid" ? "offload" : "CPU";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("border px-2 py-0.5 text-2xs uppercase tracking-widest", fit === "gpu" ? "border-fg text-fg" : "border-line text-muted"),
		children: label
	});
}
function CopyCmd({ cmd }) {
	const [done, setDone] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "text-2xs uppercase tracking-widest text-muted underline underline-offset-4 hover:text-fg",
		onClick: async () => {
			try {
				await navigator.clipboard.writeText(cmd);
				setDone(true);
				window.setTimeout(() => setDone(false), 1400);
			} catch {}
		},
		children: done ? "copied" : "copy"
	});
}
function PickCard({ fit, rank }) {
	const m = fit.model;
	const cmd = m.run.ollama || m.run.llamacpp || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border border-line bg-surface p-4 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xs tabular-nums text-muted",
						children: [
							String(rank).padStart(2, "0"),
							" · ",
							m.org
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 text-lg",
						children: m.name
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FitBadge, { fit: fit.fit })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: m.summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "quant"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "mt-0.5",
						children: [
							fit.quant.name,
							" · ",
							fit.quant.vramGb,
							" GB"
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "params"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-0.5",
						children: m.params
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "license"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-0.5",
						children: m.license
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "speed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-0.5",
						children: fit.speed
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted",
				children: fit.why
			}),
			cmd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-start justify-between gap-3 border border-line bg-bg px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "break-all text-xs",
					children: cmd
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyCmd, { cmd })]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: m.hf,
						target: "_blank",
						rel: "noreferrer",
						className: "underline underline-offset-4",
						children: "huggingface"
					}),
					m.gguf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: m.gguf,
						target: "_blank",
						rel: "noreferrer",
						className: "underline underline-offset-4",
						children: "GGUF download"
					}) : null,
					m.run.lmstudio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: m.run.lmstudio
					}) : null
				]
			})
		]
	});
}
function MatchResults({ result }) {
	const s = result.specs;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border border-line p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-2xs uppercase tracking-[0.28em] text-muted",
					children: "your rig"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid gap-3 text-sm sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: "gpu"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1",
							children: s.gpu
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: s.unified ? "unified" : "vram"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 tabular-nums",
							children: s.unified ? `${s.ramGb} GB` : `${s.vramGb} GB`
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: "system ram"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 tabular-nums",
							children: [s.ramGb, " GB"]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: "os / cpu"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1",
							children: [
								s.os,
								" · ",
								s.cpu
							]
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: result.blurb
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 text-sm uppercase tracking-[0.22em] text-muted",
			children: "top fits"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-4",
			children: result.picks.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickCard, {
				fit: p,
				rank: i + 1
			}, p.model.id))
		}),
		result.also.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 text-sm uppercase tracking-[0.22em] text-muted",
			children: "also runnable"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 divide-y divide-line border border-line",
			children: result.also.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm",
					children: [
						p.model.name,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [
								"· ",
								p.quant.name,
								" ",
								p.quant.vramGb,
								" GB"
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted",
					children: p.model.summary
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center gap-3 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FitBadge, { fit: p.fit }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: p.model.hf,
						target: "_blank",
						rel: "noreferrer",
						className: "underline underline-offset-4",
						children: "get"
					})]
				})]
			}, p.model.id))
		})] }) : null
	] });
}
var TASKS = [
	{
		id: "any",
		label: "anything"
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
		id: "agent",
		label: "agent"
	}
];
var PLACEHOLDER = `paste anything:

GPU: NVIDIA GeForce RTX 4070
Dedicated video memory: 12.0 GB
Installed physical memory: 32.0 GB
Processor: AMD Ryzen 7 5800X

or a screenshot of Task Manager / About This Mac / neofetch`;
async function fileToDataUrl(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	ctx.drawImage(bitmap, 0, 0, w, h);
	return canvas.toDataURL("image/jpeg", .72);
}
function SpecBench() {
	const [text, setText] = (0, import_react.useState)("");
	const [task, setTask] = (0, import_react.useState)("any");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [shotName, setShotName] = (0, import_react.useState)(null);
	const [shotUrl, setShotUrl] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const resultRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (result) resultRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}, [result]);
	async function run(opts) {
		setBusy(true);
		setError(null);
		try {
			const res = await matchHardware({ data: {
				text: opts?.preset ? void 0 : text,
				imageDataUrl: opts?.image ?? shotUrl ?? void 0,
				prefer: task === "any" ? void 0 : task,
				presetSpecs: opts?.preset
			} });
			if ("error" in res) {
				setError(res.error);
				setResult(null);
			} else setResult(res);
		} catch {
			setError("Match failed. Try a shorter paste, or pick a preset rig.");
		} finally {
			setBusy(false);
		}
	}
	async function onFile(file) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError("That is not an image.");
			return;
		}
		try {
			const url = await fileToDataUrl(file);
			setShotUrl(url);
			setShotName(file.name);
			await run({ image: url });
		} catch {
			setError("Could not read that screenshot.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 lg:grid-cols-[1.15fr_0.85fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-2xs uppercase tracking-[0.28em] text-muted",
					children: "step 1 · hardware"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-3 text-2xl leading-tight sm:text-3xl",
					children: [
						"paste your specs.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"get the models that fit."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-xl text-sm leading-relaxed text-muted",
					children: "No signup. Copy dxdiag, neofetch, About This Mac, GPU-Z, or a screenshot. We read VRAM and RAM, then rank open-weight models you can actually run."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs leading-relaxed text-muted lg:pt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-line p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xs uppercase tracking-widest text-fg",
						children: "how to copy specs"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Windows — Win+R, type dxdiag, copy the text. Or screenshot Task Manager → Performance." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "macOS — Apple menu → About This Mac. Screenshot is enough." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Linux — neofetch or inxi -F. Paste the lot." })
						]
					})]
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 flex flex-wrap gap-2",
			children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => run({ preset: {
					...p.specs,
					source: "preset"
				} }),
				className: "min-h-11 border border-line px-3 py-2 text-xs text-muted hover:border-fg hover:text-fg",
				children: [p.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ml-2 text-dim",
					children: [" ", p.hint]
				})]
			}, p.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 flex flex-wrap gap-2",
			children: TASKS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTask(t.id),
				className: cn("min-h-11 border px-3 py-2 text-xs uppercase tracking-widest", task === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg"),
				children: t.label
			}, t.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-6 block",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Hardware specifications"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: text,
				onChange: (e) => setText(e.target.value),
				rows: 8,
				placeholder: PLACEHOLDER,
				className: "min-h-44 w-full resize-y border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-fg placeholder:text-dim focus:border-fg focus:outline-none"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy,
					onClick: () => run(),
					className: "min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg hover:opacity-90 disabled:opacity-50",
					children: busy ? "matching…" : "match models"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => fileRef.current?.click(),
					className: "min-h-12 border border-line px-5 text-sm uppercase tracking-widest text-fg hover:bg-surface",
					children: shotName ? `screenshot · ${shotName}` : "drop a screenshot"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: "image/*",
					className: "hidden",
					onChange: (e) => onFile(e.target.files?.[0])
				}),
				shotName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted underline underline-offset-4",
					onClick: () => {
						setShotName(null);
						setShotUrl(null);
					},
					children: "clear image"
				}) : null
			]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-fg",
			children: error
		}) : null,
		result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "enter-up mt-10",
			ref: resultRef,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchResults, { result })
		}) : null
	] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecBench, {}) });
}
//#endregion
export { Home as component };
