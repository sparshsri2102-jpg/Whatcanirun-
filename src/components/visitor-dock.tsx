import { useEffect, useState } from "react";
import { AsciiRadarMap } from "./ascii-radar-map";
import { getVisitors, pingVisitor, type VisitorPing } from "@/lib/server/visitors";

function agoLabel(sec?: number | null) {
  const s = typeof sec === "number" && !isNaN(sec) ? sec : 0;
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function VisitorDock() {
  const [live, setLive] = useState<VisitorPing[]>([]);
  const [you, setYou] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getVisitors()
        .then((s) => {
          if (cancelled || !s) return;
          if (Array.isArray(s.live)) {
            setLive(s.live);
          }
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 15000);

    const key = "cir-pinged";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      pingVisitor({ data: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone } })
        .then((r) => {
          if (!cancelled && r.ok) setYou(r.city);
          load();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const activeCount = live.filter((v) => !v.city.includes("sample")).length;

  return (
    <section className="border-t border-line bg-surface/60">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:px-8">
        <div>
          <div className="text-xs font-medium text-primary">Global Hardware Builders</div>
          <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-fg">
            Live Open-Weight Sizing Network
          </h2>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted">
            Timezone-derived regional presence with zero cookies or device fingerprinting.
            {you ? (
              <span className="ml-1 text-fg">
                Your session region: <span className="font-mono text-xs">{you}</span>.
              </span>
            ) : null}
          </p>

          <div className="mt-5 flex items-center gap-6 border-y border-line py-3 text-xs">
            <div>
              <div className="text-dim">Active Regions</div>
              <div className="mt-0.5 font-mono text-base font-medium tabular-nums text-fg">
                {activeCount > 0 ? activeCount : live.length}
              </div>
            </div>
            <div className="h-7 w-px bg-line" />
            <div>
              <div className="text-dim">Catalog Coverage</div>
              <div className="mt-0.5 font-mono text-base font-medium tabular-nums text-fg">
                49 Models
              </div>
            </div>
            <div className="h-7 w-px bg-line" />
            <div>
              <div className="text-dim">Telemetry</div>
              <div className="mt-0.5 font-mono text-base font-medium text-fg">
                Stateless
              </div>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-bg text-xs">
            {live.slice(0, 4).map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <span className="text-fg truncate">{v.city}</span>
                <span className="font-mono tabular-nums text-dim shrink-0">
                  {agoLabel(v.agoSec)} · {v.lat > 0 ? `${v.lat.toFixed(0)}N` : `${Math.abs(v.lat).toFixed(0)}S`}
                </span>
              </li>
            ))}
            {live.length === 0 ? (
              <li className="px-3 py-3 text-center text-dim">Connecting to builder network…</li>
            ) : null}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-bg p-4">
          <AsciiRadarMap visitors={live} userCity={you} />
        </div>
      </div>
    </section>
  );
}
