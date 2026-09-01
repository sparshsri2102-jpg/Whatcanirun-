import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputPublic = join(root, ".output", "public");
const distDir = join(root, "dist");

if (existsSync(outputPublic)) {
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  cpSync(outputPublic, distDir, { recursive: true });
  console.log("[postbuild] Synchronized .output/public -> dist/");
}

// SEO: sitemap.xml + robots.txt (Fix 3)
{
  const base = "https://myllmstack.vercel.app";
  const staticPaths = ["/", "/models", "/drops", "/skills", "/sponsor", "/share"];
  const topModels = ["qwen3-8b","qwen3.5-9b","qwen3.8-27b","llama-3.3-70b","gemma3-12b","mistral-small-3.2"];
  const topRigs = ["rtx-3060","rtx-4070","rtx-4090","m4-16","m4-max-64","8gb-laptop","rtx-5090","cpu-32"];
  const seoPaths = [];
  for (const m of topModels) for (const r of topRigs) seoPaths.push(`/can/${m}-on-${r}`);
  const all = [...staticPaths, ...seoPaths];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${all.map(p=> `<url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>${p.startsWith('/can/')? '0.7':'0.9'}</priority></url>`).join("")}</urlset>`;
  const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
  for (const dir of [outputPublic, distDir, join(root, ".vercel", "output", "static")].filter(existsSync)) {
    try { writeFileSync(join(dir, "sitemap.xml"), sitemap, "utf-8"); writeFileSync(join(dir, "robots.txt"), robots, "utf-8"); console.log(`[postbuild] Wrote sitemap.xml (${all.length} urls) + robots.txt to ${dir}`);} catch {}
  }
}

// Vercel fix: files with `+` in name (e.g. h3+rou3+srvx.mjs) cause
// ERR_MODULE_NOT_FOUND at runtime on Vercel — the `+` is mishandled
// during the upload or Node ESM resolution. Rename on disk and patch
// all import references in the built output.
for (const outDir of [join(root, ".vercel", "output"), join(root, ".output")]) {
  if (!existsSync(outDir)) continue;
  const filesToPatch = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.includes("+")) {
        const safe = ent.name.replaceAll("+", "_");
        const safePath = join(dir, safe);
        renameSync(p, safePath);
        console.log(`[postbuild] Sanitized chunk: ${ent.name} -> ${safe}`);
        filesToPatch.push({ from: ent.name, to: safe });
      }
    }
  }
  walk(outDir);
  if (filesToPatch.length) {
    function patchImports(dir) {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, ent.name);
        if (ent.isDirectory()) patchImports(p);
        else if (ent.name.endsWith(".mjs") || ent.name.endsWith(".js") || ent.name.endsWith(".json")) {
          try {
            const content = readFileSync(p, "utf-8");
            let patched = content;
            for (const { from, to } of filesToPatch) {
              if (patched.includes(from)) patched = patched.split(from).join(to);
            }
            if (patched !== content) {
              writeFileSync(p, patched, "utf-8");
              console.log(`[postbuild] Patched imports in ${p.slice(outDir.length + 1)}`);
            }
          } catch { /* binary or unreadable */ }
        }
      }
    }
    patchImports(outDir);
  }
}
