/**
 * Skills catalog validation harness — data integrity for the skill finder.
 *
 * Usage:
 *   node --experimental-strip-types scripts/validate-skills.mjs        # local checks only
 *   node --experimental-strip-types scripts/validate-skills.mjs --live # + GitHub repo checks
 *
 * Exit 0 = pass (warnings ok). Exit 1 = any ERROR.
 * Live checks that cannot reach GitHub are SKIP, not ERROR.
 */
import { SKILLS } from "../src/lib/skills/catalog.ts";

const LIVE = process.argv.includes("--live");
const errors = [];
const warnings = [];
const skips = [];

const err = (id, msg) => errors.push(`[ERROR] ${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`[WARN] ${id}: ${msg}`);
const skip = (id, msg) => skips.push(`[SKIP] ${id}: ${msg}`);

const CATEGORIES = new Set([
  "leadership",
  "engineering",
  "security",
  "devops",
  "design",
  "data",
  "content",
  "product",
]);

// ---------------------------------------------------------------- local checks
{
  const ids = SKILLS.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const d of [...new Set(dupes)]) err(d, "duplicate skill id");

  for (const s of SKILLS) {
    if (!s.name?.trim()) err(s.id, "missing name");
    if (!s.description || s.description.length < 40) err(s.id, "description too short (<40 chars)");
    if (!CATEGORIES.has(s.category)) err(s.id, `bad category "${s.category}"`);
    if (!s.role?.trim()) err(s.id, "missing role");
    if (!Array.isArray(s.tags) || s.tags.length < 3) err(s.id, "fewer than 3 tags");
    if (!(s.stars > 0)) err(s.id, `stars invalid: ${s.stars}`);
    if (!s.url.includes(s.repo)) err(s.id, `url does not contain repo (${s.repo})`);
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(s.url)) err(s.id, `url not a clean repo URL: ${s.url}`);
    const tagDupes = s.tags.filter((t, i) => s.tags.indexOf(t) !== i);
    if (tagDupes.length) warn(s.id, `duplicate tags: ${[...new Set(tagDupes)].join(",")}`);
  }

  // ROLE_INTENTS targets must all exist (typo'd target = dead boost).
  // NOTE: ROLE_INTENTS is module-private; re-derive by importing source text.
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../src/lib/skills/catalog.ts", import.meta.url), "utf8");
  const m = src.match(/const ROLE_INTENTS[^{]*\{([\s\S]*?)\n\};/);
  const intents = eval("({" + m[1] + "})");
  const idSet = new Set(ids);
  let referenced = new Set();
  for (const [key, targets] of Object.entries(intents)) {
    for (const t of targets) {
      if (!idSet.has(t)) err(`intent:${key}`, `target skill "${t}" does not exist`);
      referenced.add(t);
    }
  }
  // Skills intentionally discoverable via tags only: giving them an intent
  // keyword would hijack unrelated queries (verified per case).
  const KNOWN_TAG_ONLY = {
    "planning-with-files": "planning intent would steal release-manager queries from docker-cicd",
    "addyosmani-agent-skills": "production intent would steal outage runbooks from sre",
    "open-design": "design intent would disturb frontend/brand ordering; tags suffice",
    "claude-mem": "memory intent would steal memory-safe concurrency from rust-systems",
  };
  for (const s of SKILLS) {
    if (!referenced.has(s.id) && !KNOWN_TAG_ONLY[s.id]) {
      warn(s.id, "no intent keyword routes to this skill (discoverable only via tags)");
    }
  }

  // Category coverage floor: every filter chip should have real depth.
  const perCat = {};
  for (const s of SKILLS) perCat[s.category] = (perCat[s.category] || 0) + 1;
  for (const [cat, n] of Object.entries(perCat)) {
    if (n < 2) warn(`category:${cat}`, `only ${n} skill(s) — thin filter results`);
  }
}

// ---------------------------------------------------------------- live checks
if (LIVE) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "whatcanirun-skills-validator/1.0",
  };
  if (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.startsWith("your_")) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const get = async (url, ms = 20000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (!res.ok) return { status: res.status, data: null };
      return { status: 200, data: await res.json() };
    } finally {
      clearTimeout(t);
    }
  };

  for (const s of SKILLS) {
    let api;
    try {
      api = await get(`https://api.github.com/repos/${s.repo}`);
    } catch {
      skip(s.id, `GitHub unreachable for ${s.repo}`);
      continue;
    }
    if (api.status === 404 || !api.data) {
      err(s.id, `repo ${s.repo} returns ${api.status} — dead link?`);
      continue;
    }
    if (api.status !== 200) {
      skip(s.id, `GitHub returned ${api.status} for ${s.repo}`);
      continue;
    }
    const d = api.data;
    // A. stars drift (tiers must track reality)
    const live = d.stargazers_count;
    if (typeof live === "number" && live > 0) {
      const drift = Math.abs(live - s.stars) / live;
      if (drift > 1.0) err(s.id, `stars stale: catalog ${s.stars} vs live ${live} — resync tiers`);
      else if (drift > 0.3) warn(s.id, `stars drifting: catalog ${s.stars} vs live ${live}`);
    }
    // B. archived / dead repos
    if (d.archived) warn(s.id, `repo archived — consider a maintained alternative`);
    if (d.disabled) err(s.id, `repo disabled`);
    // C. maintenance freshness (informational only — awesome-lists update rarely)
    if (d.pushed_at) {
      const days = (Date.now() - Date.parse(d.pushed_at)) / 86400000;
      if (days > 365) warn(s.id, `no pushes in ${Math.round(days)}d — verify still maintained`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

// ---------------------------------------------------------------- report
for (const w of warnings) console.log(w);
for (const s of skips) console.log(s);
for (const e of errors) console.log(e);
console.log(`\nvalidate-skills${LIVE ? " --live" : ""}: ${errors.length} error(s), ${warnings.length} warning(s), ${skips.length} skipped, ${SKILLS.length} skills checked.`);
process.exit(errors.length ? 1 : 0);
