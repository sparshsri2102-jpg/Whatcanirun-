import { o as __toESM } from "../_runtime.mjs";
import { n as PRESETS } from "./catalog-ByDQjheB.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router_[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { i as createSsrRpc, r as SiteShell } from "./router-_1zSxGN-.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as parseSpecsHeuristic } from "./parse-specs-C1H6yj3R.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-u2yONuir.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var matchHardware = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("e271323a77e71d3096f944cf1828bcbfd3ffbbec40ca9b0f9e18f73fc5fb9a76"));
function FitBadge({ fit }) {
	const label = fit === "gpu" ? "fits GPU" : fit === "hybrid" ? "offload" : fit === "cpu" ? "CPU" : "exceeds";
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
				if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(cmd);
				else {
					const ta = document.createElement("textarea");
					ta.value = cmd;
					ta.style.position = "fixed";
					ta.style.opacity = "0";
					document.body.appendChild(ta);
					ta.focus();
					ta.select();
					document.execCommand("copy");
					document.body.removeChild(ta);
				}
				setDone(true);
				window.setTimeout(() => setDone(false), 1400);
			} catch {
				try {
					const ta = document.createElement("textarea");
					ta.value = cmd;
					ta.style.position = "fixed";
					ta.style.opacity = "0";
					document.body.appendChild(ta);
					ta.focus();
					ta.select();
					document.execCommand("copy");
					document.body.removeChild(ta);
					setDone(true);
					window.setTimeout(() => setDone(false), 1400);
				} catch {}
			}
		},
		children: done ? "copied" : "copy"
	});
}
function generateRunCmd(runner, fit, selectedQuant, contextK = 8, specs) {
	const m = fit.model;
	const qLower = selectedQuant.toLowerCase();
	const gpuCount = specs?.gpuCount && specs.gpuCount > 1 ? specs.gpuCount : 1;
	switch (runner) {
		case "ollama": {
			const baseOllama = m.run.ollama ? m.run.ollama : `hf.co/${m.hf}`;
			let tag = "";
			if (qLower.includes("q8") || qLower === "q8") tag = ":q8_0";
			else if (qLower.includes("q5")) tag = ":q5_k_m";
			else if (qLower.includes("q4") || qLower === "q4") tag = m.run.ollama ? "" : ":q4_k_m";
			else tag = `:${qLower}`;
			if (gpuCount > 1 && !specs?.unified) return `CUDA_VISIBLE_DEVICES=${Array.from({ length: gpuCount }, (_, i) => i).join(",")} ollama run ${baseOllama}${tag}`;
			return `ollama run ${baseOllama}${tag}`;
		}
		case "lmstudio":
			if (gpuCount > 1) return `lms load ${m.hf} --gpu=max --tensor-split ${Array(gpuCount).fill(1).join(",")} -c ${contextK * 1024}`;
			return `lms load ${m.hf} --gpu=max -c ${contextK * 1024}`;
		case "llamacpp":
			if (gpuCount > 1) return `./llama-cli -hf ${m.hf} -ngl 99 -sm row -c ${contextK * 1024}`;
			if (m.run.llamacpp) return m.run.llamacpp;
			return `./llama-cli -hf ${m.hf} -ngl 99 -c ${contextK * 1024}`;
		case "vllm":
			if (gpuCount > 1) return `vllm serve ${m.hf} --tensor-parallel-size ${gpuCount} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.92`;
			return `vllm serve ${m.hf} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.90`;
		case "jan": return `jan run ${m.id} --quant ${selectedQuant}`;
		default: return m.run.ollama || m.run.llamacpp || "";
	}
}
function QuantAdvisor({ model, quants, vramGb }) {
	const gpuOpts = quants.filter((q) => q.fit === "gpu");
	const hybridOpts = quants.filter((q) => q.fit === "hybrid");
	const best = gpuOpts.length ? gpuOpts[0] : hybridOpts[0];
	if (!best) return null;
	const q4 = quants.find((q) => q.quant.name === "Q4");
	const q8 = quants.find((q) => q.quant.name === "Q8");
	const qualityDrop = q4 && q8 ? Math.round((1 - q4.quant.quality / q8.quant.quality) * 100) : 0;
	const recommended = best.quant.name;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 border border-primary/30 bg-primary/5 p-3 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-2xs uppercase tracking-widest text-primary",
				children: "recommended quant for your rig"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-sm font-semibold text-fg",
				children: recommended
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-2xs text-muted leading-relaxed",
				children: recommended === "Q4" ? `Fits your ${vramGb}GB with headroom. Only ~${qualityDrop}% quality drop vs Q8 — best speed/quality balance.` : recommended === "Q8" ? `Near-lossless quality on your ${vramGb}GB. Maximum speed you can get.` : `Best fit available on your hardware. ${best.headroomGb > 0 ? `+${best.headroomGb}GB headroom.` : "Tight fit."}`
			})
		]
	});
}
function UpgradePath({ result }) {
	const top = result.picks[0];
	if (!top || top.fit === "gpu") return null;
	const upgradeVram = top.quant.vramGb;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8 border border-warning/30 bg-warning/5 p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-2xs uppercase tracking-widest text-warning",
				children: "feature: upgrade path"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "mt-2 text-xl font-semibold text-fg",
				children: [
					"Add ~",
					upgradeVram - result.specs.vramGb,
					"GB VRAM to run ",
					top.model.name
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted leading-relaxed",
				children: [
					top.model.name,
					" wants ",
					top.quant.vramGb,
					"GB (",
					top.quant.name,
					"). Your rig has ",
					result.specs.vramGb,
					"GB. A used RTX 3090 24GB (~$300) or RTX 4070 12GB (~$400) would unlock this model."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted",
						children: "RTX 3090 24GB · ~$300 used"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted",
						children: "RTX 4070 12GB · ~$400"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted",
						children: "M4 Pro 24GB · ~$600"
					})
				]
			})
		]
	});
}
var COMMUNITY_TIER = {
	"8 GB laptop": [
		{
			model: "Qwen3 8B",
			reason: "r/LocalLLaMA daily driver for 8GB — 84 quality, 22 t/s Q4"
		},
		{
			model: "Phi-4 Mini",
			reason: "Community CPU pick — runs anywhere, 74 quality"
		},
		{
			model: "Gemma 3 4B",
			reason: "Top mobile pick — 76 quality, tiny footprint"
		}
	],
	"RTX 3060 12GB": [
		{
			model: "Mistral Small 3.2",
			reason: "16GB members' go-to coding model — 87 quality"
		},
		{
			model: "Qwen3 8B",
			reason: "Fastest 8B — 84 quality at 30 t/s"
		},
		{
			model: "Gemma 3 12B",
			reason: "Multimodal king at 12GB — 86 quality"
		}
	],
	"RTX 4090 24GB": [
		{
			model: "Qwen3.8 27B",
			reason: "24GB sweet spot — 93 quality, vision+coding"
		},
		{
			model: "DeepSeek-R1 32B",
			reason: "Reasoning champion — 89 quality at Q4"
		},
		{
			model: "Devstral Small",
			reason: "Agentic coding — 89 quality, 256k ctx"
		}
	]
};
function CommunityConsensus({ specs }) {
	const tier = COMMUNITY_TIER[`${specs.gpu} ${specs.vramGb}GB`] ?? COMMUNITY_TIER[`${specs.gpu}`] ?? COMMUNITY_TIER["8 GB laptop"];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-10 border border-line bg-surface p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-2xs uppercase tracking-widest text-muted",
					children: "community consensus"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-2xs text-dim",
					children: "r/LocalLLaMA · 266K members"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 text-xl font-semibold text-fg",
				children: "what r/LocalLLaMA runs on your hardware"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-3",
				children: tier.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-line bg-bg p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-2xs uppercase tracking-widest text-primary",
							children: ["#", i + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-sm font-semibold text-fg",
							children: c.model
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted leading-relaxed",
							children: c.reason
						})
					]
				}, c.model))
			})
		]
	});
}
function BenchmarkCompare({ result }) {
	const top3 = result.picks.slice(0, 3);
	if (top3.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-10 border border-line bg-surface p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-2xs uppercase tracking-widest text-muted",
				children: "feature: benchmark compare"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-2 text-xl font-semibold text-fg",
				children: "top 3 side-by-side on your rig"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line text-muted text-2xs uppercase tracking-widest",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "pb-3 text-fg",
							children: "metric"
						}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 pb-3 text-right text-fg",
							children: p.model.name
						}, p.model.id))]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-dim",
								children: "quality"
							}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-right tabular-nums text-fg",
								children: [p.model.quality, "/100"]
							}, p.model.id))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-dim",
								children: "speed (tok/s)"
							}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right tabular-nums text-fg",
								children: p.tokPerSec ?? p.speed ?? "—"
							}, p.model.id))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-dim",
								children: "VRAM (quant)"
							}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-right tabular-nums text-fg",
								children: [
									p.quant.vramGb,
									" GB (",
									p.quant.name,
									")"
								]
							}, p.model.id))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-dim",
								children: "license"
							}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right text-fg",
								children: p.model.license
							}, p.model.id))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-dim",
							children: "fit"
						}), top3.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("border px-2 py-0.5 text-2xs uppercase tracking-widest", p.fit === "gpu" ? "border-fg text-fg" : "border-line text-muted"),
								children: p.fit
							})
						}, p.model.id))] })
					] })]
				})
			})
		]
	});
}
function PickCard({ fit, rank, contextK, specs }) {
	const m = fit.model;
	const [selectedQuantName, setSelectedQuantName] = (0, import_react.useState)(fit.quant.name);
	const [runner, setRunner] = (0, import_react.useState)("ollama");
	const activeOption = fit.quantOptions?.find((o) => o.quant.name === selectedQuantName);
	const currentQuant = activeOption ? activeOption.quant : fit.quant;
	const currentFit = activeOption ? activeOption.fit : fit.fit;
	const currentSpeed = activeOption?.tokPerSec || activeOption?.speed || fit.tokPerSec || fit.speed;
	const currentHeadroom = activeOption ? activeOption.headroomGb : fit.headroomGb;
	const weightsGb = currentQuant.vramGb;
	const kvCacheGb = fit.kvCacheGb ?? .5;
	const totalMem = Math.round((weightsGb + kvCacheGb) * 10) / 10;
	const cmd = generateRunCmd(runner, fit, currentQuant.name, contextK, specs);
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
					className: "shrink-0 flex items-center gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FitBadge, { fit: currentFit })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: m.summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuantAdvisor, {
				model: m,
				quants: fit.quantOptions ?? [],
				vramGb: specs.vramGb || specs.ramGb
			}),
			fit.quantOptions && fit.quantOptions.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 border-t border-b border-line py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-2xs uppercase tracking-widest text-dim",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "select quantization format:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [currentQuant.name, " selected"] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: fit.quantOptions.map((opt) => {
						const isSelected = opt.quant.name === currentQuant.name;
						const isGpu = opt.fit === "gpu";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelectedQuantName(opt.quant.name),
							className: cn("px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors", isSelected ? "border-fg bg-fg text-bg" : isGpu ? "border-line bg-bg text-fg hover:border-fg" : "border-line/60 bg-transparent text-dim hover:text-muted"),
							children: [
								opt.quant.name,
								" · ",
								opt.quant.vramGb,
								" GB",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1 opacity-70",
									children: [
										"(",
										opt.fit === "gpu" ? "GPU" : opt.fit === "hybrid" ? "offload" : "CPU",
										")"
									]
								})
							]
						}, opt.quant.name);
					})
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "memory needed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "mt-0.5 tabular-nums",
						children: [
							totalMem,
							" GB ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-dim",
								children: [
									"(",
									weightsGb,
									" + ",
									kvCacheGb,
									"k KV)"
								]
							})
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
						children: "headroom"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-0.5 tabular-nums",
						children: currentHeadroom > 0 ? `+${currentHeadroom} GB` : `${currentHeadroom} GB`
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-dim",
						children: "est. speed / bandwidth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-0.5 font-mono text-fg",
						children: currentSpeed
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted",
				children: fit.why
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-2xs uppercase tracking-widest text-dim mb-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"run command (",
						runner,
						")",
						specs.gpuCount > 1 ? ` · ${specs.gpuCount}x GPU Stacking` : "",
						":"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: [
							"ollama",
							"lmstudio",
							"llamacpp",
							"vllm"
						].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setRunner(r),
							className: cn("hover:text-fg uppercase", runner === r ? "text-fg underline underline-offset-2" : "text-dim"),
							children: r
						}, r))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3 border border-line bg-bg px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "break-all text-xs font-mono",
						children: cmd
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyCmd, { cmd })]
				})]
			}),
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
function VerdictBanner({ result }) {
	const top = result.picks[0];
	if (!top) return null;
	const fits = top.fit !== "no";
	const speed = top.tokPerSec || top.speed || "—";
	const vram = result.specs.vramGb || result.specs.ramGb;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 border-2 border-success bg-success/5 p-6 sm:p-8 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-3xl sm:text-4xl font-bold tracking-tight",
				style: { color: fits ? "var(--color-success)" : "var(--color-danger)" },
				children: fits ? "YES — it runs" : "NO — too heavy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: fits ? `Your ${vram}GB rig runs ${top.model.name} at ${speed}. ${top.model.summary.split(".")[0]}.` : `${top.model.name} needs ${top.quant.vramGb}GB+. Closest fit: ${result.picks.find((p) => p.fit !== "no")?.model.name || "none"}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap justify-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "border border-success/40 bg-success px-3 py-1 text-2xs uppercase tracking-widest text-success-foreground",
						children: [
							fits ? "GPU-native" : "offload",
							" · ",
							speed
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted",
						children: [
							top.quant.name,
							" · ",
							top.quant.vramGb,
							" GB"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted",
						children: [
							"quality ",
							top.model.quality,
							"/100"
						]
					})
				]
			})
		]
	});
}
function MatchResults({ result, onContextChange }) {
	const s = result.specs;
	const ctx = result.contextK ?? 8;
	const [commercialOnly, setCommercialOnly] = (0, import_react.useState)(false);
	const isCommercial = (m) => [
		"Apache-2.0",
		"MIT",
		"BSD"
	].includes(m.license);
	const picks = commercialOnly ? result.picks.filter((p) => isCommercial(p.model)) : result.picks;
	const also = commercialOnly ? result.also.filter((p) => isCommercial(p.model)) : result.also;
	const shareParams = new URLSearchParams({
		gpu: s.gpu,
		vram: String(s.vramGb),
		ram: String(s.ramGb),
		cpu: s.cpu,
		os: s.os,
		unified: s.unified ? "1" : "0",
		gpus: String(s.gpuCount || 1),
		ctx: String(ctx)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border border-line p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xs uppercase tracking-[0.28em] text-muted",
						children: "your rig configuration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [onContextChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 text-2xs uppercase tracking-widest text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "context:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-fg",
								children: [ctx, "k"]
							})]
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `/share?${shareParams.toString()}`,
							className: "border border-fg bg-fg px-2.5 py-1 text-2xs font-mono text-bg uppercase tracking-wider hover:opacity-90 transition-opacity",
							children: "⚡ export & share card"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid gap-3 text-sm sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: "gpu / accelerators"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 font-mono",
							children: [s.gpuCount > 1 && !s.unified ? `${s.gpuCount}x ` : "", s.gpu]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: s.unified ? "unified pool" : "total vram pool"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 tabular-nums font-mono",
							children: s.unified ? `${s.ramGb} GB Unified` : `${s.vramGb * Math.max(1, s.gpuCount || 1)} GB VRAM`
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-dim",
							children: "system ram"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 tabular-nums font-mono",
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
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerdictBanner, { result }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setCommercialOnly(!commercialOnly),
				className: cn("min-h-10 border px-4 text-2xs uppercase tracking-widest transition-colors", commercialOnly ? "border-primary bg-primary/10 text-primary" : "border-line text-muted hover:border-fg hover:text-fg"),
				children: commercialOnly ? "✓ commercial-safe only" : "filter: commercial-safe only"
			}), commercialOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-2xs text-muted",
				children: "Apache-2.0 / MIT only"
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 text-sm uppercase tracking-[0.22em] text-muted",
			children: "top runnable models"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-4",
			children: picks.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickCard, {
				fit: p,
				rank: i + 1,
				contextK: ctx,
				specs: s
			}, p.model.id))
		}),
		also.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 text-sm uppercase tracking-[0.22em] text-muted",
			children: "also runnable"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 divide-y divide-line border border-line",
			children: also.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
								" GB (",
								p.speed,
								")"
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
		})] }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradePath, { result }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenchmarkCompare, { result }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommunityConsensus, { specs: s })
	] });
}
var STEPS = [
	"Initializing hardware diagnostic telemetry daemon...",
	"Querying GPU compute cores & memory bus topology...",
	"Profiling VRAM capacity & dedicated bandwidth (GB/s)...",
	"Computing FlashAttention-2 KV cache overhead for context window...",
	"Scanning catalog across 80+ open-weight LLMs & Vision models...",
	"Evaluating quantization matrix (Q4_K_M, Q5_K_M, Q8_0, FP16)...",
	"Synthesizing one-liner runner commands for Ollama & LM Studio...",
	"Hardware analysis complete. Finalizing model compatibility matrix..."
];
function TerminalProcessing({ specsSummary, contextK = 8 }) {
	const [stepIndex, setStepIndex] = (0, import_react.useState)(0);
	const [progress, setProgress] = (0, import_react.useState)(12);
	(0, import_react.useEffect)(() => {
		const interval = setInterval(() => {
			setStepIndex((prev) => {
				if (prev < STEPS.length - 1) return prev + 1;
				return prev;
			});
			setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 16 + 10), 98));
		}, 180);
		return () => clearInterval(interval);
	}, []);
	const totalBars = 24;
	const filledBars = Math.round(progress / 100 * totalBars);
	const barString = "█".repeat(filledBars) + "░".repeat(Math.max(0, totalBars - filledBars));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8 border border-line bg-surface font-mono text-xs shadow-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-line bg-bg px-4 py-2 text-2xs uppercase tracking-widest text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg font-semibold",
					children: "hardware_analysis_engine.sh"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 text-dim",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"ctx: ",
					contextK,
					"k"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "pid: 4892" })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-4 sm:p-5 space-y-2",
			children: [
				specsSummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-dim border-b border-line/60 pb-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg font-bold",
							children: "$ target_spec:"
						}),
						" ",
						specsSummary
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1.5 pt-1",
					children: STEPS.slice(0, stepIndex + 1).map((step, idx) => {
						const isLatest = idx === stepIndex;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-emerald-400 font-bold shrink-0",
									children: isLatest ? "❯" : "✓"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: isLatest ? "text-fg" : "text-muted",
									children: step
								}),
								isLatest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-3.5 w-1.5 bg-emerald-400 animate-ping ml-1" }) : null
							]
						}, step);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 pt-3 border-t border-line/60",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-2xs text-muted mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CALCULATING HEADROOM & TOK/S THROUGHPUT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-fg font-bold",
							children: [progress, "%"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xs text-emerald-400/90 tracking-widest",
						children: [
							"[",
							barString,
							"]"
						]
					})]
				})
			]
		})]
	});
}
async function detectSystemHardware() {
	if (typeof window === "undefined") return null;
	let gpuName = "";
	let vramEstimateGb = 0;
	let isAppleSilicon = false;
	let isUnified = false;
	try {
		const maybeGpu = navigator.gpu;
		if (maybeGpu && typeof maybeGpu.requestAdapter === "function") {
			const adapter = await maybeGpu.requestAdapter();
			if (adapter) {
				const info = adapter.info;
				if (info) {
					if (info.description) gpuName = info.description;
					else if (info.device) gpuName = `${info.vendor ?? ""} ${info.device}`.trim();
					if (info.vendor) info.vendor;
				}
			}
		}
	} catch {}
	if (!gpuName) try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
		if (gl) {
			const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
			if (debugInfo) {
				const unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				const unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
				if (typeof unmaskedRenderer === "string") gpuName = unmaskedRenderer;
				if (typeof unmaskedVendor === "string");
			}
			if (!gpuName) {
				const renderer = gl.getParameter(gl.RENDERER);
				if (typeof renderer === "string") gpuName = renderer;
			}
		}
	} catch {}
	const ua = navigator.userAgent.toLowerCase();
	let os = "Windows";
	if (ua.includes("mac") || ua.includes("darwin")) os = "macOS";
	else if (ua.includes("linux")) os = "Linux";
	if (os === "macOS") {
		if (gpuName.toLowerCase().includes("apple") || !gpuName.toLowerCase().includes("intel")) {
			isAppleSilicon = true;
			isUnified = true;
		}
	}
	const deviceMem = navigator.deviceMemory;
	let ramGb = deviceMem ? Math.max(deviceMem, 8) : 16;
	const cores = navigator.hardwareConcurrency || 8;
	if (cores >= 16 && ramGb <= 8) ramGb = 32;
	else if (cores >= 12 && ramGb <= 8) ramGb = 16;
	let cleanGpu = gpuName.replace(/^angle \(/i, "").replace(/\)$/, "").replace(/ direct3d.*$/i, "").replace(/ vs_.*$/i, "").replace(/,.*$/, "").trim();
	if (!cleanGpu || cleanGpu.toLowerCase().includes("swiftshader") || cleanGpu.toLowerCase().includes("llvmpipe")) cleanGpu = isAppleSilicon ? "Apple M-Series GPU" : "Generic Dedicated / Integrated GPU";
	const heuristic = parseSpecsHeuristic(`${cleanGpu} ${ramGb}GB RAM ${os}`);
	if (heuristic && heuristic.vramGb > 0) {
		vramEstimateGb = heuristic.vramGb;
		if (heuristic.gpu) cleanGpu = heuristic.gpu;
		if (heuristic.unified) isUnified = true;
	} else if (isAppleSilicon) {
		vramEstimateGb = ramGb;
		isUnified = true;
		cleanGpu = cleanGpu.includes("Apple") ? cleanGpu : `Apple Silicon (${ramGb}GB Unified)`;
	} else {
		const gLower = cleanGpu.toLowerCase();
		if (gLower.includes("4090")) vramEstimateGb = 24;
		else if (gLower.includes("4080")) vramEstimateGb = 16;
		else if (gLower.includes("4070 ti super")) vramEstimateGb = 16;
		else if (gLower.includes("4070")) vramEstimateGb = 12;
		else if (gLower.includes("4060 ti")) vramEstimateGb = 16;
		else if (gLower.includes("4060")) vramEstimateGb = 8;
		else if (gLower.includes("3090")) vramEstimateGb = 24;
		else if (gLower.includes("3080 ti")) vramEstimateGb = 12;
		else if (gLower.includes("3080")) vramEstimateGb = 10;
		else if (gLower.includes("3070")) vramEstimateGb = 8;
		else if (gLower.includes("3060")) vramEstimateGb = 12;
		else if (gLower.includes("7900 xtx")) vramEstimateGb = 24;
		else if (gLower.includes("7900 xt")) vramEstimateGb = 20;
		else if (gLower.includes("7800 xt")) vramEstimateGb = 16;
		else if (gLower.includes("6800") || gLower.includes("6900")) vramEstimateGb = 16;
		else if (gLower.includes("intel arc a770")) vramEstimateGb = 16;
		else if (gLower.includes("intel arc a750")) vramEstimateGb = 8;
		else if (gLower.includes("radeon") || gLower.includes("geforce") || gLower.includes("rtx")) vramEstimateGb = 8;
		else vramEstimateGb = Math.min(8, Math.floor(ramGb / 2));
	}
	return {
		specs: {
			gpu: cleanGpu,
			vramGb: isUnified ? ramGb : vramEstimateGb,
			ramGb,
			cpu: `${cores}-core CPU`,
			os,
			unified: isUnified,
			gpuCount: 1,
			source: "preset",
			raw: `Auto-detected: ${cleanGpu} | ${isUnified ? `${ramGb}GB Unified` : `${vramEstimateGb}GB VRAM`} | ${ramGb}GB RAM | ${os}`
		},
		summary: `${cleanGpu} · ${isUnified ? `${ramGb} GB unified` : `${vramEstimateGb} GB VRAM`} · ${ramGb} GB RAM`
	};
}
var createWatcher = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("e699ba8ef13787105920af2953c52e72704cc116b7823f9a54dc90c8d83a2d75"));
createServerFn({ method: "GET" }).handler(createSsrRpc("328ecb5d6571b059b39913e7f6792b805c74e63cc27d82bf06b709aa0c0493d6"));
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
var CONTEXT_OPTIONS = [
	{
		id: 4,
		label: "4k ctx"
	},
	{
		id: 8,
		label: "8k ctx"
	},
	{
		id: 32,
		label: "32k ctx"
	},
	{
		id: 128,
		label: "128k ctx"
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
	const [contextK, setContextK] = (0, import_react.useState)(8);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [detecting, setDetecting] = (0, import_react.useState)(false);
	const [showTuner, setShowTuner] = (0, import_react.useState)(false);
	const [tunerVram, setTunerVram] = (0, import_react.useState)(16);
	const [tunerRam, setTunerRam] = (0, import_react.useState)(32);
	const [tunerGpuCount, setTunerGpuCount] = (0, import_react.useState)(1);
	const [tunerUnified, setTunerUnified] = (0, import_react.useState)(false);
	const [tunerGpu] = (0, import_react.useState)("Custom Rig");
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [shotName, setShotName] = (0, import_react.useState)(null);
	const [shotUrl, setShotUrl] = (0, import_react.useState)(null);
	const [activeSummary, setActiveSummary] = (0, import_react.useState)("");
	const fileRef = (0, import_react.useRef)(null);
	const resultRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem("whatcanirun_last_specs");
			if (saved) {
				const specs = JSON.parse(saved);
				if (specs && typeof specs.vramGb === "number") matchHardware({ data: {
					presetSpecs: specs,
					contextK: 8
				} }).then((res) => {
					if ("error" in res) setError(res.error);
					else setResult(res);
				}).catch(() => {});
			}
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (result && !busy) try {
			localStorage.setItem("whatcanirun_last_specs", JSON.stringify(result.specs));
		} catch {}
	}, [result, busy]);
	async function run(opts) {
		setBusy(true);
		setError(null);
		const activeCtx = opts?.ctx ?? contextK;
		const summary = opts?.preset?.gpu ? `${opts.preset.gpu} (${opts.preset.vramGb} GB VRAM / ${opts.preset.ramGb} GB RAM)` : shotName ? `Screenshot: ${shotName}` : text.trim() ? text.trim().slice(0, 80) : "System hardware telemetry buffer";
		setActiveSummary(summary);
		try {
			const [res] = await Promise.all([matchHardware({ data: {
				text: opts?.preset ? void 0 : text,
				imageDataUrl: opts?.image ?? shotUrl ?? void 0,
				prefer: task === "any" ? void 0 : task,
				presetSpecs: opts?.preset,
				contextK: activeCtx
			} }), new Promise((resolve) => setTimeout(resolve, 600))]);
			if ("error" in res) {
				setError(res.error);
				setResult(null);
			} else {
				setResult(res);
				if (!opts?.skipScroll) setTimeout(() => {
					resultRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "start"
					});
				}, 100);
			}
		} catch {
			setError("Match failed. Try a shorter paste, or pick a preset rig.");
		} finally {
			setBusy(false);
		}
	}
	async function handleAutoDetect() {
		setDetecting(true);
		setError(null);
		try {
			const detected = await detectSystemHardware();
			if (!detected) {
				setError("Browser WebGPU/WebGL detection unavailable.");
				return;
			}
			setText(detected.specs.raw || detected.summary);
			await run({
				preset: detected.specs,
				ctx: contextK
			});
		} catch {
			setError("Could not automatically detect hardware.");
		} finally {
			setDetecting(false);
		}
	}
	function handleApplyTuner() {
		run({
			preset: {
				gpu: tunerUnified ? `Apple Silicon / APU (${tunerRam}GB Unified)` : tunerGpuCount > 1 && !tunerUnified ? `${tunerGpuCount}x Custom GPU (${tunerVram * tunerGpuCount}GB Total VRAM)` : `${tunerGpu} (${tunerVram}GB VRAM)`,
				vramGb: tunerUnified ? tunerRam : tunerVram,
				ramGb: tunerRam,
				cpu: "Custom CPU",
				os: tunerUnified ? "macOS" : "Windows / Linux",
				unified: tunerUnified,
				gpuCount: tunerUnified ? 1 : tunerGpuCount,
				source: "preset",
				raw: `Tuned: ${tunerUnified ? `${tunerRam}GB Unified` : `${tunerGpuCount}x ${tunerVram}GB VRAM (${tunerGpuCount * tunerVram}GB Total) / ${tunerRam}GB RAM`}`
			},
			ctx: contextK
		});
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
			await run({
				image: url,
				ctx: contextK
			});
		} catch {
			setError("Could not read that screenshot.");
		}
	}
	const [tamTab, setTamTab] = (0, import_react.useState)("laptop");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2 border-b border-line pb-4 mb-6",
			children: [
				{
					id: "laptop",
					label: "Can my laptop run it?",
					desc: "8GB? We find a CPU fit"
				},
				{
					id: "private",
					label: "Private · Offline",
					desc: "No cloud bill"
				},
				{
					id: "free",
					label: "Free forever",
					desc: "Open weights only"
				}
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setTamTab(t.id),
				className: cn("border px-3 py-2 text-left flex-1 min-w-[140px]", tamTab === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-widest",
					children: t.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("text-2xs", tamTab === t.id ? "text-bg/70" : "text-dim"),
					children: t.desc
				})]
			}, t.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 lg:grid-cols-[1.15fr_0.85fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-2xs uppercase tracking-[0.28em] text-muted",
					children: ["step 1 · hardware ", tamTab === "laptop" ? "· laptop first" : tamTab === "private" ? "· stays on device" : "· no paywall"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-3 text-2xl leading-tight sm:text-3xl",
					children: [
						tamTab === "laptop" ? "your laptop can run an LLM." : tamTab === "private" ? "your data stays on device." : "paste your specs.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						tamTab === "laptop" ? "we prove it." : tamTab === "private" ? "find the private fit." : "get the models that fit."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-xl text-sm leading-relaxed text-muted",
					children: tamTab === "laptop" ? "8GB iGPU? 16GB MacBook? We rank open-weight models by CPU offload + VRAM — most laptops run a 7B at 8 t/s with no GPU." : tamTab === "private" ? "No signup. No cloud. We compute VRAM + KV headroom locally to find offline models that run 100% on your hardware." : "No signup. Auto-detect your rig via WebGPU, copy dxdiag/neofetch, or drop a screenshot. We compute VRAM and KV cache headroom to rank open-weight models you can actually run."
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
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: detecting || busy,
					onClick: handleAutoDetect,
					className: "min-h-11 border border-fg bg-surface px-3 py-2 text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg disabled:opacity-50",
					children: detecting ? "detecting rig…" : "⚡ auto-detect my rig"
				}),
				PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => run({
						preset: {
							...p.specs,
							source: "preset"
						},
						ctx: contextK
					}),
					className: "min-h-11 border border-line px-3 py-2 text-xs text-muted hover:border-fg hover:text-fg",
					children: [p.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 text-dim",
						children: [" ", p.hint]
					})]
				}, p.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowTuner(!showTuner),
					className: cn("min-h-11 border px-3 py-2 text-xs uppercase tracking-widest", showTuner ? "border-fg text-fg bg-surface" : "border-line text-muted hover:border-fg hover:text-fg"),
					children: showTuner ? "hide rig tuner" : "⚙ tune rig"
				})
			]
		}),
		showTuner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 border border-line bg-surface p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xs uppercase tracking-[0.28em] text-muted",
						children: "rig tuner & multi-gpu what-if simulator"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xs font-mono text-dim",
						children: tunerUnified ? `${tunerRam} GB Unified Pool` : `${tunerGpuCount}x GPU (${tunerVram * tunerGpuCount} GB Total VRAM)`
					})]
				}),
				!tunerUnified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2 border-b border-line pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-dim",
						children: "GPU Quantity:"
					}), [
						1,
						2,
						4,
						8
					].map((count) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTunerGpuCount(count),
						className: cn("px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors", tunerGpuCount === count ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"),
						children: count === 1 ? "1x Single" : count === 2 ? "2x Dual" : count === 4 ? "4x Quad" : "8x Cluster"
					}, count))]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-dim",
								children: tunerUnified ? "Unified Memory" : "VRAM per GPU"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-fg",
								children: [tunerUnified ? tunerRam : tunerVram, " GB"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 4,
							max: 128,
							step: 2,
							disabled: tunerUnified,
							value: tunerVram,
							onChange: (e) => setTunerVram(Number(e.target.value)),
							className: "mt-2 w-full accent-fg"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-dim",
								children: "System RAM"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-fg",
								children: [tunerRam, " GB"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 8,
							max: 256,
							step: 8,
							value: tunerRam,
							onChange: (e) => setTunerRam(Number(e.target.value)),
							className: "mt-2 w-full accent-fg"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-xs text-muted cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: tunerUnified,
									onChange: (e) => setTunerUnified(e.target.checked),
									className: "accent-fg"
								}), "Unified Memory (Apple M / APU)"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleApplyTuner,
								className: "mt-3 min-h-9 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg hover:opacity-90 font-mono",
								children: ["apply ", tunerUnified ? `${tunerRam}GB unified` : `${tunerGpuCount}x ${tunerVram}GB vram`]
							})]
						})
					]
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: TASKS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTask(t.id),
					className: cn("min-h-11 border px-3 py-2 text-xs uppercase tracking-widest", task === t.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg hover:text-fg"),
					children: t.label
				}, t.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 border border-line bg-surface p-1 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "px-2 text-2xs uppercase tracking-widest text-dim",
					children: "Context:"
				}), CONTEXT_OPTIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setContextK(c.id);
						if (result) run({
							preset: result.specs,
							ctx: c.id,
							skipScroll: true
						});
					},
					className: cn("px-2.5 py-1 text-2xs uppercase tracking-wider", contextK === c.id ? "bg-fg text-bg" : "text-muted hover:text-fg"),
					children: c.label
				}, c.id))]
			})]
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
		busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalProcessing, {
			specsSummary: activeSummary,
			contextK
		}) : result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "enter-up mt-10",
			ref: resultRef,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchResults, {
				result,
				onContextChange: (ctx) => {
					setContextK(ctx);
					run({
						preset: result.specs,
						ctx,
						skipScroll: true
					});
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WatcherCTA, { specs: result.specs })]
		}) : null
	] });
}
function WatcherCTA({ specs }) {
	const [contact, setContact] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	const vramTier = specs.unified ? specs.ramGb : specs.vramGb * Math.max(1, specs.gpuCount || 1);
	async function submit() {
		if (!contact.trim()) {
			setStatus("Enter email or Discord webhook URL");
			return;
		}
		setBusy(true);
		setStatus(null);
		try {
			const res = await createWatcher({ data: {
				rig: {
					gpu: specs.gpu,
					vramGb: specs.vramGb,
					ramGb: specs.ramGb,
					unified: specs.unified,
					gpuCount: specs.gpuCount
				},
				contact: contact.trim()
			} });
			if (res && res.ok) {
				setDone(true);
				setStatus(res.already ? "Already watching this rig ✓" : "Watching — we'll alert when a new GGUF fits your rig");
			} else setStatus(res?.error || "Failed — try again");
		} catch {
			setStatus("Failed — try again");
		} finally {
			setBusy(false);
		}
	}
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓" }),
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: status })
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 border border-line bg-surface p-4 flex flex-col gap-3 sm:flex-row sm:items-end",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-2xs uppercase tracking-[0.24em] text-muted",
					children: [
						"watch this rig · fits ≤ ",
						vramTier,
						"GB"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted leading-relaxed",
					children: "Get pinged when a new GGUF ≤ your rig drops. No account, one email/webhook, unsubscribe anytime."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: contact,
					onChange: (e) => setContact(e.target.value),
					placeholder: "email or https://discord.com/api/webhooks/...",
					className: "mt-2 w-full min-h-10 border border-line bg-bg px-3 text-xs font-mono focus:border-fg focus:outline-none"
				}),
				status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-xs font-mono text-dim",
					children: status
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled: busy,
			onClick: submit,
			className: "min-h-10 shrink-0 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg disabled:opacity-50 hover:opacity-90",
			children: busy ? "saving…" : "notify me"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecBench, {}) });
}
//#endregion
export { Home as component };
