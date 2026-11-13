import { useEffect, useMemo, useRef, useState } from "react";
import type { VisitorPing } from "@/lib/server/visitors";

type Props = {
  visitors: VisitorPing[];
  userCity?: string | null;
};

const BASE_WORLD_ASCII = [
  "┌────────────────────────────────────────────────────────────────┐",
  "│  -180°        -90°               0°              +90°   +180°  │",
  "│    __..---..__     .---.             _..----.._           _.._ │",
  "│  .'  · NA ·   '.  /  ·  \\          .'  · EU ·  '.       .'·AP │",
  "│ /   *US/CA* ·   \\|  GL   |·       /  *UK/DE/FR*  \\     / *JP/CN│",
  "│|   [W-COAST] ·  || · · · | ·     |   [CENTRAL] ·  |   |  *IN/KR│",
  "│ \\   [E-COAST]·  / \\  ·  / ·       \\   [MEDIT] ·  /     \\ *SG/AU│",
  "│  '. ·  ·  ·  .'   '---'           '. ·  ·  ·  .'       '.  ·  │",
  "│    '-·_____·-'      · ·             '-·____·-'           '--· │",
  "│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  │",
  "│        _.._                              _.._    · · ·  _.._   │",
  "│      .' ·  '.                          .' ·  '.        .' · '. │",
  "│     /  LATAM \\                        / AFRICA \\     /  ANZ   \\│",
  "│    | *BR/MX/AR|·                     | *ZA/KE/NG|   | *AU/NZ* |│",
  "│     \\  · ·   /                        \\  · ·  /   |  · ·  |    │",
  "│      '. ·  .'                          '. ·  .'     \\  · · /   │",
  "│        '..'                              '..'        '.____.'  │",
  "│ [LAT -60°] · · · · · · · · · · · · · · · · · · · · · [LAT +60°]│",
  "│   ACTIVE REGIONAL NODES · TIMEZONE-DERIVED PRESENCE MESH       │",
  "└────────────────────────────────────────────────────────────────┘",
];

function projectToGrid(lat: number, lng: number, cols = 64, rows = 18) {
  const clampedLat = Math.max(-60, Math.min(75, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  const xRatio = (clampedLng + 180) / 360;
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

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) return;

    const interval = window.setInterval(() => {
      setScanCol((c) => (c >= 62 ? 2 : c + 1));
      setPulseTick((t) => (t + 1) % 4);
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  const renderedMap = useMemo(() => {
    const lines = BASE_WORLD_ASCII.map((l) => l.split(""));
    const cols = 64;
    const rows = BASE_WORLD_ASCII.length;

    if (scanCol > 2 && scanCol < cols - 2) {
      for (let r = 2; r < rows - 3; r++) {
        const curChar = lines[r]?.[scanCol];
        if (curChar === " ") {
          lines[r]![scanCol] = "|";
        }
      }
    }

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setMode("map")}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "map" ? "bg-elevated text-fg" : "text-muted hover:text-fg"
            }`}
          >
            World Map
          </button>
          <button
            type="button"
            onClick={() => setMode("matrix")}
            className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "matrix" ? "bg-elevated text-fg" : "text-muted hover:text-fg"
            }`}
          >
            Regional Breakdown
          </button>
        </div>

        <span className="text-xs font-mono tabular-nums text-dim">
          {visitors.length} nodes
        </span>
      </div>

      {mode === "map" ? (
        <div>
          <pre
            aria-hidden="true"
            className="overflow-x-auto whitespace-pre font-mono text-[9.5px] leading-[1.16] text-muted sm:text-[10.5px]"
          >
            {renderedMap}
          </pre>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-dim">
            <div className="flex flex-wrap items-center gap-3">
              <span>[@] You</span>
              <span>[!] Recent</span>
              <span>[+] Active</span>
            </div>
            <span>Sweep active</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-xs text-muted">
          <div className="rounded-lg border border-line bg-surface p-3 space-y-2">
            <div className="border-b border-line pb-1.5 text-xs font-medium text-fg">
              Regional Distribution
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="w-28 text-fg">AMER</span>
                <span className="text-primary">{regionalMetrics.americas.bar}</span>
                <span className="w-10 text-right tabular-nums">{regionalMetrics.americas.pct}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="w-28 text-fg">EMEA</span>
                <span className="text-primary">{regionalMetrics.emea.bar}</span>
                <span className="w-10 text-right tabular-nums">{regionalMetrics.emea.pct}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="w-28 text-fg">APAC</span>
                <span className="text-primary">{regionalMetrics.apac.bar}</span>
                <span className="w-10 text-right tabular-nums">{regionalMetrics.apac.pct}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-3 space-y-1.5 text-xs">
            <div className="border-b border-line pb-1.5 flex justify-between text-fg font-medium">
              <span>Recent Regions</span>
              <span className="text-dim font-normal">Stateless</span>
            </div>
            <div className="space-y-1 pt-0.5">
              {visitors.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-dim">
                  <span className="text-fg truncate pr-2">
                    {v.city} ({v.lat > 0 ? `${v.lat.toFixed(1)}N` : `${Math.abs(v.lat).toFixed(1)}S`},{" "}
                    {v.lng > 0 ? `${v.lng.toFixed(1)}E` : `${Math.abs(v.lng).toFixed(1)}W`})
                  </span>
                  <span className="tabular-nums text-success shrink-0">{v.agoSec}s ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
