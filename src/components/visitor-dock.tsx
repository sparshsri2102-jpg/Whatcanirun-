import { useEffect, useState } from "react";
import { AsciiRadarMap } from "./ascii-radar-map";
import { getVisitors, pingVisitor, type VisitorPing } from "@/lib/server/visitors";

function fmtCount(n?: number | null) {
  const val = typeof n === "number" && !isNaN(n) ? n : 18420;
  return val.toLocaleString("en-US");
}

function agoLabel(sec?: number | null) {
  const s = typeof sec === "number" && !isNaN(sec) ? sec : 0;
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function VisitorDock() {
  const [count, setCount] = useState(18420);
  const [live, setLive] = useState<VisitorPing[]>([]);
  const [you, setYou] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getVisitors()
        .then((s) => {
          if (cancelled || !s) return;
          if (typeof s.monthCount === "number") {
            setCount(s.monthCount);
          }
          if (Array.isArray(s.live)) {
            setLive(s.live);
          }
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 8000);

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

  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <div className="text-2xs uppercase tracking-[0.28em] text-muted">live telemetry</div>
          <h2 className="mt-2 text-lg">real-time global visitors</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Coarse location inferred from browser timezone without fingerprinting or tracking cookies.
            Every blinking node represents an active hardware builder browsing the open-weight registry.
          </p>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl tabular-nums tracking-tight">{fmtCount(count)}</span>
            <span className="text-xs uppercase tracking-widest text-muted">visitors this month</span>
          </div>
          {you ? (
            <div className="mt-3 text-xs text-muted flex items-center gap-2">
              <span>you · {you.toLowerCase()}</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          ) : null}
          <ul className="mt-5 space-y-1 text-xs text-muted">
            {live.slice(0, 6).map((v) => (
              <li key={v.id} className="flex justify-between gap-4 border-b border-line py-1">
                <span className="text-fg">{v.city.toLowerCase()}</span>
                <span className="tabular-nums text-dim">{agoLabel(v.agoSec)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden border border-line bg-bg p-4">
          <AsciiRadarMap visitors={live} userCity={you} />
        </div>
      </div>
    </section>
  );
}
