import { useEffect, useState } from "react";
import { AsciiGlobe } from "./ascii-globe";
import { getVisitors, pingVisitor, type VisitorPing } from "@/lib/server/visitors";

function fmtCount(n: number) {
  return n.toLocaleString("en-US");
}

function agoLabel(sec: number) {
  if (sec < 5) return "now";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
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
          if (cancelled) return;
          setCount(s.monthCount);
          setLive(s.live);
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
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="text-2xs uppercase tracking-[0.28em] text-muted">live map</div>
          <h2 className="mt-2 text-lg">visitors this month</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Coarse city from timezone only. No accounts, no IPs, no names. Dots are people who opened the
            page.
          </p>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl tabular-nums tracking-tight">{fmtCount(count)}</span>
            <span className="text-xs uppercase tracking-widest text-muted">this month</span>
          </div>
          {you ? (
            <div className="mt-3 text-xs text-muted">
              you · {you.toLowerCase()} <span className="dot-live">@</span>
            </div>
          ) : null}
          <ul className="mt-5 space-y-1 text-xs text-muted">
            {live.slice(0, 6).map((v) => (
              <li key={v.id} className="flex justify-between gap-4 border-b border-line py-1">
                <span className="text-fg">{v.city.toLowerCase()}</span>
                <span className="tabular-nums">{agoLabel(v.agoSec)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-x-auto border border-line bg-bg p-3">
          <AsciiGlobe visitors={live} />
        </div>
      </div>
    </section>
  );
}
