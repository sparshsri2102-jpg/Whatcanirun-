import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { requestSponsor } from "@/lib/server/sponsors";

export const Route = createFileRoute("/sponsor")({ component: SponsorPage });

function SponsorPage() {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
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
        data: { company, website, tagline, slot },
      });
      if (!res.ok) setError(res.error);
      else setDone(true);
    } catch {
      setError("Could not send that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <p className="text-2xs uppercase tracking-[0.28em] text-muted">companies only</p>
      <h1 className="mt-3 text-2xl sm:text-3xl">put your name on the tape</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Visitors never sign up. The top and bottom bars are for companies. Name, site, one line. We
        review, then you scroll by forever — or until you don’t.
      </p>

      {done ? (
        <div className="mt-10 border border-line p-6">
          <div className="text-sm">request in.</div>
          <p className="mt-2 text-sm text-muted">
            We’ll use the website as the contact. No password, no dashboard. If the slot is a fit, your
            name starts moving.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 max-w-lg space-y-4">
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">company</span>
            <input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">website</span>
            <input
              required
              type="url"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">tagline · 120 chars</span>
            <input
              required
              maxLength={120}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-2xs uppercase tracking-widest text-muted">slot</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="mt-1 min-h-12 w-full border border-line bg-surface px-3 text-sm focus:border-fg focus:outline-none"
            >
              <option value="both">top + bottom</option>
              <option value="top">top only</option>
              <option value="bottom">bottom only</option>
            </select>
          </label>
          {error ? <p className="text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 bg-fg px-5 text-sm uppercase tracking-widest text-bg disabled:opacity-50"
          >
            {busy ? "sending…" : "request sponsor"}
          </button>
        </form>
      )}
    </SiteShell>
  );
}
