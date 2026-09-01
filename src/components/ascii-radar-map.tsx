import { useEffect, useMemo, useRef, useState } from "react";
import type { VisitorPing } from "@/lib/server/visitors";

type Props = {
  visitors: VisitorPing[];
  userCity?: string | null;
};

// Enhanced ASCII world — denser coastlines, graticule, bathymetry
const BASE_WORLD_ASCII = [
  "┌────────────────────────────────────────────────────────────────┐",
  "│· -180° · · · · -90° · · · · · ·  0° · · · · · · +90° · · +180° ·│",
  "│    __..---..__     .---.             _..----.._           _.._ │",
  "│  .'  · NA ·   '.  /  ·  \\          .'  · EU ·  '.       .'·AP │",
  "│ /   *US/CA* ·   \\|  GL   |·       /  *UK/DE/FR*  \\     / *JP/CN│",
  "│|   [W-COAST] ·  || · · · | ·     |   [CENTRAL] ·  |   |  *IN/KR│",
  "│ \\   [E-COAST]·  / \\  ·  / ·       \\   [MEDIT] ·  /     \\ *SG/AU│",
  "│  '. ·  ·  ·  .'   '---'           '. ·  ·  ·  .'       '.  ·  │",
  "│    '-·_____·-'      · ·             '-·____·-'           '--· │",
  "│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  │",
  "│        _.._                              _.._    · · ·  _.._    │",
  "│      .' ·  '.                          .' ·  '.        .' · '.  │",
  "│     /  LATAM \\                        / AFRICA \\     /  ANZ   \\ │",
  "│    | *BR/MX/AR|·                     | *ZA/KE/NG|   | *AU/NZ* | │",
  "│     \\  · ·   /                        \\  · ·  /   |  · ·  | │",
  "│      '. ·  .'                          '. ·  .'     \\  · · / │",
  "│        '..'                              '..'        '.____.'  │",
  "│[LAT -60°] · · · · · · · · · · · · · · · · · · · · · ·[LAT +60°]│",
  "│ >> ACTIVE NODE RADAR · TELEMETRY MESH // SYNCED VIA TIMEZONE << │",
  "└────────────────────────────────────────────────────────────────┘",
];

// Project lat (-60 to +75) and lng (-180 to +180) onto a 64x20 grid
function projectToGrid(lat: number, lng: number, cols = 64, rows = 18) {
  // Clamped coordinates
  const clampedLat = Math.max(-60, Math.min(75, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  // Mercator-like normalized mapping
  const xRatio = (clampedLng + 180) / 360;
  // Lat: +75 is top (row 2), -60 is bottom (row 16)
  const yRatio = (75 - clampedLat) / 135;

  const col = Math.round(3 + xRatio * (cols - 8));
  const row = Math.round(2 + yRatio * (rows - 5));

  return {
    col: Math.max(1, Math.min(cols - 2, col)),
    row: Math.max(2, Math.min(rows - 3, row)),
  };
}

export function AsciiRadarMap({ visitors, userCity }: Props) {
  const [mode, setMode] = useState<"map" | "matrix">("map");
  const [scanCol, setScanCol] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const reduce = useRef(false);

  // Animated sweep line & blink pulse
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) return;

    const interval = window.setInterval(() => {
      setScanCol((c) => (c >= 62 ? 2 : c + 1));
      setPulseTick((t) => (t + 1) % 4);
    }, 110);

    return () => window.clearInterval(interval);
  }, []);

  // Compute rendered ASCII frame
  const renderedMap = useMemo(() => {
    const lines = BASE_WORLD_ASCII.map((l) => l.split(""));
    const cols = 64;
    const rows = BASE_WORLD_ASCII.length;

    // 1. Draw radar sweep beam
    if (scanCol > 2 && scanCol < cols - 2) {
      for (let r = 2; r < rows - 3; r++) {
        const curChar = lines[r]?.[scanCol];
        if (curChar === " ") {
          lines[r]![scanCol] = "|";
        }
      }
    }

    // 2. Plot visitor nodes
    visitors.forEach((v, idx) => {
      const pos = projectToGrid(v.lat, v.lng, cols, rows);
      const isRecent = v.agoSec < 20;
      const isUser = userCity && v.city.toLowerCase() === userCity.toLowerCase();

      let nodeChar = "*";
      if (isUser) {
        nodeChar = pulseTick % 2 === 0 ? "@" : "O";
      } else if (isRecent) {
        nodeChar = pulseTick % 2 === 0 ? "!" : "#";
      } else if (idx % 2 === 0) {
        nodeChar = "+";
      }

      if (lines[pos.row] && lines[pos.row]![pos.col] !== undefined) {
        lines[pos.row]![pos.col] = nodeChar;
      }
    });

    return lines.map((l) => l.join("")).join("\n");
  }, [visitors, scanCol, pulseTick, userCity]);

  // Compute regional metrics for the Cluster Matrix view
  const regionalMetrics = useMemo(() => {
    let americas = 0;
    let emea = 0;
    let apac = 0;

    visitors.forEach((v) => {
      if (v.lng < -30) americas++;
      else if (v.lng >= -30 && v.lng <= 55) emea++;
      else apac++;
    });

    const total = Math.max(1, visitors.length);
    const pAmer = Math.round((americas / total) * 100);
    const pEmea = Math.round((emea / total) * 100);
    const pApac = Math.round((apac / total) * 100);

    const makeBar = (pct: number, width = 16) => {
      const filled = Math.round((pct / 100) * width);
      return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
    };

    return {
      americas: { count: americas, pct: pAmer, bar: makeBar(pAmer) },
      emea: { count: emea, pct: pEmea, bar: makeBar(pEmea) },
      apac: { count: apac, pct: pApac, bar: makeBar(pApac) },
    };
  }, [visitors]);

  return (
    <div className="space-y-3">
      {/* Visualizer Mode Tabs */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("map")}
            className={`border px-2 py-0.5 text-2xs uppercase tracking-wider transition-colors ${
              mode === "map" ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"
            }`}
          >
            [1] 🗺️ ASCII World Radar
          </button>
          <button
            type="button"
            onClick={() => setMode("matrix")}
            className={`border px-2 py-0.5 text-2xs uppercase tracking-wider transition-colors ${
              mode === "matrix" ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"
            }`}
          >
            [2] ⚡ Node Cluster Matrix
          </button>
        </div>

        <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-dim">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span>Live Mesh</span>
        </div>
      </div>

      {mode === "map" ? (
        <div>
          <pre
            aria-hidden="true"
            className="overflow-x-auto whitespace-pre font-mono text-[9.5px] leading-[1.12] text-fg sm:text-[10.5px]"
          >
            {renderedMap}
          </pre>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-dim">
            <div className="flex items-center gap-3">
              <span>[@] You</span>
              <span>[!] New (&lt;20s)</span>
              <span>[+] Active Node</span>
              <span>[│] Radar Sweep</span>
            </div>
            <span>Nodes: {visitors.length}</span>
          </div>
        </div>
      ) : (
        <div className="font-mono text-xs text-muted space-y-3 py-1">
          <div className="border border-line bg-surface/50 p-3 space-y-2">
            <div className="text-2xs uppercase tracking-widest text-fg border-b border-line/60 pb-1">
              Regional Traffic Distribution
            </div>
            <div className="space-y-1.5 text-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="w-24 text-fg font-medium">AMER (US/LATAM)</span>
                <span className="font-mono text-fg">{regionalMetrics.americas.bar}</span>
                <span className="w-12 text-right tabular-nums">{regionalMetrics.americas.pct}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="w-24 text-fg font-medium">EMEA (EU/AFRICA)</span>
                <span className="font-mono text-fg">{regionalMetrics.emea.bar}</span>
                <span className="w-12 text-right tabular-nums">{regionalMetrics.emea.pct}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="w-24 text-fg font-medium">APAC (ASIA/ANZ)</span>
                <span className="font-mono text-fg">{regionalMetrics.apac.bar}</span>
                <span className="w-12 text-right tabular-nums">{regionalMetrics.apac.pct}%</span>
              </div>
            </div>
          </div>

          <div className="border border-line bg-bg p-3 space-y-1 text-2xs">
            <div className="text-2xs uppercase tracking-widest text-fg border-b border-line/60 pb-1 flex justify-between">
              <span>Live Ingress Stream</span>
              <span>Protocol: TLS 1.3 / P2P</span>
            </div>
            <div className="space-y-1 pt-1">
              {visitors.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-dim">
                  <span className="text-fg font-mono">
                    [{v.city.toUpperCase()}] ({v.lat > 0 ? `${v.lat.toFixed(1)}N` : `${Math.abs(v.lat).toFixed(1)}S`},{" "}
                    {v.lng > 0 ? `${v.lng.toFixed(1)}E` : `${Math.abs(v.lng).toFixed(1)}W`})
                  </span>
                  <span className="tabular-nums text-emerald-400">● {v.agoSec}s ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
