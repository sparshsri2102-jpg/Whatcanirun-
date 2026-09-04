// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { MODELS, PRESETS } from "@/lib/models/catalog";
import { matchModels } from "@/lib/models/match";
import type { Specs } from "@/lib/models/types";

export const Route = createFileRoute("/can/$slug")({ component: CanPage });

function parseSlug(slug: string): { modelId: string | null; presetId: string | null } {
  // slug like qwen3-8b-on-rtx-4060  or  qwen3-8b-on-m4-16  or  qwen3-8b-on-rtx-4090-24gb
  const parts = slug.toLowerCase().split("-on-");
  if (parts.length !== 2) return { modelId: null, presetId: null };
  const modelSlug = parts[0];
  const rigSlug = parts[1];
  // model id exact match first
  const model = MODELS.find(m => m.id === modelSlug || m.id.replaceAll(".", "-") === modelSlug);
  const preset = PRESETS.find(p => p.id === rigSlug || rigSlug.startsWith(p.id));
  return { modelId: model?.id ?? null, presetId: preset?.id ?? null };
}

function CanPage() {
  const { slug } = Route.useParams();
  const { modelId, presetId } = parseSlug(slug);
  const model = modelId ? MODELS.find(m => m.id === modelId) ?? null : null;
  const preset = presetId ? PRESETS.find(p => p.id === presetId) ?? null : null;

  if (!model || !preset) {
    return (
      <SiteShell>
        <h1 className="text-2xl">Not found</h1>
        <p className="mt-3 text-sm text-muted">Try <Link to="/models" className="underline">browse models</Link> or <Link to="/" className="underline">check your rig</Link>.</p>
        <p className="mt-6 text-xs text-dim">URL format: /can/qwen3-8b-on-rtx-4060</p>
      </SiteShell>
    );
  }

  const specs: Specs = { ...preset.specs, source: "preset", raw: preset.label };
  const res = matchModels(specs, undefined, 8);
  const pick = res.picks.find(p => p.model.id === model.id) ?? res.also.find(p => p.model.id === model.id);
  const can = !!pick;
  const title = can ? `Yes — ${model.name} runs on ${preset.label}` : `No — ${model.name} won't fit ${preset.label} at Q4`;
  const desc = pick ? `${model.name} (${model.params}) needs ${pick.quant.vramGb}GB VRAM at ${pick.quant.name} vs your ${preset.specs.vramGb || preset.specs.ramGb}GB ${preset.specs.unified ? 'unified' : 'VRAM'}. Estimated ${pick.speed}.` : `${model.name} needs ${model.quants[0]?.vramGb}GB+ and exceeds ${preset.label}. Try a smaller quant or model.`;
  const capacity = preset.specs.unified ? preset.specs.ramGb : preset.specs.vramGb * Math.max(1, preset.specs.gpuCount || 1);
  const sameRigOthers = res.picks.filter(p => p.model.id !== model.id).slice(0, 4);
  const sameModelRigs = PRESETS.filter(p => p.id !== preset.id).slice(0, 6);

  return (
    <SiteShell>
      <div className="text-2xs uppercase tracking-[0.28em] text-muted">can i run · seo</div>
      <h1 className="mt-3 text-2xl sm:text-3xl leading-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{desc}</p>
      <p className="mt-2 text-xs text-dim">{model.summary}</p>

      {pick ? (
        <div className="mt-6 border border-line bg-surface p-4">
          <div className="text-2xs uppercase tracking-widest text-dim">best fit on this rig · weights + KV + headroom</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="border border-fg bg-fg px-2 py-1 text-xs text-bg">{pick.quant.name} · {pick.quant.vramGb}GB weights</span>
            <span className="border border-line px-2 py-1 text-xs text-muted">+{(pick.kvCacheGb ?? 0.5)}GB KV @ 8k</span>
            <span className="border border-line px-2 py-1 text-xs text-muted">{pick.fit === 'gpu' ? 'fits GPU' : pick.fit}</span>
            <span className="border border-line px-2 py-1 text-xs text-muted">{pick.speed}</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left font-mono text-2xs">
              <thead><tr className="text-dim"><th className="py-1 pr-3">quant</th><th className="pr-3">weights</th><th className="pr-3">+ KV 8k</th><th>fits {capacity}GB?</th></tr></thead>
              <tbody>
                {model.quants.map(q => {
                  const need = Math.round((q.vramGb + (pick.kvCacheGb ?? 0.5)) * 10) / 10;
                  const fits = need <= capacity * 0.9;
                  return (
                    <tr key={q.name} className="border-t border-line/50">
                      <td className="py-1 pr-3 text-fg">{q.name}</td>
                      <td className="pr-3 text-muted">{q.vramGb}GB</td>
                      <td className="pr-3 text-muted">~{need}GB</td>
                      <td className={fits ? "text-emerald-400" : "text-warning"}>{fits ? "✓ yes" : "× tight/no"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-dim">File size ≠ runtime. KV grows with context — halve to 4k/2k if long chats OOM. Leave 1–2GB free.</p>
          <div className="mt-3 text-xs font-mono break-all bg-bg border border-line px-3 py-2">{model.run.ollama || model.run.llamacpp || model.hf}</div>
          <div className="mt-3 text-xs text-muted">Run it: <span className="font-mono text-fg">1)</span> install Ollama · <span className="font-mono text-fg">2)</span> copy command · <span className="font-mono text-fg">3)</span> verify with <span className="font-mono text-fg">ollama ps</span> (want 100% GPU).</div>
          <div className="mt-3 flex gap-3 text-xs">
            <a href={model.hf} target="_blank" rel="noreferrer" className="underline">huggingface</a>
            {model.gguf ? <a href={model.gguf} target="_blank" rel="noreferrer" className="underline">GGUF</a> : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 border border-line bg-surface p-4">
          <div className="text-sm">Alternatives that do fit {preset.label}:</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {res.picks.slice(0,4).map(p=> (
              <Link key={p.model.id} to={`/can/${p.model.id}-on-${preset.id}`} className="border border-line px-2 py-1 text-xs hover:border-fg">{p.model.name} · {p.quant.name}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <div className="text-2xs uppercase tracking-widest text-dim">faq · straight answers</div>
        <h2 className="mt-2 text-sm font-medium">Can {model.name} run on {preset.label}?</h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">{desc} Model context {model.contextK}k. Compare with <Link to="/models" className="underline">all models</Link> or re-check with your exact specs on <Link to="/" className="underline">the bench</Link>.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-line bg-surface p-3">
            <div className="text-xs font-medium text-fg">What if it OOMs?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">Unload with <span className="font-mono">ollama stop</span>, cap layers <span className="font-mono">--num-gpu 28</span>, cut context to 2k. See the OOM fixer on the homepage.</p>
          </div>
          <div className="border border-line bg-surface p-3">
            <div className="text-xs font-medium text-fg">Q4 or Q8 on this rig?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">Start {pick?.quant.name ?? "Q4"}. Bigger model at Q4 beats smaller at Q8. Only go Q8 if 2GB+ headroom remains.</p>
          </div>
          <div className="border border-line bg-surface p-3">
            <div className="text-xs font-medium text-fg">How fast will it be?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{pick ? `About ${pick.speed} when 100% on GPU. Any CPU offload drops speed 5–20× — check ollama ps.` : "Slower than GPU — this combo needs offload. Pick a smaller model for interactive chat."}</p>
          </div>
          <div className="border border-line bg-surface p-3">
            <div className="text-xs font-medium text-fg">Is {model.license} commercial-safe?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{["Apache-2.0","MIT","BSD"].includes(model.license) ? `Yes — ${model.license} allows commercial use.` : `${model.license} — check terms before commercial use. Filter commercial-safe on the bench.`}</p>
          </div>
        </div>
      </div>

      {sameRigOthers.length ? (
        <div className="mt-6 border border-line bg-surface p-4">
          <div className="text-2xs uppercase tracking-widest text-dim">also fits {preset.label}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sameRigOthers.map(p => (
              <Link key={p.model.id} to={`/can/${p.model.id}-on-${preset.id}`} className="border border-line bg-bg px-2 py-1 text-xs hover:border-fg">{p.model.name} · {p.quant.name}</Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 border border-line bg-surface p-4">
        <div className="text-2xs uppercase tracking-widest text-dim">{model.name} on other rigs</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {sameModelRigs.map(p => (
            <Link key={p.id} to={`/can/${model.id}-on-${p.id}`} className="border border-line bg-bg px-2 py-1 text-xs hover:border-fg">{p.label}</Link>
          ))}
        </div>
      </div>

      <div className="mt-6 text-xs">
        <Link to="/" className="underline">Check your own rig in 15 seconds →</Link>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": `Can ${model.name} run on ${preset.label}?`, "acceptedAnswer": { "@type": "Answer", "text": desc } },
          { "@type": "Question", "name": `What if ${model.name} runs out of memory on ${preset.label}?`, "acceptedAnswer": { "@type": "Answer", "text": "Unload idle models, cap GPU layers with --num-gpu, and cut context to 2048. KV cache grows with context and is the usual OOM cause." } },
          { "@type": "Question", "name": `Should I use Q4 or Q8 for ${model.name}?`, "acceptedAnswer": { "@type": "Answer", "text": "Start Q4_K_M. Bigger model at Q4 beats smaller at Q8. Use Q8 only with 2GB+ headroom." } }
        ]
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myllmstack.vercel.app/" },
          { "@type": "ListItem", "position": 2, "name": model.name, "item": "https://myllmstack.vercel.app/models" },
          { "@type": "ListItem", "position": 3, "name": `${model.name} on ${preset.label}` }
        ]
      })}} />
    </SiteShell>
  );
}
