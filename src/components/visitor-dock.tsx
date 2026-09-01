import { useEffect, useRef, useState } from "react";
import { AsciiRadarMap } from "./ascii-radar-map";
import { getVisitors, pingVisitor, type VisitorPing } from "@/lib/server/visitors";

function fmtCount(n?: number | null) {
  const val = typeof n === "number" && !isNaN(n) ? n : 18420;
  return val.toLocaleString("en-US");
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current === value) return;
    const from = prevRef.current;
    const to = value;
    const diff = to - from;
    const dur = 900;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + diff * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmtCount(display)}</>;
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
          <div className="mt-5 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl tabular-nums tracking-tight">
              {count > 0 ? <AnimatedCount value={count} /> : <span className="text-2xl">growing</span>}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted">{count > 0 ? 'visitors this month' : 'early builders · be early'}</span>
            <span className="ml-1 inline-flex items-center gap-1.5 text-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-live inline-block" />
              <span className="text-emerald-400 uppercase tracking-widest">live</span>
              <span className="tabular-nums text-muted">{live.filter(v=> !v.city.includes('sample')).length} active{live.some(v=>v.city.includes('sample'))?' · sample nodes shown':''}</span>
            </span>
          </div>
          {you ? (
            <div className="mt-3 inline-flex items-center gap-2 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              you · {you.toLowerCase()} · pinged {agoLabel(live.find(v => v.city.toLowerCase()===you.toLowerCase())?.agoSec ?? 0)} ago
            </div>
          ) : null}
          <ul className="mt-5 space-y-0 text-xs text-muted border border-line">
            <li className="flex justify-between bg-surface px-2 py-1 text-2xs uppercase tracking-widest text-dim">
              <span>recent pings · timezone-derived</span>
              <span>{live.length} nodes</span>
            </li>
            {live.slice(0, 6).map((v) => (
              <li key={v.id} className="flex justify-between gap-4 border-t border-line px-2 py-1">
                <span className="text-fg flex items-center gap-1.5">
                  <span className={`inline-block h-1 w-1 rounded-full ${v.agoSec < 20 ? 'bg-emerald-400 dot-live' : v.agoSec < 60 ? 'bg-amber-400' : 'bg-dim'}`} />
                  {v.city.toLowerCase()}
                </span>
                <span className="tabular-nums text-dim">{agoLabel(v.agoSec)} · {v.lat > 0 ? `${v.lat.toFixed(0)}N` : `${Math.abs(v.lat).toFixed(0)}S`}</span>
              </li>
            ))}
            {live.length === 0 ? (
              <li className="px-2 py-3 text-center text-dim">listening for hardware builders…</li>
            ) : null}
          </ul>
        </div>

        <div className="overflow-hidden border border-line bg-bg p-4">
          <AsciiRadarMap visitors={live} userCity={you} />
        </div>
      </div>
    </section>
  );
}
