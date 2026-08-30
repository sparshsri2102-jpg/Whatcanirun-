import { useEffect, useMemo, useRef, useState } from "react";
import type { VisitorPing } from "@/lib/server/visitors";

type Props = {
  visitors: VisitorPing[];
  width?: number;
  height?: number;
};

function project(
  lat: number,
  lng: number,
  rot: number,
  cx: number,
  cy: number,
  r: number,
) {
  const phi = (lat * Math.PI) / 180;
  const lam = (lng * Math.PI) / 180 + rot;
  const x = Math.cos(phi) * Math.sin(lam);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lam);
  if (z < 0) return null;
  return {
    col: Math.round(cx + x * r * 2.05),
    row: Math.round(cy - y * r),
    z,
  };
}

function renderGlobe(rot: number, visitors: VisitorPing[], cols: number, rows: number) {
  const grid: string[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const r = Math.min(cols / 4.3, rows / 2.15) - 0.4;

  const set = (c: number, row: number, ch: string, pri: number, prio: number[]) => {
    if (row < 0 || row >= rows || c < 0 || c >= cols) return;
    if (pri >= (prio[row * cols + c] ?? 0)) {
      grid[row]![c] = ch;
      prio[row * cols + c] = pri;
    }
  };
  const prio = new Array(rows * cols).fill(0);

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const nx = (c - cx) / (r * 2.05);
      const ny = (cy - row) / r;
      const d = nx * nx + ny * ny;
      if (d > 1.02) continue;
      if (d > 0.96) {
        set(c, row, d > 1 ? "." : ":", 1, prio);
        continue;
      }
      const z = Math.sqrt(Math.max(0, 1 - d));
      const x = nx;
      const y = ny;
      const lam = Math.atan2(x, z) - rot;
      const phi = Math.asin(Math.max(-1, Math.min(1, y)));
      const lat = (phi * 180) / Math.PI;
      const lon = (((lam * 180) / Math.PI + 540) % 360) - 180;
      const land =
        Math.abs(Math.sin(phi * 3 + lon / 40)) * 0.45 +
          Math.abs(Math.cos(lon / 18 + phi * 2)) * 0.35 >
        0.42;
      const meridian = Math.abs(((lon + 180) % 30) - 0) < 1.2;
      const parallel = Math.abs(lat % 30) < 1.4;
      let ch = ".";
      if (land) ch = ":";
      if (meridian || parallel) ch = land ? "+" : ",";
      set(c, row, ch, 1, prio);
    }
  }

  for (const v of visitors) {
    const p = project(v.lat, v.lng, rot, cx, cy, r);
    if (!p) continue;
    const ch = v.agoSec < 8 ? "@" : v.agoSec < 40 ? "*" : "+";
    set(p.col, p.row, ch, 5, prio);
  }

  return grid.map((row) => row.join("")).join("\n");
}

export function AsciiGlobe({ visitors, width = 52, height = 24 }: Props) {
  const [rot, setRot] = useState(0.4);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setRot((r) => r + dt * 0.00022);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const frame = useMemo(
    () => renderGlobe(rot, visitors, width, height),
    [rot, visitors, width, height],
  );

  return (
    <pre
      aria-hidden="true"
      className="overflow-hidden whitespace-pre font-mono text-[10px] leading-[1.05] text-fg sm:text-[11px]"
    >
      {frame}
    </pre>
  );
}
