import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as requestSponsor, t as SiteShell } from "./site-shell-CbHb2Jlq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sponsor-MfLnSqK0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SponsorPage() {
	const [company, setCompany] = (0, import_react.useState)("");
	const [website, setWebsite] = (0, import_react.useState)("");
	const [tagline, setTagline] = (0, import_react.useState)("");
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
				slot
			} });
			if (!res.ok) setError(res.error);
			else setDone(true);
		} catch {
			setError("Could not send that. Try again.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SiteShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xs uppercase tracking-[0.28em] text-muted",
			children: "companies only"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 text-2xl sm:text-3xl",
			children: "put your name on the tape"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
			children: "Visitors never sign up. The top and bottom bars are for companies. Name, site, one line. We review, then you scroll by forever — or until you don’t."
		}),
		done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 border border-line p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm",
				children: "request in."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "We’ll use the website as the contact. No password, no dashboard. If the slot is a fit, your name starts moving."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit,
			className: "mt-10 max-w-lg space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "company"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						value: company,
						onChange: (e) => setCompany(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "website"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						type: "url",
						placeholder: "https://",
						value: website,
						onChange: (e) => setWebsite(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "tagline · 120 chars"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						maxLength: 120,
						value: tagline,
						onChange: (e) => setTagline(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xs uppercase tracking-widest text-muted",
						children: "slot"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: slot,
						onChange: (e) => setSlot(e.target.value),
						className: "mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "both",
								children: "top + bottom"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "top",
								children: "top only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "bottom",
								children: "bottom only"
							})
						]
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: busy,
					className: "min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg disabled:opacity-50",
					children: busy ? "sending…" : "request sponsor"
				})
			]
		})
	] });
}
//#endregion
export { SponsorPage as component };
