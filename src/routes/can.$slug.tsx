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

  return (
    <SiteShell>
      <div className="text-2xs uppercase tracking-[0.28em] text-muted">can i run · seo</div>
      <h1 className="mt-3 text-2xl sm:text-3xl leading-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{desc}</p>
      <p className="mt-2 text-xs text-dim">{model.summary}</p>

      {pick ? (
        <div className="mt-6 border border-line bg-surface p-4">
          <div className="text-2xs uppercase tracking-widest text-dim">best fit on this rig</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="border border-fg bg-fg px-2 py-1 text-xs text-bg">{pick.quant.name} · {pick.quant.vramGb}GB</span>
            <span className="border border-line px-2 py-1 text-xs text-muted">{pick.fit === 'gpu' ? 'fits GPU' : pick.fit}</span>
            <span className="border border-line px-2 py-1 text-xs text-muted">{pick.speed}</span>
          </div>
          <div className="mt-3 text-xs font-mono break-all bg-bg border border-line px-3 py-2">{model.run.ollama || model.run.llamacpp || model.hf}</div>
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
        <div className="text-2xs uppercase tracking-widest text-dim">faq</div>
        <h2 className="mt-2 text-sm font-medium">Can {model.name} run on {preset.label}?</h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">{desc} Model context {model.contextK}k. Compare with <Link to="/models" className="underline">all models</Link> or re-check with your exact specs on <Link to="/" className="underline">the bench</Link>.</p>
      </div>

      <div className="mt-6 text-xs">
        <Link to="/" className="underline">Check your own rig →</Link>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{ "@type": "Question", "name": `Can ${model.name} run on ${preset.label}?`, "acceptedAnswer": { "@type": "Answer", "text": desc } }]
      })}} />
    </SiteShell>
  );
}
