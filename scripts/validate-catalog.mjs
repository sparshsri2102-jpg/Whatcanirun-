/**
 * Catalog validation harness — prevents wrong model specs from shipping.
 *
 * Created after a user caught DeepSeek-V4 Flash listed as "~150B / 256k"
 * when the official source says 284B total / 13B active / 1M context.
 *
 * Usage:
 *   node --experimental-strip-types scripts/validate-catalog.mjs        # local checks only
 *   node --experimental-strip-types scripts/validate-catalog.mjs --live # + Hugging Face API checks
 *
 * Exit code: 0 = pass, 1 = any ERROR. WARN never fails (network flakiness).
 * Live checks that cannot reach HF are reported as SKIP, not ERROR.
 */
import { MODELS } from "../src/lib/models/catalog.ts";

const LIVE = process.argv.includes("--live");
const errors = [];
const warnings = [];
const skips = [];

const err = (id, msg) => errors.push(`[ERROR] ${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`[WARN] ${id}: ${msg}`);
const skip = (id, msg) => skips.push(`[SKIP] ${id}: ${msg}`);

// Bytes-per-param bands per quant family (weights + small runtime headroom).
// Catalog numbers intentionally include headroom (mmproj, vocab, buffers),
// so bands are WIDE: they catch gross errors (e.g. Q4=80GB on a 284B model
// = 0.28 B/param) without churning every tuned entry.
// Non-LLM entries (audio/embed/image) use system footprints, not pure
// weights — they are exempt from band checks (see below).
const QUANT_BANDS = {
  IQ2: [0.18, 0.38],
  Q3: [0.28, 0.58],
  Q4: [0.4, 0.82],
  Q5: [0.52, 0.95],
  Q8: [0.8, 1.35],
  FP8: [0.85, 1.25],
  FP16: [1.7, 2.6],
};

// Tasks whose quant numbers are system footprints, not weight sizes.
const NON_LLM_TASKS = new Set(["audio", "embed", "image"]);

const LICENSE_ALIASES = {
  "apache-2.0": ["apache-2.0", "apache 2.0"],
  mit: ["mit"],
  gemma: ["gemma"],
  "llama 4": ["llama", "llama4", "llama 4"],
  "llama 3.3": ["llama", "llama3.3", "llama 3.3"],
  "llama 3.2": ["llama", "llama3.2", "llama 3.2"],
  nvidia: ["nvidia", "nvda"],
  "stability community": ["stability", "community"],
  "non-commercial": ["non-commercial", "noncommercial", "nc"],
  "cc-by-nc": ["cc-by-nc", "non-commercial", "noncommercial"],
  openrail: ["openrail"],
};

function normLicense(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
}

function licenseMatches(catalogLicense, hfTags) {
  const want = normLicense(catalogLicense);
  const hfLicTags = (hfTags || [])
    .filter((t) => t.startsWith("license:"))
    .map((t) => normLicense(t.slice("license:".length)));
  if (hfLicTags.length === 0) return null; // unknown — caller decides
  if (hfLicTags.includes("other")) return "custom"; // custom license — needs human eyes / allowlist
  // Direct match on any known license token
  if (hfLicTags.some((t) => t === want || t.includes(want) || want.includes(t))) return true;
  const aliases = LICENSE_ALIASES[catalogLicense] || LICENSE_ALIASES[want] || [];
  if (aliases.some((a) => hfLicTags.some((t) => t.includes(normLicense(a))))) return true;
  return false;
}

// Catalog display name -> HF cardData.license_name for custom (license:other) repos.
// Verified 2026-09-09. If HF moves a repo to a standard license, the "custom"
// branch above stops matching and the normal check applies again.
const CUSTOM_LICENSE_OK = {
  "Llama 4": ["llama4"],
  NVIDIA: ["nvidia-nemotron-open-model-license"],
  "Non-commercial": ["flux-1-dev-non-commercial-license"],
  "Stability Community": ["stabilityai-ai-community"],
  "GLM-5.3": ["glm-5.3"],
  "Qwen-Community": ["qwen-community-1.0"],
};

function customLicenseOk(catalogLicense, cardData) {
  const got = normLicense(cardData?.license_name || cardData?.license || "");
  const wantList = CUSTOM_LICENSE_OK[catalogLicense] || [];
  return wantList.some((w) => got.includes(normLicense(w)));
}

// Text-generation models that deliberately omit the "chat" task
// (code-specialist convention: they match code/agent queries, not chat).
const TASK_CHAT_OPT_OUT = {
  "devstral-small": "agentic coding specialist; matches code/agent, not chat",
  "qwen2.5-coder-32b": "coding specialist; matches code/agent, not chat",
};

// Models whose catalog contextK intentionally differs from a machine-readable
// default (vendor-documented extension or build-default header). The validator
// requires the catalog value to EXACTLY equal the curated value — so a typo
// still fails, but a verified vendor number passes. Consulted by BOTH the
// main-config check and the GGUF fallback check.
const KNOWN_EXTENDED_CTX = {
  "qwen3-8b": { ctx: 128, why: "Qwen3 YaRN-extended to 131k (native 32k)" },
  "qwen3-32b": { ctx: 128, why: "Qwen3 YaRN-extended to 131k (native 32k)" },
  "nomic-embed": { ctx: 8, why: "vendor docs: 8192 via dynamic NTK scaling" },
  "command-r7b": { ctx: 128, why: "Cohere spec sheet: 128k (GGUF header 8k is a build default)" },
  "gemma3-4b": { ctx: 128, why: "Google spec: 128k for Gemma 3" },
};

function hfRepoId(url) {
  const m = String(url || "").match(/huggingface\.co\/([^/]+\/[^/?#]+)/);
  return m ? m[1].replace(/\/$/, "") : null;
}

async function fetchJson(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "whatcanirun-validator" } });
    if (!res.ok) return { status: res.status, data: null };
    return { status: 200, data: await res.json() };
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------- local checks
for (const m of MODELS) {
  // 1. params string must contain the headline number
  const headlineB = m.moe && m.totalParamsB ? m.totalParamsB : m.paramsB;
  const digits = String(headlineB).replace(".", "\\.");
  if (headlineB >= 1 && !new RegExp(`\\b${digits}\\s*B\\b|\\b${digits}B\\b`, "i").test(m.params)) {
    // Allow "30B-A3B" style (total-active) and "MoE 284B · 13B active" style
    if (!m.params.includes(String(headlineB))) err(m.id, `params string "${m.params}" does not contain headline ${headlineB}B`);
  }
  // 2. MoE entries must carry totalParamsB and paramsB must be active (<= total)
  if (m.moe) {
    if (m.totalParamsB == null) err(m.id, "moe=true but totalParamsB is missing");
    else if (m.paramsB > m.totalParamsB) err(m.id, `paramsB (${m.paramsB}) > totalParamsB (${m.totalParamsB}) — paramsB must be ACTIVE params for MoE`);
  }
  // 3. Quant sizes must be plausible for the total param count
  const total = m.moe && m.totalParamsB ? m.totalParamsB : m.paramsB;
  const isNonLlm = m.tasks.every((t) => NON_LLM_TASKS.has(t));
  if (total >= 1 && !isNonLlm) {
    for (const q of m.quants) {
      const band = QUANT_BANDS[q.name];
      if (!band) {
        warn(m.id, `unknown quant family "${q.name}" — add a band to QUANT_BANDS`);
        continue;
      }
      const bpp = q.vramGb / total;
      if (bpp < band[0] || bpp > band[1]) {
        err(
          m.id,
          `quant ${q.name}=${q.vramGb}GB implies ${bpp.toFixed(2)} B/param on a ${total}B model (band ${band[0]}–${band[1]}). ` +
            `For a ${total}B model expect roughly ${(total * band[0]).toFixed(0)}–${(total * band[1]).toFixed(0)} GB.`,
        );
      }
    }
  }
  // 4. Quant quality should not decrease as weights get bigger
  const qs = [...m.quants].sort((a, b) => a.vramGb - b.vramGb);
  for (let i = 1; i < qs.length; i++) {
    if (qs[i].quality < qs[i - 1].quality) err(m.id, `quality drops from ${qs[i - 1].name} (${qs[i - 1].quality}) to ${qs[i].name} (${qs[i].quality})`);
  }
  // 5. released format + not in the future
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.released)) err(m.id, `released "${m.released}" is not YYYY-MM`);
  // 6. URLs well-formed
  if (!hfRepoId(m.hf)) err(m.id, `hf URL malformed: ${m.hf}`);
  if (m.gguf && !hfRepoId(m.gguf)) err(m.id, `gguf URL malformed: ${m.gguf}`);
  // 7. contextK sane
  if (!Number.isFinite(m.contextK) || m.contextK < 0) err(m.id, `contextK invalid: ${m.contextK}`);
}

// ---------------------------------------------------------------- live checks
if (LIVE) {
  for (const m of MODELS) {
    const repo = hfRepoId(m.hf);
    if (!repo) continue;
    let api;
    try {
      api = await fetchJson(`https://huggingface.co/api/models/${repo}`);
    } catch {
      skip(m.id, `HF unreachable for ${repo}`);
      continue;
    }
    if (api.status === 401 || api.status === 403) {
      skip(m.id, `gated repo ${repo} (HTTP ${api.status}) — cannot verify without HF token`);
      continue;
    }
    if (api.status === 404 || !api.data) {
      err(m.id, `hf repo ${repo} returns ${api.status} — dead link?`);
      continue;
    }
    if (api.status !== 200) {
      skip(m.id, `HF returned ${api.status} for ${repo}`);
      continue;
    }
    const d = api.data;
    // A. total params vs safetensors header (10% tolerance covers
    // vision encoders / embeddings overhead; the Flash bug was 48% off)
    const hfTotal = d?.safetensors?.total;
    if (typeof hfTotal === "number" && hfTotal > 1e6) {
      const catalogTotal = (m.moe && m.totalParamsB ? m.totalParamsB : m.paramsB) * 1e9;
      const drift = Math.abs(hfTotal - catalogTotal) / hfTotal;
      if (drift > 0.1) {
        err(m.id, `param drift: HF safetensors total ${(hfTotal / 1e9).toFixed(1)}B vs catalog ${catalogTotal / 1e9}B (${(drift * 100).toFixed(0)}% off)`);
      }
    }
    // B. license vs HF tags
    const lic = licenseMatches(m.license, d?.tags);
    if (lic === false) {
      const hfLic = (d?.tags || []).filter((t) => t.startsWith("license:")).join(",");
      err(m.id, `license mismatch: catalog "${m.license}" vs HF [${hfLic || "none"}] — see ${m.hf}`);
    } else if (lic === "custom") {
      if (customLicenseOk(m.license, d?.cardData)) {
        // verified custom license — silent pass
      } else {
        const hfLic = (d?.tags || []).filter((t) => t.startsWith("license:")).join(",");
        warn(m.id, `custom HF license [${hfLic}] (license_name=${d?.cardData?.license_name}) — catalog says "${m.license}"; verify by hand`);
      }
    }
    // B2. capability tags vs HF pipeline_tag — catches missing vision/image/
    // audio/embed tags (e.g. GLM-5.3 Flash shipped without vision).
    const pipe = d?.pipeline_tag;
    const has = (t) => m.tasks.includes(t);
    if (pipe) {
      const need = (task) => {
        if (!has(task)) err(m.id, `missing "${task}" task: HF pipeline_tag is "${pipe}" — see ${m.hf}`);
      };
      if (pipe === "image-text-to-text") need("vision");
      else if (pipe === "text-to-image") need("image");
      else if (pipe === "automatic-speech-recognition" || pipe === "text-to-speech" || pipe.startsWith("audio")) need("audio");
      else if (pipe === "sentence-similarity" || pipe === "feature-extraction") need("embed");
      else if (pipe === "text-generation") {
        // Code-specialists deliberately omit chat (convention); everything
        // else that generates text must be chattable.
        if (!has("chat") && !TASK_CHAT_OPT_OUT[m.id]) {
          warn(m.id, `text-generation model without "chat" task — intentional code-specialist? If so, add to TASK_CHAT_OPT_OUT with a reason.`);
        }
      }
      // Reverse: claiming vision on a text-only pipe is a stale tag.
      if (has("vision") && pipe === "text-generation") {
        warn(m.id, `claims "vision" but HF pipeline_tag is "text-generation" — stale tag? Verify by hand.`);
      }
    }
    // C. release month vs HF createdAt (2+ months ahead = suspicious;
    // 1 month is usually a month-boundary artifact)
    if (d?.createdAt) {
      const hfMonth = String(d.createdAt).slice(0, 7);
      const monthsAhead =
        (Number(m.released.slice(0, 4)) - Number(hfMonth.slice(0, 4))) * 12 +
        (Number(m.released.slice(5, 7)) - Number(hfMonth.slice(5, 7)));
      if (monthsAhead >= 2) warn(m.id, `catalog released ${m.released} is ${monthsAhead}mo AFTER HF creation ${hfMonth} — model may be older than listed`);
    }
    // D. context length vs config.json max_position_embeddings
    let cfgK = null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const cfgRes = await fetch(`https://huggingface.co/${repo}/raw/main/config.json`, {
        signal: ctrl.signal,
        headers: { "User-Agent": "whatcanirun-validator" },
      });
      clearTimeout(t);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        const maxPos =
          cfg.max_position_embeddings ||
          cfg.text_config?.max_position_embeddings ||
          cfg.llm_config?.max_position_embeddings ||
          cfg.max_sequence_length ||
          cfg.seq_length;
        if (typeof maxPos === "number" && maxPos >= 1024) {
          cfgK = Math.round(maxPos / 1024);
          if (m.contextK > 0) {
            const known = KNOWN_EXTENDED_CTX[m.id];
            if (known) {
              if (m.contextK !== known.ctx) {
                err(m.id, `extended-context exception stale: catalog ${m.contextK}k but curated value is ${known.ctx}k (${known.why})`);
              }
            } else {
              const ratio = m.contextK / cfgK;
              if (ratio > 4.05 || ratio < 0.24) {
                err(m.id, `context mismatch: catalog ${m.contextK}k vs config max_position ${cfgK}k — see ${m.hf}/raw/main/config.json`);
              } else if (ratio > 2.05 || ratio < 0.49) {
                warn(m.id, `context differs 2–4x: catalog ${m.contextK}k vs config ${cfgK}k — extended-context or stale?`);
              }
            }
          }
        }
      }
    } catch {
      skip(m.id, `config.json unreachable for ${repo}`);
    }
    // E. gguf repo exists (401/403 = gated, not dead) + runnable context check
    if (m.gguf) {
      const grewpo = hfRepoId(m.gguf);
      try {
        const g = await fetchJson(`https://huggingface.co/api/models/${grewpo}`);
        if (g.status === 401 || g.status === 403) skip(m.id, `gated gguf repo ${grewpo} — cannot verify`);
        else if (g.status === 404 || !g.data) err(m.id, `gguf repo ${grewpo} returns ${g.status} — dead link?`);
        else if (g.status !== 200) skip(m.id, `HF returned ${g.status} for gguf ${grewpo}`);
        else if (cfgK == null) {
          // Main config had no usable max_position (gated raw file or new
          // architecture layout) — fall back to the GGUF's declared
          // context_length as the source.
          const ggufCtx = g.data?.gguf?.context_length;
          if (typeof ggufCtx === "number" && ggufCtx >= 1024 && m.contextK > 0) {
            const ggufK = Math.round(ggufCtx / 1024);
            const known = KNOWN_EXTENDED_CTX[m.id];
            if (known) {
              if (m.contextK !== known.ctx) {
                err(m.id, `extended-context exception stale: catalog ${m.contextK}k but curated value is ${known.ctx}k (${known.why})`);
              }
            } else {
              const ratio = m.contextK / ggufK;
              if (ratio > 4.05 || ratio < 0.24) {
                err(m.id, `context mismatch: catalog ${m.contextK}k vs GGUF context_length ${ggufK}k — see ${m.gguf}`);
              } else if (ratio > 2.05 || ratio < 0.49) {
                warn(m.id, `context differs 2–4x: catalog ${m.contextK}k vs GGUF ${ggufK}k — verify by hand`);
              }
            }
          }
        }
      } catch {
        skip(m.id, `HF unreachable for gguf ${grewpo}`);
      }
    }
    // Be nice to the API
    await new Promise((r) => setTimeout(r, 250));
  }
}

// ---------------------------------------------------------------- report
for (const w of warnings) console.log(w);
for (const s of skips) console.log(s);
for (const e of errors) console.log(e);
console.log(`\nvalidate-catalog${LIVE ? " --live" : ""}: ${errors.length} error(s), ${warnings.length} warning(s), ${skips.length} skipped, ${MODELS.length} models checked.`);
process.exit(errors.length ? 1 : 0);
