import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { requestSponsor } from "@/lib/server/sponsors";

export const Route = createFileRoute("/sponsor")({ component: SponsorPage });

function SponsorPage() {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
  const [logo, setLogo] = useState("");
  const [slot, setSlot] = useState("both");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await requestSponsor({
        data: { company, website, tagline, logo: logo.trim() || undefined, slot },
      });
      if (!res.ok) setError(res.error);
      else setDone(true);
    } catch {
      setError("Could not submit sponsorship request. Verify inputs and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="border-b border-line pb-6">
        <div className="text-xs font-medium text-primary">Ecosystem Partners</div>
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
          Feature your hardware, model lab, or inference stack
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Reach engineers sizing local hardware for open-weight inference. Submit your organization details, icon URL, and a concise technical hook.
        </p>
      </div>

      {done ? (
        <div className="mt-8 max-w-xl rounded-xl border border-success/40 bg-surface p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>Partner Request Received</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We will review your organization, logo asset, and link before enabling your placement in the partner showcase.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-5 rounded-xl border border-line bg-surface p-6">
          <label className="block">
            <span className="text-xs font-medium text-fg">Company or Project Name *</span>
            <input
              required
              placeholder="e.g. Ollama, Unsloth, LM Studio"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-bg px-3.5 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-fg">Logo URL (SVG or PNG)</span>
            <input
              type="url"
              placeholder="https://example.com/logo.svg"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-bg px-3.5 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
            <span className="mt-1 block text-xs text-dim">
              Optional direct icon URL. Leave empty to generate an initial monogram.
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-fg">Website URL *</span>
            <input
              required
              type="url"
              placeholder="https://yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-bg px-3.5 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fg">Technical Tagline *</span>
              <span className="font-mono text-xs tabular-nums text-dim">{120 - tagline.length} left</span>
            </div>
            <input
              required
              maxLength={120}
              placeholder="e.g. Run open-weight models at full throttle without cloud bills."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-bg px-3.5 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-fg">Placement Tier</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-bg px-3.5 text-sm text-fg focus:border-primary focus:outline-none"
            >
              <option value="both">Workbench + Catalog Placement</option>
              <option value="top">Workbench Header Only</option>
              <option value="bottom">Catalog Directory Only</option>
            </select>
          </label>

          <div className="rounded-lg border border-line bg-bg p-4">
            <span className="block text-xs font-medium text-dim mb-2">Live Partner Card Preview</span>
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-xs">
              {logo ? (
                <img
                  src={logo}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-line-strong bg-elevated font-mono text-xs font-semibold text-primary">
                  {company ? company.charAt(0).toUpperCase() : "W"}
                </span>
              )}
              <span className="font-semibold text-fg">{company || "Your Organization"}</span>
              <span className="text-dim" aria-hidden="true">·</span>
              <span className="text-muted truncate">
                {tagline || "Your concise technical tagline appears here."}
              </span>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit Partner Request"}
          </button>
        </form>
      )}
    </SiteShell>
  );
}
