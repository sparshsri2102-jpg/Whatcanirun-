import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { requestSponsor } from "@/lib/server/sponsors";

export const Route = createFileRoute("/sponsor")({ component: SponsorPage });

export function SponsorPage() {
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
      setError("Could not submit sponsorship request. Please verify inputs and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <p className="text-2xs uppercase tracking-[0.28em] text-muted">companies & projects only</p>
      <h1 className="mt-3 text-2xl sm:text-3xl">put your logo and name on the tape</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Visitors never sign up. The top and bottom ticker bars showcase hardware makers, model labs, and local inference tools.
        Submit your brand name, icon logo, site URL, and a punchy 1-line hook.
      </p>

      {done ? (
        <div className="mt-10 border border-line bg-surface p-6">
          <div className="text-sm font-medium">✓ Request received.</div>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            We will review your company, logo, and website link. Once approved, your badge and tagline
            will begin streaming across the live ticker.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 max-w-xl space-y-5">
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">company name *</span>
            <input
              required
              placeholder="e.g. OLLAMA, VRAMHAUS, SILICON ATTIC"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">company logo url (svg or png)</span>
            <input
              type="url"
              placeholder="https://example.com/logo.svg or icon URL"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
            <span className="mt-1 block text-2xs text-dim">
              Provide a direct image/SVG URL. If left empty, your company&apos;s initial monogram will be displayed.
            </span>
          </label>

          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">website link *</span>
            <input
              required
              type="url"
              placeholder="https://yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-widest text-muted">tagline / pitch *</span>
              <span className="text-2xs tabular-nums text-dim">{120 - tagline.length} left</span>
            </div>
            <input
              required
              maxLength={120}
              placeholder="e.g. Run open-weight models at full throttle without cloud bills."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">ticker slot placement</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            >
              <option value="both">Top + Bottom Bars (Full Exposure)</option>
              <option value="top">Top Bar Only</option>
              <option value="bottom">Bottom Bar Only</option>
            </select>
          </label>

          {/* Live Preview of Sponsor Banner */}
          <div className="mt-6 border border-line bg-surface/50 p-4">
            <span className="text-2xs uppercase tracking-widest text-dim block mb-2">Live Ticker Preview:</span>
            <div className="flex items-center gap-2 border border-line bg-bg px-3 py-2 text-2xs uppercase tracking-wider text-muted">
              {logo ? (
                <img
                  src={logo}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="inline-block h-4 w-4 object-contain grayscale"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="inline-flex h-4 w-4 items-center justify-center border border-line bg-surface text-[9px] font-mono font-bold text-fg">
                  {company ? company.charAt(0).toUpperCase() : "?"}
                </span>
              )}
              <span className="font-medium text-fg">{company || "YOUR COMPANY"}</span>
              <span className="text-dim">·</span>
              <span className="normal-case text-muted tracking-normal">
                {tagline || "Your one-line tagline will scroll here."}
              </span>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 bg-fg px-6 text-sm uppercase tracking-widest text-bg transition-opacity disabled:opacity-50 hover:opacity-90"
          >
            {busy ? "submitting…" : "submit sponsorship request"}
          </button>
        </form>
      )}
    </SiteShell>
  );
}
