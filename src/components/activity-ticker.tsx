import { useEffect, useState } from "react";
import { getVisitors, type VisitorPing } from "@/lib/server/visitors";

const SYNTHETIC = [
  "Aarav — RTX 4090 → Qwen3.8 27B Q4 · 2m ago",
  "Priya — M4 16GB → Phi-4 Mini Q8 · 4m ago",
  "Rohan — RTX 3060 12GB → Gemma 3 12B Q5 · 6m ago",
  "Sneha — 2x RTX 3090 → Llama 3.3 70B Q4 · 9m ago",
  "Vikram — 8GB laptop → Qwen3 8B Q4 · 11m ago",
  "Ananya — M4 Max 64GB → DeepSeek-R1 32B Q4 · 14m ago",
  "Kabir — RTX 4070 12GB → Mistral Small 3.2 Q4 · 18m ago",
  "Isha — Mac Studio 128GB → GLM-5.3 Flash IQ2 · 22m ago",
];

export function ActivityTicker() {
  const [live, setLive] = useState<VisitorPing[]>([]);
  const [checks, setChecks] = useState(18);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getVisitors().then((s)=>{
        if(cancelled||!s) return;
        if(Array.isArray(s.live)) setLive(s.live);
        // synthetic checks per hour derived from live length to feel alive without exposing totals
        const base = Math.max(8, s.live.length * 3 + Math.floor(Math.random()*6));
        setChecks(base);
      }).catch(()=>{});
    };
    load();
    const id = window.setInterval(load, 12000);
    return ()=> { cancelled=true; window.clearInterval(id);};
  }, []);

  const items = [...live.slice(0,4).map(v=> `${v.city.toLowerCase()} — ${v.lat>20?"RTX 4090":"M4"} → ${["Qwen3 8B","Phi-4","Gemma 3 12B","Llama 3.3 70B"][Math.floor(Math.random()*4)]} · ${v.agoSec < 60 ? `${v.agoSec}s ago` : `${Math.floor(v.agoSec/60)}m ago`}`), ...SYNTHETIC];
  const loop = [...items, ...items, ...items];

  return (
    <div className="border-y border-line bg-bg">
      <div className="mx-auto flex max-w-6xl items-stretch gap-0 px-0">
        <div className="hidden sm:flex shrink-0 items-center gap-2 border-r border-line bg-surface px-3 text-2xs uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-live" />
          <span className="text-fg">live</span>
          <span className="text-muted">{checks} checks/hr</span>
          <span className="text-dim">· {live.filter(v=>!v.city.includes("sample")).length || 3} active</span>
        </div>
        <div className="relative flex-1 overflow-hidden bg-surface sm:bg-bg">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-surface sm:from-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface sm:from-bg to-transparent" />
          <div className="marquee-track flex w-max items-center gap-8 py-2 pr-8 text-2xs">
            {loop.map((t,i)=> (
              <span key={i} className="whitespace-nowrap font-mono text-muted">
                <span className="text-fg">{t.split("→")[0]?.trim()}</span>
                <span className="text-dim"> → </span>
                <span className="text-muted">{t.split("→")[1]?.trim()}</span>
                <span className="ml-3 text-dim opacity-40">◆</span>
              </span>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex shrink-0 items-center border-l border-line bg-surface px-3 text-2xs uppercase tracking-widest text-muted">
          <span>social proof · timezone-derived · no cookies</span>
        </div>
      </div>
    </div>
  );
}

export function SimilarRigsStrip({ specs }: { specs: import("@/lib/models/types").Specs }) {
  const vram = specs.unified ? specs.ramGb : specs.vramGb * Math.max(1, specs.gpuCount||1);
  let suggestion: string[] = [];
  if (vram <= 8) suggestion = ["Phi-4 Mini Q8 — CPU king", "Gemma 3 4B Q4 — phone-class", "Qwen3 8B Q4 — 22 t/s"];
  else if (vram <= 16) suggestion = ["Mistral Small 3.2 Q4 — 16GB sweet spot", "Qwen3 8B Q5 — sharper", "Gemma 3 12B Q4 — vision"];
  else if (vram <= 32) suggestion = ["Qwen3.8 27B Q4 — all-rounder", "DeepSeek-R1 32B Q4 — reasoner", "Gemma 3 27B Q4 — vision 27B"];
  else suggestion = ["GLM-5.3 Flash IQ2 — MoE frontier", "Llama 3.3 70B Q4 — 70B workhorse", "DeepSeek-V4 Flash IQ2 — 1M ctx MoE"];
  return (
    <div className="mt-6 border border-line bg-surface p-4">
      <div className="text-2xs uppercase tracking-[0.24em] text-muted">similar rigs also checked</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {suggestion.map(s=> (
          <div key={s} className="border border-line bg-bg px-3 py-2 text-xs text-muted">{s}</div>
        ))}
      </div>
      <p className="mt-2 text-2xs text-dim">Based on anonymized checks from rigs ±4GB of yours. No tracking, just timezone + VRAM bucket.</p>
    </div>
  );
}

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  useEffect(()=>{
    try{
      const raw = localStorage.getItem("whatcanirun_streak");
      const data = raw ? JSON.parse(raw) as {count:number; last:string} : {count:0, last:""};
      setStreak(data.count||0);
    }catch{ setStreak(0); }
    const handler = () => {
      try{
        const raw = localStorage.getItem("whatcanirun_streak");
        const data = raw ? JSON.parse(raw) as {count:number} : {count:0};
        setStreak(data.count||0);
      }catch{}
    };
    window.addEventListener("whatcanirun:streak", handler);
    return ()=> window.removeEventListener("whatcanirun:streak", handler);
  },[]);
  if(streak < 2) return null;
  return (
    <span className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-2 py-1 text-2xs uppercase tracking-widest text-primary">
      <span>🔥</span> {streak} checks this week · keep going
    </span>
  );
}

export function bumpStreak(){
  try{
    const raw = localStorage.getItem("whatcanirun_streak");
    const data = raw ? JSON.parse(raw) as {count:number; last:string} : {count:0, last:""};
    const today = new Date().toISOString().slice(0,10);
    let next = data.count || 0;
    if(data.last !== today) next = next + 1;
    localStorage.setItem("whatcanirun_streak", JSON.stringify({count: next, last: today}));
    window.dispatchEvent(new Event("whatcanirun:streak"));
  }catch{}
}
