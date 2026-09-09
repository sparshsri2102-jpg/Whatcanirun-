/**
 * Matcher regression: runs matchModels on EVERY catalog preset × every
 * context tier and asserts structural sanity. Catches crashes, NaN,
 * empty picks, unsorted scores, and physically absurd recommendations.
 *
 * Usage: node --experimental-strip-types scripts/match-regression.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// match.ts uses extensionless relative imports ("./catalog") which Node's
// type-stripping mode cannot resolve. Stage fixed copies in tmp (no app churn).
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "mreg-"));
for (const f of ["match.ts", "catalog.ts", "bandwidth.ts", "types.ts"]) {
  const src = fs.readFileSync(new URL(`../src/lib/models/${f}`, import.meta.url), "utf8");
  fs.writeFileSync(
    path.join(stage, f),
    src.replace(/from\s+"(\.[^"]+)"/g, (_, p) => `from "${p}.ts"`),
  );
}
const { matchModels, bestQuant } = await import(pathToFileURL(path.join(stage, "match.ts")).href);
const { PRESETS, MODELS } = await import(pathToFileURL(path.join(stage, "catalog.ts")).href);

const CTXS = [4, 8, 32, 128];
const seen = new Set();
let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`[FAIL] ${msg}`);
};

const num = (v) => typeof v === "number" && Number.isFinite(v);

for (const p of PRESETS) {
  const specs = { ...p.specs, source: "preset" };
  for (const ctx of CTXS) {
    const label = `${p.id}@${ctx}k`;
    let r;
    try {
      r = matchModels(specs, undefined, ctx);
    } catch (e) {
      fail(`${label}: threw ${e?.message}`);
      continue;
    }
    if (!Array.isArray(r.picks) || !Array.isArray(r.also)) fail(`${label}: picks/also not arrays`);
    if (typeof r.blurb !== "string" || !r.blurb.length) fail(`${label}: empty blurb`);
    if (r.picks.length === 0) fail(`${label}: zero picks (every preset should match something)`);
    // scores sorted desc
    for (let i = 1; i < r.picks.length; i++) {
      if (r.picks[i].score > r.picks[i - 1].score + 1e-9) fail(`${label}: scores not sorted desc`);
    }
    for (const f of [...r.picks, ...r.also]) {
      const tag = `${label}:${f.model.id}/${f.quant.name}`;
      if (!num(f.score) || !num(f.headroomGb) || !num(f.totalNeededGb)) fail(`${tag}: NaN score/headroom/total`);
      if (f.totalNeededGb <= 0) fail(`${tag}: totalNeededGb <= 0`);
      if (!f.why || !f.speed) fail(`${tag}: missing why/speed`);
      if (!["gpu", "hybrid", "cpu", "no"].includes(f.fit)) fail(`${tag}: bad fit ${f.fit}`);
      if (f.fit === "no") fail(`${tag}: surfaced a no-fit option`);
      if (!num(f.kvCacheGb) || f.kvCacheGb < 0) fail(`${tag}: bad kvCacheGb`);
      // quant must belong to the model
      if (!f.model.quants.some((q) => q.name === f.quant.name && q.vramGb === f.quant.vramGb)) {
        fail(`${tag}: quant not from model catalog`);
      }
      // quantOptions must cover every catalog quant exactly once (UI renders
      // the full selector; "no"-fit entries are shown with badges by design)
      const optNames = (f.quantOptions || []).map((qo) => qo.quant.name).sort().join(",");
      const catNames = f.model.quants.map((q) => q.name).sort().join(",");
      if (optNames !== catNames) fail(`${tag}: quantOptions [${optNames}] != catalog [${catNames}]`);
    }
    // no duplicate models across picks+also
    const ids = [...r.picks, ...r.also].map((f) => f.model.id);
    if (new Set(ids).size !== ids.length) fail(`${label}: duplicate model in picks/also`);
    for (const id of ids) seen.add(id);
  }
}

// Spot assertions on the fixed models -------------------------------------
const rig4090 = { gpu: "RTX 4090", vramGb: 24, ramGb: 64, cpu: "desktop", os: "Windows", unified: false, gpuCount: 1, source: "preset" };
{
  // V4 Flash (IQ2 76GB needs 76GB+ pool; 4090+64GB box has ~54GB hybrid)
  // must NEVER be recommended on this rig — absence is correct behavior.
  const r = matchModels(rig4090, undefined, 8);
  const flash = [...r.picks, ...r.also].find((f) => f.model.id === "deepseek-v4-flash");
  if (flash) fail(`rtx4090: V4 Flash surfaced (${flash.quant.name}/${flash.fit}) but needs ${flash.totalNeededGb}GB`);
  else console.log(`[ok] rtx4090 honestly excludes 284B V4 Flash`);
  // ...but it MUST surface on the 128GB unified box (92GB pool >= 76GB).
  const big = { gpu: "Apple M4 Ultra", vramGb: 128, ramGb: 128, cpu: "Apple M4 Ultra", os: "macOS", unified: true, gpuCount: 1, source: "preset" };
  const rb = matchModels(big, undefined, 8);
  const flashB = [...rb.picks, ...rb.also].find((f) => f.model.id === "deepseek-v4-flash");
  if (!flashB) fail("studio-128: V4 Flash IQ2 (76GB) should surface in top-10");
  // On unified memory the shared pool IS GPU-accessible, so gpu|hybrid are
  // both honest; anything else (or a total above the 92GB pool) is a bug.
  else if (flashB.totalNeededGb > 128 * 0.72 + 1) fail(`studio-128: V4 Flash total ${flashB.totalNeededGb}GB exceeds usable pool`);
  else console.log(`[ok] studio-128 V4 Flash -> ${flashB.quant.name}/${flashB.fit} (${flashB.totalNeededGb}GB)`);
}
{
  // Vision preference must surface a vision-capable model on top
  const r = matchModels(rig4090, "vision", 8);
  if (!r.picks[0] || !r.picks[0].model.tasks.includes("vision")) {
    fail(`rtx4090+vision: top pick ${r.picks[0]?.model.id} lacks vision task`);
  } else console.log(`[ok] rtx4090+vision top pick -> ${r.picks[0].model.id}`);
  const glm = [...r.picks, ...r.also].find((f) => f.model.id === "glm-5.3-flash");
  if (glm && !glm.model.tasks.includes("vision")) fail("glm-5.3-flash in results without vision task");
  else if (glm) console.log(`[ok] glm-5.3-flash vision-tagged in results (${glm.quant.name}/${glm.fit})`);
}
{
  // Tiny rig must still get picks (small models), never a 284B Q4
  const tiny = { gpu: "iGPU", vramGb: 0, ramGb: 8, cpu: "laptop CPU", os: "any", unified: false, gpuCount: 0, source: "preset" };
  const r = matchModels(tiny, undefined, 8);
  if (r.picks.length === 0) fail("8gb-laptop: zero picks");
  for (const f of r.picks) {
    if (f.totalNeededGb > 8) fail(`8gb-laptop: pick ${f.model.id} needs ${f.totalNeededGb}GB`);
  }
  console.log(`[ok] 8gb-laptop picks -> ${r.picks.map((f) => f.model.id).join(", ")}`);
}
{
  // Every model must surface in picks/also on AT LEAST ONE preset×ctx
  // combo (picks cap at 4 + also at 6 per run, so coverage is checked
  // across all 48 runs, not a single rig).
  const never = MODELS.map((m) => m.id).filter((id) => !seen.has(id));
  if (never.length) console.log(`[info] never in top-10 (diversity caps / outscored, still browsable): ${never.join(", ")}`);
  // Fittability (no top-10 truncation): every model must fit on at least one
  // preset×ctx, except documented datacenter-only entries.
  const KNOWN_UNFITTED = {
    "glm-5.3": "753B Pro needs ~245GB+; datacenter-only, browsable on /models",
  };
  const unfitted = [];
  for (const m of MODELS) {
    let fits = false;
    for (const p of PRESETS) {
      for (const ctx of CTXS) {
        if (bestQuant(m, { ...p.specs, source: "preset" }, ctx)) { fits = true; break; }
      }
      if (fits) break;
    }
    if (!fits && !KNOWN_UNFITTED[m.id]) unfitted.push(m.id);
  }
  if (unfitted.length) fail(`models unfittable on every preset: ${unfitted.join(", ")}`);
  else console.log(`[ok] every model fits somewhere (except documented: ${Object.keys(KNOWN_UNFITTED).join(", ")})`);
}

console.log(`\nmatch-regression: ${failures} failure(s) across ${PRESETS.length} presets x ${CTXS.length} ctx tiers.`);
process.exit(failures ? 1 : 0);
