import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { MODELS, PRESETS } from "@/lib/models/catalog";
import { calcKvCacheGb, getMemoryPools, matchModels } from "@/lib/models/match";
import type { Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/can/$slug")({ component: CanPage });

function parseSlug(slug: string): { modelId: string | null; presetId: string | null } {
  const parts = slug.toLowerCase().split("-on-");
  if (parts.length !== 2) return { modelId: null, presetId: null };
  const modelSlug = parts[0];
  const rigSlug = parts[1];
  const model = MODELS.find((m) => m.id === modelSlug || m.id.replaceAll(".", "-") === modelSlug);
  const preset = PRESETS.find((p) => p.id === rigSlug || rigSlug.startsWith(p.id));
  return { modelId: model?.id ?? null, presetId: preset?.id ?? null };
}

function CanPage() {
  const { slug } = Route.useParams();
  const { modelId, presetId } = parseSlug(slug);
  const model = modelId ? MODELS.find((m) => m.id === modelId) ?? null : null;
  const preset = presetId ? PRESETS.find((p) => p.id === presetId) ?? null : null;

  if (!model || !preset) {
    return (
      <SiteShell>
        <div className="rounded-xl border border-line bg-surface p-8">
          <h1 className="font-display text-2xl font-semibold text-fg">Configuration Not Found</h1>
          <p className="mt-3 text-sm text-muted">
            Browse the{" "}
            <Link to="/models" className="text-primary hover:underline">
              model catalog
            </Link>{" "}
            or evaluate your exact specs on{" "}
            <Link to="/" className="text-primary hover:underline">
              the sizing bench
            </Link>
            .
          </p>
          <p className="mt-5 font-mono text-xs text-dim">Example URL: /can/qwen3-14b-on-rtx-5080</p>
        </div>
      </SiteShell>
    );
  }

  const specs: Specs = { ...preset.specs, source: "preset", raw: preset.label };
  const pools = getMemoryPools(specs);
  const res = matchModels(specs, undefined, 8, "fp16");
  const pick = res.picks.find((p) => p.model.id === model.id) ?? res.also.find((p) => p.model.id === model.id);
  const can = !!pick;
  const title = can
    ? `Yes — ${model.name} runs on ${preset.label}`
    : `No — ${model.name} exceeds ${preset.label} at Q4`;
  const desc = pick
    ? `${model.name} (${model.params}) requires ${pick.quant.vramGb} GB weights at ${pick.quant.name} plus ${pick.kvCacheGb ?? 0.5} GB KV cache on your ${preset.specs.unified ? `${preset.specs.ramGb} GB unified` : `${pools.totalVram} GB VRAM`} rig. Estimated ${pick.speed}.`
    : `${model.name} needs ${model.quants[0]?.vramGb} GB+ and exceeds ${preset.label}. Try a smaller quant or model.`;
  const capacity = preset.specs.unified
    ? preset.specs.ramGb
    : preset.specs.vramGb * Math.max(1, preset.specs.gpuCount || 1);
  const sameRigOthers = res.picks.filter((p) => p.model.id !== model.id).slice(0, 4);
  const sameModelRigs = PRESETS.filter((p) => p.id !== preset.id).slice(0, 6);
  const kv8 = calcKvCacheGb(model, 8, "fp16");

  return (
    <SiteShell>
      <div className="border-b border-line pb-6">
        <div className="text-xs font-medium text-primary">Hardware Compatibility Report</div>
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
          {title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">{desc}</p>
        <p className="mt-2 text-xs text-dim">{model.summary}</p>
      </div>

      {pick ? (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-fg">
              Optimal Fit · Weights + 8k KV Cache + Headroom
            </span>
            <span className="font-mono text-muted">
              {pick.quant.name} · {pick.quant.vramGb} GB weights · +{(pick.kvCacheGb ?? 0.5)} GB KV ·{" "}
              <span className={pick.fit === "gpu" ? "text-success" : "text-primary"}>
                {pick.fit === "gpu" ? "100% GPU" : pick.fit}
              </span>{" "}
              · {pick.speed}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-bg">
            <table className="w-full text-left font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-line text-dim">
                  <th className="px-3.5 py-2 font-medium">Quant</th>
                  <th className="px-3.5 py-2 font-medium text-right">Weights</th>
                  <th className="px-3.5 py-2 font-medium text-right">+ 8k KV</th>
                  <th className="px-3.5 py-2 font-medium text-right">Fits {capacity} GB Rig?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {model.quants.map((q) => {
                  const need = Math.round((q.vramGb + kv8) * 10) / 10;
                  const fitsGpu = need <= pools.gpu;
                  const fitsHybrid = !fitsGpu && need <= pools.hybrid;
                  return (
                    <tr key={q.name}>
                      <td className="px-3.5 py-2 font-semibold text-fg">{q.name}</td>
                      <td className="px-3.5 py-2 text-right text-muted">{q.vramGb} GB</td>
                      <td className="px-3.5 py-2 text-right text-muted">~{need} GB</td>
                      <td
                        className={cn(
                          "px-3.5 py-2 text-right font-medium",
                          fitsGpu ? "text-success" : fitsHybrid ? "text-primary" : "text-dim",
                        )}
                      >
                        {fitsGpu ? "Fits GPU" : fitsHybrid ? "Hybrid Offload" : "Exceeds"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-dim">
            File size does not equal runtime memory. KV cache grows with context — enable Q8_0 KV cache quantization or drop context to 4k/2k if long chats OOM.
          </p>

          <div className="mt-3 rounded-lg border border-line bg-bg px-3.5 py-2.5 font-mono text-xs text-fg break-all">
            {model.run.ollama || model.run.llamacpp || model.hf}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <a
              href={model.hf}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Hugging Face Repo
            </a>
            {model.gguf ? (
              <a
                href={model.gguf}
                target="_blank"
                rel="noreferrer"
                className="text-muted hover:text-fg hover:underline"
              >
                GGUF Download
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-medium text-fg">
            Models that fit {preset.label}:
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {res.picks.slice(0, 4).map((p) => (
              <Link
                key={p.model.id}
                to="/can/$slug"
                params={{ slug: `${p.model.id}-on-${preset.id}` }}
                className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-fg hover:border-primary"
              >
                {p.model.name} · {p.quant.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-line pt-8">
        <div className="text-xs font-medium text-primary">Technical FAQ</div>
        <h2 className="mt-1 font-display text-lg font-semibold text-fg">
          Can {model.name} run on {preset.label}?
        </h2>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          {desc} Max context {model.contextK}k. Compare against{" "}
          <Link to="/models" className="text-primary hover:underline">
            all models
          </Link>{" "}
          or test custom RAM/GPU specs on{" "}
          <Link to="/" className="text-primary hover:underline">
            the sizing bench
          </Link>
          .
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-fg">What if it hits OOM?</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Unload idle weights with <span className="font-mono text-fg">ollama stop</span>, enable <span className="font-mono text-fg">Q8_0</span> KV cache quantization, or cut context to 4k/2k.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-fg">Q4 or Q8 on this rig?</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Start with {pick?.quant.name ?? "Q4"}. Larger parameter models at Q4 consistently outperform smaller models at Q8.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-fg">How fast will inference run?</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {pick
                ? `Around ${pick.speed} when 100% resident on GPU. CPU layer offload cuts throughput 5–20x.`
                : "Requires system RAM offload. Select a smaller model for interactive decode speeds."}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs font-semibold text-fg">Is {model.license} commercial-safe?</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {["Apache-2.0", "MIT", "BSD"].includes(model.license)
                ? `Yes — ${model.license} permits unrestricted commercial deployment.`
                : `${model.license} — review the license terms before commercial deployment.`}
            </p>
          </div>
        </div>
      </div>

      {sameRigOthers.length ? (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <div className="text-xs font-medium text-muted">Also runs well on {preset.label}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sameRigOthers.map((p) => (
              <Link
                key={p.model.id}
                to="/can/$slug"
                params={{ slug: `${p.model.id}-on-${preset.id}` }}
                className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-fg hover:border-primary"
              >
                {p.model.name} · {p.quant.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <div className="text-xs font-medium text-muted">{model.name} on other reference hardware</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sameModelRigs.map((p) => (
            <Link
              key={p.id}
              to="/can/$slug"
              params={{ slug: `${model.id}-on-${p.id}` }}
              className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-fg hover:border-primary"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 text-xs">
        <Link to="/" className="font-medium text-primary hover:underline">
          Check your own rig in 15 seconds →
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `Can ${model.name} run on ${preset.label}?`,
                acceptedAnswer: { "@type": "Answer", text: desc },
              },
              {
                "@type": "Question",
                name: `What if ${model.name} runs out of memory on ${preset.label}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Unload idle models, enable Q8_0 KV cache quantization, and cut context to 2048. KV cache grows with context and is the usual OOM cause.",
                },
              },
              {
                "@type": "Question",
                name: `Should I use Q4 or Q8 for ${model.name}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Start Q4_K_M. Bigger model at Q4 beats smaller at Q8. Use Q8 only with 2GB+ headroom.",
                },
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://myllmstack.vercel.app/" },
              { "@type": "ListItem", position: 2, name: model.name, item: "https://myllmstack.vercel.app/models" },
              { "@type": "ListItem", position: 3, name: `${model.name} on ${preset.label}` },
            ],
          }),
        }}
      />
    </SiteShell>
  );
}
