/**
 * Shared SEO/AEO corpus: staged catalog + FAQ imports, route/LLM text union,
 * sitemap slugs, and tokenization. Imported by seo-keywords.mjs (coverage)
 * and aeo-statements.mjs (answerability) so both gates test the same truth.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

export const STOP = new Set(
  "i,me,my,we,you,your,he,she,it,they,what,which,who,that,this,these,those,is,are,was,have,has,do,does,a,an,the,and,or,for,with,of,at,by,to,from,on,in,can,how,much,does,should,there,here,best,good,top,vs,without,with,run,running,runs,use,using,used,need,needs,get,like".split(","),
);

export const norm = (s) => s.toLowerCase().replace(/q(\d)_k_m/g, "q$1km");

export const toks = (s) =>
  norm(s)
    .split(/[^a-z0-9+.#]+/)
    .map((w) => w.replace(/[.]+$/, ""))
    .filter((w) => w.length >= 2 && !STOP.has(w));

const stage = fs.mkdtempSync(path.join(os.tmpdir(), "seocorp-"));
for (const f of ["src/lib/models/catalog.ts", "src/lib/content/faq.ts"]) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  fs.writeFileSync(path.join(stage, path.basename(f)), src);
}

export const { MODELS, PRESETS } = await import(pathToFileURL(path.join(stage, "catalog.ts")).href);
export const { FAQS } = await import(pathToFileURL(path.join(stage, "faq.ts")).href);

const routeFiles = [
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/components/spec-bench.tsx",
  "src/components/faq-section.tsx",
  "src/lib/content/faq.ts",
  "src/lib/models/catalog.ts",
  "src/lib/skills/catalog.ts",
  "src/lib/skills/discovery.ts",
  "src/routes/models.tsx",
  "src/routes/skills.tsx",
  "src/routes/drops.tsx",
  "src/routes/share.tsx",
  "src/routes/sponsor.tsx",
  "src/routes/can.$slug.tsx",
  "public/llms.txt",
];

export let routeTextUnion = "";
for (const f of routeFiles) {
  try {
    routeTextUnion += "\n" + norm(fs.readFileSync(path.join(ROOT, f), "utf8"));
  } catch {}
}

export const faqEntries = FAQS.map((f) => norm(`${f.q} ${f.a}`));

const staticSlugs = ["models", "drops", "skills", "share", "sponsor", "bench"];
const canSlugs = [];
for (const m of MODELS) for (const p of PRESETS) canSlugs.push(`${m.id}-on-${p.id}`.toLowerCase());
export const slugText = [...staticSlugs, ...canSlugs].join(" ");

/**
 * A statement/keyword is covered when every content token appears in ONE
 * retrievable unit: a single FAQ entry (best — citable capsule), the site
 * copy union, or a sitemap URL slug.
 */
export function covered(text) {
  const tokens = [...new Set(toks(text))];
  if (tokens.length === 0) return { ok: true, via: "empty" };
  for (const f of faqEntries) {
    if (tokens.every((t) => f.includes(t))) return { ok: true, via: "faq" };
  }
  if (tokens.every((t) => routeTextUnion.includes(t))) return { ok: true, via: "copy" };
  const slugTokens = tokens.map((t) => t.replaceAll(".", "-"));
  if (slugTokens.every((t) => slugText.includes(t))) return { ok: true, via: "slug" };
  return { ok: false, via: null, missing: tokens.filter((t) => !(faqEntries.some((f) => f.includes(t)) || routeTextUnion.includes(t) || slugText.includes(t.replaceAll(".", "-")))) };
}
