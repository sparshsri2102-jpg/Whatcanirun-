import { useEffect, useRef, useState, useMemo } from "react";
import type { MatchResult, Model, ModelFit, QuantOption, RunnerType, Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";
import { SimilarRigsStrip } from "./activity-ticker";
import { VramBar, QuantGlossary, MethodologyNote } from "./vram-math";

function siteUrl() {
  try {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  } catch { /* ssr */ }
  return "https://myllmstack.vercel.app";
}

function FitBadge({ fit }: { fit: ModelFit["fit"] }) {
  const label = fit === "gpu" ? "fits GPU" : fit === "hybrid" ? "offload" : fit === "cpu" ? "CPU" : "exceeds";
  return (
    <span
      className={cn(
        "border px-2 py-0.5 text-2xs uppercase tracking-widest",
        fit === "gpu" ? "border-fg text-fg" : "border-line text-muted",
      )}
    >
      {label}
    </span>
  );
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-2xs uppercase tracking-widest text-muted underline underline-offset-4 hover:text-fg"
      onClick={async () => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(cmd);
          } else {
            const ta = document.createElement("textarea");
            ta.value = cmd;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          try {
            const ta = document.createElement("textarea");
            ta.value = cmd;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setDone(true);
            window.setTimeout(() => setDone(false), 1400);
          } catch {
            /* ignore */
          }
        }
      }}
    >
      {done ? "copied" : "copy"}
    </button>
  );
}

function generateRunCmd(
  runner: RunnerType,
  fit: ModelFit,
  selectedQuant: string,
  contextK: number = 8,
  specs?: Specs,
): string {
  const m = fit.model;
  const qLower = selectedQuant.toLowerCase();
  const gpuCount = specs?.gpuCount && specs.gpuCount > 1 ? specs.gpuCount : 1;

  switch (runner) {
    case "ollama": {
      const baseOllama = m.run.ollama ? m.run.ollama : `hf.co/${m.hf}`;
      let tag = "";
      if (qLower.includes("q8") || qLower === "q8") tag = ":q8_0";
      else if (qLower.includes("q5")) tag = ":q5_k_m";
      else if (qLower.includes("q4") || qLower === "q4") tag = m.run.ollama ? "" : ":q4_k_m";
      else tag = `:${qLower}`;

      if (gpuCount > 1 && !specs?.unified) {
        const devList = Array.from({ length: gpuCount }, (_, i) => i).join(",");
        return `CUDA_VISIBLE_DEVICES=${devList} ollama run ${baseOllama}${tag}`;
      }
      return `ollama run ${baseOllama}${tag}`;
    }
    case "lmstudio": {
      if (gpuCount > 1) {
        return `lms load ${m.hf} --gpu=max --tensor-split ${Array(gpuCount).fill(1).join(",")} -c ${contextK * 1024}`;
      }
      return `lms load ${m.hf} --gpu=max -c ${contextK * 1024}`;
    }
    case "llamacpp": {
      if (gpuCount > 1) {
        return `./llama-cli -hf ${m.hf} -ngl 99 -sm row -c ${contextK * 1024}`;
      }
      if (m.run.llamacpp) return m.run.llamacpp;
      return `./llama-cli -hf ${m.hf} -ngl 99 -c ${contextK * 1024}`;
    }
    case "vllm": {
      if (gpuCount > 1) {
        return `vllm serve ${m.hf} --tensor-parallel-size ${gpuCount} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.92`;
      }
      return `vllm serve ${m.hf} --max-model-len ${contextK * 1024} --gpu-memory-utilization 0.90`;
    }
    case "jan": {
      return `jan run ${m.id} --quant ${selectedQuant}`;
    }
    default:
      return m.run.ollama || m.run.llamacpp || "";
  }
}

function QuantAdvisor({ model, quants, vramGb }: { model: Model; quants: QuantOption[]; vramGb: number }) {
  const gpuOpts = quants.filter((q) => q.fit === "gpu");
  const hybridOpts = quants.filter((q) => q.fit === "hybrid");
  const best = gpuOpts.length ? gpuOpts[0] : hybridOpts[0];
  if (!best) return null;
  const q4 = quants.find((q) => q.quant.name === "Q4");
  const q8 = quants.find((q) => q.quant.name === "Q8");
  const qualityDrop = q4 && q8 ? Math.round((1 - q4.quant.quality / q8.quant.quality) * 100) : 0;
  const recommended = best.quant.name;
  return (
    <div className="mt-3 border border-primary/30 bg-primary/5 p-3 text-center">
      <div className="text-2xs uppercase tracking-widest text-primary">recommended quant for your rig</div>
      <div className="mt-1 text-sm font-semibold text-fg">{recommended}</div>
      <p className="mt-1 text-2xs text-muted leading-relaxed">
        {recommended === "Q4"
          ? `Fits your ${vramGb}GB with headroom. Only ~${qualityDrop}% quality drop vs Q8 — best speed/quality balance.`
          : recommended === "Q8"
            ? `Near-lossless quality on your ${vramGb}GB. Maximum speed you can get.`
            : `Best fit available on your hardware. ${best.headroomGb > 0 ? `+${best.headroomGb}GB headroom.` : "Tight fit."}`}
      </p>
    </div>
  );
}

function SavingsVsApi({ result }: { result: MatchResult }) {
  const [tokensPerDay, setTokensPerDay] = useState(120_000);
  const pricePerM = 5; // blended $5 / 1M vs GPT-4o class
  const monthlyTokens = tokensPerDay * 30;
  const monthlyCostApi = (monthlyTokens / 1_000_000) * pricePerM;
  const yearly = monthlyCostApi * 12;
  return (
    <div className="mt-6 border border-emerald-900/30 bg-emerald-950/15 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-2xs uppercase tracking-[0.24em] text-emerald-400">value prop · save vs cloud</div>
        <span className="border border-emerald-900/40 bg-emerald-950/30 px-2 py-1 font-mono text-2xs text-emerald-300">local = $0 after hardware</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-sm text-fg">At <span className="font-mono font-semibold">{(tokensPerDay/1000).toFixed(0)}k</span> tokens/day, you save <span className="font-semibold text-emerald-400">${monthlyCostApi.toFixed(0)}/mo</span> vs API · <span className="text-muted">${yearly.toFixed(0)}/yr</span></div>
          <p className="mt-1 text-xs leading-relaxed text-muted">Assumes GPT-4o-class pricing (~${pricePerM}/1M blended). Local inference is private, offline, and uncapped after the rig.</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xs uppercase tracking-widest text-dim">tokens/day</span>
            <input type="range" min={20_000} max={500_000} step={10_000} value={tokensPerDay} onChange={e=> setTokensPerDay(Number(e.target.value))} className="flex-1 accent-emerald-500" />
            <span className="font-mono text-xs text-fg w-[72px] text-right">{(tokensPerDay/1000).toFixed(0)}k</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-line bg-bg p-2">
            <div className="text-2xs uppercase tracking-widest text-dim">vs API/mo</div>
            <div className="mt-1 font-mono text-sm font-semibold text-emerald-400">${monthlyCostApi.toFixed(0)}</div>
          </div>
          <div className="border border-line bg-bg p-2">
            <div className="text-2xs uppercase tracking-widest text-dim">vs API/yr</div>
            <div className="mt-1 font-mono text-sm font-semibold text-fg">${yearly.toFixed(0)}</div>
          </div>
          <div className="border border-line bg-bg p-2">
            <div className="text-2xs uppercase tracking-widest text-dim">privacy</div>
            <div className="mt-1 text-2xs font-semibold uppercase tracking-widest text-fg">100% local</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpgradePath({ result }: { result: MatchResult }) {
  const top = result.picks[0];
  if (!top || top.fit === "gpu") return null;
  const upgradeVram = top.quant.vramGb;
  const need = Math.max(0, upgradeVram - result.specs.vramGb);
  const price = 320; // avg used 24GB
  const savingPerMo = 42; // at 120k/day
  const payback = (price / savingPerMo).toFixed(1);
  return (
    <div className="mt-8 border border-warning/30 bg-warning/5 p-6 sm:p-8">
      <div className="text-2xs uppercase tracking-widest text-warning">upgrade path · value math</div>
      <h3 className="mt-2 text-xl font-semibold text-fg">
        Add ~{need}GB VRAM to run {top.model.name}
      </h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        {top.model.name} wants {top.quant.vramGb}GB ({top.quant.name}). Your rig has {result.specs.vramGb}GB.
        A used RTX 3090 24GB (~${price}) would unlock this model — pays for itself in <span className="font-semibold text-fg">{payback} months</span> vs API at 120k tokens/day (~${savingPerMo}/mo saved).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">RTX 3090 24GB · ~$300 used · {payback}mo payback</span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">RTX 4070 12GB · ~$400</span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">M4 Pro 24GB · ~$600</span>
      </div>
    </div>
  );
}

const COMMUNITY_TIER: Record<string, Array<{ model: string; reason: string }>> = {
  "8 GB laptop": [
    { model: "Qwen3 8B", reason: "r/LocalLLaMA daily driver for 8GB — 84 quality, 22 t/s Q4" },
    { model: "Phi-4 Mini", reason: "Community CPU pick — runs anywhere, 74 quality" },
    { model: "Gemma 3 4B", reason: "Top mobile pick — 76 quality, tiny footprint" },
  ],
  "RTX 3060 12GB": [
    { model: "Mistral Small 3.2", reason: "16GB members' go-to coding model — 87 quality" },
    { model: "Qwen3 8B", reason: "Fastest 8B — 84 quality at 30 t/s" },
    { model: "Gemma 3 12B", reason: "Multimodal king at 12GB — 86 quality" },
  ],
  "RTX 4090 24GB": [
    { model: "Qwen3.8 27B", reason: "24GB sweet spot — 93 quality, vision+coding" },
    { model: "DeepSeek-R1 32B", reason: "Reasoning champion — 89 quality at Q4" },
    { model: "Devstral Small", reason: "Agentic coding — 89 quality, 256k ctx" },
  ],
};

function CommunityConsensus({ specs }: { specs: Specs }) {
  const tier = COMMUNITY_TIER[`${specs.gpu} ${specs.vramGb}GB`]
    ?? COMMUNITY_TIER[`${specs.gpu}`]
    ?? COMMUNITY_TIER["8 GB laptop"];
  return (
    <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="text-2xs uppercase tracking-widest text-muted">community consensus</span>
        <span className="text-2xs text-dim">r/LocalLLaMA · 266K members</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-fg">what r/LocalLLaMA runs on your hardware</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tier.map((c, i) => (
          <div key={c.model} className="border border-line bg-bg p-4">
            <div className="text-2xs uppercase tracking-widest text-primary">#{i + 1}</div>
            <div className="mt-1 text-sm font-semibold text-fg">{c.model}</div>
            <p className="mt-2 text-xs text-muted leading-relaxed">{c.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionLoop({ result }: { result: MatchResult }) {
  const [unlocked, setUnlocked] = useState(false);
  const [certCopied, setCertCopied] = useState<string | null>(null);
  const certRef = useRef<HTMLCanvasElement | null>(null);
  const s = result.specs;
  const top = result.picks[0];
  const shareUrl = useMemo(()=> {
    const p=new URLSearchParams({gpu:s.gpu, vram:String(s.vramGb), ram:String(s.ramGb), cpu:s.cpu, os:s.os, unified:s.unified?"1":"0", gpus:String(s.gpuCount||1), ctx:String(result.contextK??8)});
    return `${siteUrl()}/share?${p.toString()}`;
  },[s, result.contextK]);
  const tweet = top ? `My ${s.gpu} runs ${top.model.name} at ${top.tokPerSec||top.speed} (${top.quant.name}) — check your rig: ${shareUrl}` : `Check what your rig can run: ${shareUrl}`;

  useEffect(()=>{
    try{ if(localStorage.getItem("whatcanirun_shared")==="1") setUnlocked(true);}catch{}
  },[]);
  const markShared = () => {
    try{ localStorage.setItem("whatcanirun_shared","1"); }catch{}
    setUnlocked(true);
  };
  useEffect(()=>{
    const c=certRef.current; if(!c||!top) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    const W=900, H=520; c.width=W; c.height=H;
    ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#CC8800"; ctx.lineWidth=4; ctx.strokeRect(20,20,W-40,H-40);
    ctx.fillStyle="#111111"; ctx.fillRect(24,24,W-48,H-48);
    // subtle grid
    ctx.strokeStyle="#1e1e1e"; ctx.lineWidth=1;
    for(let x=24;x<W;x+=32){ ctx.beginPath(); ctx.moveTo(x,24); ctx.lineTo(x,H-24); ctx.stroke(); }
    // header
    ctx.fillStyle="#CC8800"; ctx.font="bold 11px JetBrains Mono"; ctx.fillText("CERTIFICATE OF COMPATIBILITY  ·  WHAT CAN I RUN?  ·  VERIFIED LOCAL INFERENCE", 48, 68);
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(48,84); ctx.lineTo(W-48,84); ctx.stroke();
    // title
    ctx.fillStyle="#f0f0f0"; ctx.font="bold 30px Chakra Petch"; ctx.fillText("CERTIFIED  —  IT RUNS",48,132);
    ctx.fillStyle="#16A34A"; ctx.font="bold 22px Chakra Petch"; ctx.fillText(`✓  ${top.model.name}`, 380,132);
    // rig
    const rig = s.unified ? `${s.ramGb}GB Unified · ${s.gpu}` : `${s.gpuCount>1?`${s.gpuCount}x `:''}${s.gpu} · ${s.vramGb * Math.max(1,s.gpuCount||1)}GB VRAM`;
    ctx.fillStyle="#8c8c8c"; ctx.font="13px JetBrains Mono"; ctx.fillText(rig,48,164);
    ctx.fillStyle="#f0f0f0"; ctx.font="13px JetBrains Mono"; ctx.fillText(`${s.ramGb}GB RAM · ${s.os} · ${s.cpu} · ${result.contextK??8}k ctx`,48,186);
    // divider
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(48,212); ctx.lineTo(W-48,212); ctx.stroke();
    // metrics
    ctx.fillStyle="#CC8800"; ctx.font="bold 11px JetBrains Mono"; ctx.fillText("METRICS",48,238);
    const metrics = [
      ["MODEL", top.model.name],
      ["QUANT", `${top.quant.name} · ${top.quant.vramGb}GB`],
      ["SPEED", `${top.tokPerSec||top.speed} · ${top.fit.toUpperCase()}`],
      ["QUALITY", `${top.model.quality}/100 · ${top.model.license}`],
    ];
    let y=266;
    metrics.forEach(([k,v])=>{
      ctx.fillStyle="#5c5c5c"; ctx.font="11px JetBrains Mono"; ctx.fillText(k,48,y);
      ctx.fillStyle="#f0f0f0"; ctx.font="13px JetBrains Mono"; ctx.fillText(v,180,y);
      y+=26;
    });
    // stamp
    ctx.save();
    ctx.translate(W-190, 150);
    ctx.rotate(-0.18);
    ctx.strokeStyle="#16A34A"; ctx.lineWidth=3;
    ctx.strokeRect(-86,-42,172,84);
    ctx.fillStyle="#16A34A"; ctx.font="bold 18px Chakra Petch"; ctx.textAlign="center"; ctx.fillText("VERIFIED",0,-8);
    ctx.font="11px JetBrains Mono"; ctx.fillText(`${top.quant.name}  ·  LOCAL`,0,18);
    ctx.restore();
    ctx.textAlign="start";
    // footer
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(48,H-78); ctx.lineTo(W-48,H-78); ctx.stroke();
    ctx.fillStyle="#5c5c5c"; ctx.font="11px JetBrains Mono"; ctx.fillText("whatcanirun.dev  ·  private · offline · no cloud bill  ·  share this certificate",48,H-48);
    ctx.fillStyle="#CC8800"; ctx.font="bold 12px JetBrains Mono"; ctx.fillText("OPEN WEIGHTS × HARDWARE",W-230,H-48);
  },[s, top, result.contextK]);

  const copy = async (text:string, key:string)=>{
    try{ await navigator.clipboard.writeText(text);}catch{
      const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCertCopied(key); setTimeout(()=> setCertCopied(null),1600);
  };
  const downloadCert = ()=>{
    const c=certRef.current; if(!c) return;
    const a=document.createElement("a"); a.download=`whatcanirun-certificate-${s.gpu.replace(/\s+/g,"_")}.png`; a.href=c.toDataURL("image/png"); a.click(); setCertCopied("dl"); setTimeout(()=> setCertCopied(null),1600); markShared();
  };
  const copyCertImage = async ()=>{
    const c=certRef.current; if(!c) return;
    try{
      const blob: Blob|null = await new Promise(res=> c.toBlob(r=>res(r)));
      if(!blob) throw new Error("no blob");
      // @ts-ignore
      const item=new window.ClipboardItem({"image/png":blob});
      // @ts-ignore
      await navigator.clipboard.write([item]);
      setCertCopied("img"); setTimeout(()=> setCertCopied(null),1600); markShared();
    }catch{ downloadCert(); }
  };

  if(!top) return null;
  return (
    <div className="mt-10 border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xs uppercase tracking-[0.28em] text-primary">frictionless share · distribution loop</div>
          <h3 className="mt-1 text-lg font-medium">found this useful? share your rig — unlock early drops</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">Every share brings another builder. Share now and you’ll be first to hear about new GGUFs that fit your rig.</p>
        </div>
        {unlocked ? <span className="border border-emerald-900/40 bg-emerald-950/20 px-3 py-1 text-2xs uppercase tracking-widest text-emerald-300">✓ early access unlocked</span> : <span className="border border-line bg-bg px-3 py-1 text-2xs uppercase tracking-widest text-muted">share to unlock</span>}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="overflow-hidden border border-line bg-black p-2">
          <canvas ref={certRef} className="h-auto w-full" style={{aspectRatio:"900/520"}} aria-label="Compatibility certificate" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" onClick={markShared} className="min-h-11 inline-flex items-center justify-center bg-fg px-3 text-2xs uppercase tracking-widest text-bg hover:opacity-90">↗ share on X</a>
            <a href={`https://www.reddit.com/r/LocalLLaMA/submit?title=${encodeURIComponent(`My ${s.gpu} runs ${top.model.name} — ${top.model.summary.split(".")[0]}`)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" onClick={markShared} className="min-h-11 inline-flex items-center justify-center border border-orange-600/40 bg-orange-950/20 px-3 text-2xs uppercase tracking-widest text-orange-300 hover:bg-orange-900/30">↗ reddit</a>
            <button type="button" onClick={()=> { copy(shareUrl,"url"); markShared(); }} className="min-h-11 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{certCopied==="url"?"✓ link copied":"copy link"}</button>
            <button type="button" onClick={()=> { copy(tweet+" "+shareUrl,"txt"); markShared(); }} className="min-h-11 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{certCopied==="txt"?"✓ copied":"copy tweet"}</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copyCertImage} className="min-h-11 border border-fg bg-fg px-3 text-2xs uppercase tracking-widest text-bg hover:opacity-90">{certCopied==="img"?"✓ image copied":"copy certificate"}</button>
            <button type="button" onClick={downloadCert} className="min-h-11 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{certCopied==="dl"?"✓ downloaded":"download png"}</button>
          </div>
          <p className="text-2xs leading-relaxed text-dim">No signup. Sharing stores a local flag only — we’ll prioritize watchers who shared for early GGUF alerts. No spam.</p>
          {unlocked ? <div className="border border-emerald-900/30 bg-emerald-950/10 px-3 py-2 text-xs text-emerald-300">You’re on the early list. New GGUFs ≤ your VRAM will ping you first.</div> : null}
        </div>
      </div>
    </div>
  );
}

function BenchmarkCompare({ result }: { result: MatchResult }) {
  const top3 = result.picks.slice(0, 3);
  if (top3.length < 2) return null;
  return (
    <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
      <div className="text-2xs uppercase tracking-widest text-muted">feature: benchmark compare</div>
      <h3 className="mt-2 text-xl font-semibold text-fg">top 3 side-by-side on your rig</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted text-2xs uppercase tracking-widest">
              <th className="pb-3 text-fg">metric</th>
              {top3.map((p) => (
                <th key={p.model.id} className="px-4 pb-3 text-right text-fg">
                  {p.model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">quality</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.model.quality}/100</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">speed (tok/s)</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.tokPerSec ?? p.speed ?? "—"}</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">VRAM (quant)</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right tabular-nums text-fg">{p.quant.vramGb} GB ({p.quant.name})</td>
              ))}
            </tr>
            <tr className="border-b border-line/50">
              <td className="py-3 text-dim">license</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right text-fg">{p.model.license}</td>
              ))}
            </tr>
            <tr>
              <td className="py-3 text-dim">fit</td>
              {top3.map((p) => (
                <td key={p.model.id} className="px-4 py-3 text-right">
                  <span className={cn("border px-2 py-0.5 text-2xs uppercase tracking-widest", p.fit === "gpu" ? "border-fg text-fg" : "border-line text-muted")}>
                    {p.fit}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PickCard({ fit, rank, contextK, specs }: { fit: ModelFit; rank: number; contextK: number; specs: Specs }) {
  const m = fit.model;
  const [selectedQuantName, setSelectedQuantName] = useState<string>(fit.quant.name);
  const [runner, setRunner] = useState<RunnerType>("ollama");

  const activeOption: QuantOption | undefined = fit.quantOptions?.find(
    (o) => o.quant.name === selectedQuantName
  );

  const currentQuant = activeOption ? activeOption.quant : fit.quant;
  const currentFit = activeOption ? activeOption.fit : fit.fit;
  const currentSpeed = activeOption?.tokPerSec || activeOption?.speed || fit.tokPerSec || fit.speed;
  const currentHeadroom = activeOption ? activeOption.headroomGb : fit.headroomGb;

  const weightsGb = currentQuant.vramGb;
  const kvCacheGb = fit.kvCacheGb ?? 0.5;
  const totalMem = Math.round((weightsGb + kvCacheGb) * 10) / 10;
  const cmd = generateRunCmd(runner, fit, currentQuant.name, contextK, specs);

  return (
    <article className="border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-2xs tabular-nums text-muted">
            {String(rank).padStart(2, "0")} · {m.org}
          </div>
          <h3 className="mt-1 text-lg">{m.name}</h3>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <FitBadge fit={currentFit} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{m.summary}</p>

       {/* Feature 3: Quant Advisor */}
       <QuantAdvisor model={m} quants={fit.quantOptions ?? []} vramGb={specs.vramGb || specs.ramGb} />

       {/* Interactive Quantization Matrix */}
       {fit.quantOptions && fit.quantOptions.length > 1 ? (
        <div className="mt-4 border-t border-b border-line py-3">
          <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-dim">
            <span>select quantization format:</span>
            <span>{currentQuant.name} selected</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fit.quantOptions.map((opt) => {
              const isSelected = opt.quant.name === currentQuant.name;
              const isGpu = opt.fit === "gpu";
              const noFit = opt.fit === "no";
              return (
                <button
                  key={opt.quant.name}
                  type="button"
                  disabled={noFit}
                  title={noFit ? `needs ~${opt.totalNeededGb} GB — exceeds this rig` : undefined}
                  onClick={() => setSelectedQuantName(opt.quant.name)}
                  className={cn(
                    "px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors",
                    isSelected
                      ? "border-fg bg-fg text-bg"
                      : noFit
                        ? "border-line/40 bg-transparent text-dim/60 cursor-not-allowed line-through"
                        : isGpu
                          ? "border-line bg-bg text-fg hover:border-fg"
                          : "border-line/60 bg-transparent text-dim hover:text-muted"
                  )}
                >
                  {opt.quant.name} · {opt.quant.vramGb} GB
                  <span className="ml-1 opacity-70">
                    (
                    {opt.fit === "gpu"
                      ? "GPU"
                      : opt.fit === "hybrid"
                        ? "offload"
                        : opt.fit === "cpu"
                          ? "CPU"
                          : "no fit"}
                    )
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-dim">memory needed</dt>
          <dd className="mt-0.5 tabular-nums">
            {totalMem} GB <span className="text-dim">({weightsGb} + {kvCacheGb}k KV)</span>
          </dd>
        </div>
        <div>
          <dt className="text-dim">params</dt>
          <dd className="mt-0.5">{m.params}</dd>
        </div>
        <div>
          <dt className="text-dim">headroom</dt>
          <dd className="mt-0.5 tabular-nums">
            {currentHeadroom > 0 ? `+${currentHeadroom} GB` : `${currentHeadroom} GB`}
          </dd>
        </div>
        <div>
          <dt className="text-dim">est. speed / bandwidth</dt>
          <dd className="mt-0.5 font-mono text-fg">{currentSpeed}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted">
        {fit.why}
      </p>

      <VramBar fit={fit} capacityGb={specs.unified ? specs.ramGb * 0.72 : Math.max(1, specs.vramGb * Math.max(1, specs.gpuCount || 1))} />

      {/* Multi-Engine Runner Switcher */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-dim mb-1.5">
          <span>run command ({runner}){specs.gpuCount > 1 ? ` · ${specs.gpuCount}x GPU Stacking` : ""}:</span>
          <div className="flex gap-2">
            {(["ollama", "lmstudio", "llamacpp", "vllm"] as RunnerType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunner(r)}
                className={cn(
                  "hover:text-fg uppercase",
                  runner === r ? "text-fg underline underline-offset-2" : "text-dim"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 border border-line bg-bg px-3 py-2">
          <code className="break-all text-xs font-mono">{cmd}</code>
          <CopyCmd cmd={cmd} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <a href={m.hf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
          huggingface
        </a>
        {m.gguf ? (
          <a href={m.gguf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            GGUF download
          </a>
        ) : null}
        {m.run.lmstudio ? <span className="text-muted">{m.run.lmstudio}</span> : null}
      </div>
    </article>
  );
}

function ViralityShareStrip({ result }: { result: MatchResult }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const s = result.specs;
  const top = result.picks[0];
  const shareUrl = useMemo(() => {
    const p = new URLSearchParams({ gpu: s.gpu, vram: String(s.vramGb), ram: String(s.ramGb), cpu: s.cpu, os: s.os, unified: s.unified ? "1":"0", gpus: String(s.gpuCount||1), ctx: String(result.contextK??8)});
    return `${siteUrl()}/share?${p.toString()}`;
  }, [s, result.contextK]);
  const tweetText = top ? `My ${s.gpu} runs ${top.model.name} at ${top.tokPerSec || top.speed} — ${top.quant.name} · ${top.quant.vramGb}GB. Check what your rig can run:` : `Check what your rig can run at whatcanirun.dev`;
  const badgeMd = top ? `![${top.model.name} on ${s.gpu}](${shareUrl}) — My ${s.gpu} runs **${top.model.name}** at ${top.tokPerSec||top.speed} (${top.quant.name}, ${top.quant.vramGb}GB) via ${siteUrl()}` : shareUrl;

  useEffect(()=> {
    const canvas = canvasRef.current;
    if(!canvas || !top) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;
    const W=800, H=420;
    canvas.width=W; canvas.height=H;
    // bg
    ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#CC8800"; ctx.lineWidth=3; ctx.strokeRect(18,18,W-36,H-36);
    ctx.fillStyle="#111111"; ctx.fillRect(22,22,W-44,H-44);
    // grid
    ctx.strokeStyle="#2a2a2a"; ctx.lineWidth=1;
    for(let x=22;x<W;x+=28){ ctx.beginPath(); ctx.moveTo(x,22); ctx.lineTo(x,H-22); ctx.stroke(); }
    for(let y=22;y<H;y+=28){ ctx.beginPath(); ctx.moveTo(22,y); ctx.lineTo(W-22,y); ctx.stroke(); }
    // header
    ctx.fillStyle="#CC8800"; ctx.font="bold 13px JetBrains Mono"; ctx.fillText("⚡ WHAT CAN I RUN?  //  RIG SCORE CARD", 42, 62);
    ctx.fillStyle="#8c8c8c"; ctx.font="11px JetBrains Mono"; ctx.fillText("whatcanirun.dev · open weights × hardware", W-280,62);
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(42,78); ctx.lineTo(W-42,78); ctx.stroke();
    // rig line
    const rigLine = s.unified ? `${s.ramGb}GB Unified · ${s.gpu}` : `${s.gpuCount>1?`${s.gpuCount}x `:''}${s.gpu} · ${s.vramGb * Math.max(1,s.gpuCount||1)}GB VRAM · ${s.ramGb}GB RAM`;
    ctx.fillStyle="#f0f0f0"; ctx.font="bold 22px Chakra Petch"; ctx.fillText(rigLine.slice(0,48),42,118);
    ctx.fillStyle="#8c8c8c"; ctx.font="13px JetBrains Mono"; ctx.fillText(`${s.os} · ${s.cpu} · ${result.contextK??8}k ctx · ~${top?.bandwidthGbS||900} GB/s`,42,142);
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(42,162); ctx.lineTo(W-42,162); ctx.stroke();
    // verdict
    const fits = top.fit!=="no";
    ctx.fillStyle = fits ? "#16A34A" : "#c4c4c4"; ctx.font="bold 28px Chakra Petch"; ctx.fillText(fits?"✓ RUNS":"✗ TOO HEAVY",42,208);
    ctx.fillStyle="#f0f0f0"; ctx.font="bold 18px Chakra Petch"; ctx.fillText(top.model.name, 190,208);
    ctx.fillStyle="#8c8c8c"; ctx.font="12px JetBrains Mono"; ctx.fillText(`${top.quant.name} · ${top.quant.vramGb}GB · quality ${top.model.quality}/100 · ${top.tokPerSec||top.speed}`,42,232);
    // top 3 mini
    let y=272;
    ctx.fillStyle="#CC8800"; ctx.font="bold 11px JetBrains Mono"; ctx.fillText("TOP RUNNABLE",42,y);
    y+=22;
    result.picks.slice(0,3).forEach((p,i)=>{
      ctx.fillStyle = i===0?"rgba(204,136,0,0.12)":"rgba(255,255,255,0.04)"; ctx.fillRect(38,y-14,W-76,28);
      ctx.fillStyle="#f0f0f0"; ctx.font="12px JetBrains Mono"; ctx.fillText(`${i+1}. ${p.model.name}`,46,y+4);
      ctx.fillStyle="#CC8800"; ctx.font="bold 11px JetBrains Mono"; ctx.fillText(p.quant.name, 320,y+4);
      ctx.fillStyle="#8c8c8c"; ctx.font="11px JetBrains Mono"; ctx.fillText(`${p.quant.vramGb}GB  ${p.tokPerSec||p.speed}`, 420,y+4);
      ctx.fillStyle= p.fit==="gpu" ? "#16A34A" : "#8c8c8c"; ctx.fillText(p.fit==="gpu"?"FITS GPU":"OFFLOAD", 640,y+4);
      y+=32;
    });
    // footer
    ctx.strokeStyle="#2a2a2a"; ctx.beginPath(); ctx.moveTo(42,H-58); ctx.lineTo(W-42,H-58); ctx.stroke();
    ctx.fillStyle="#5c5c5c"; ctx.font="11px JetBrains Mono"; ctx.fillText("local inference · no cloud bill · private & offline",42,H-36);
    ctx.fillStyle="#CC8800"; ctx.font="bold 12px JetBrains Mono"; ctx.fillText("whatcanirun.dev",W-150,H-36);
  }, [s, top, result.picks, result.contextK]);

  const copy = async (text:string, key:string) => {
    try{ await navigator.clipboard.writeText(text);}catch{
      const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(key); setTimeout(()=>setCopied(null),1600);
  };
  const download = () => {
    const c=canvasRef.current; if(!c) return;
    const a=document.createElement("a"); a.download=`rig-score-${s.gpu.replace(/\s+/g,"_")}.png`; a.href=c.toDataURL("image/png"); a.click(); setCopied("dl"); setTimeout(()=>setCopied(null),1600);
  };
  const copyImage = async () => {
    const c=canvasRef.current; if(!c) return;
    try{
      const blob: Blob | null = await new Promise(res=> c.toBlob(r=>res(r)));
      if(!blob) throw new Error("no blob");
      // @ts-ignore
      const item = new window.ClipboardItem({"image/png": blob});
      // @ts-ignore
      await navigator.clipboard.write([item]);
      setCopied("img"); setTimeout(()=>setCopied(null),1600);
    }catch{ download(); }
  };

  if(!top) return null;
  return (
    <div className="mt-8 border border-primary/20 bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xs uppercase tracking-[0.28em] text-primary">virality · rig score card</div>
          <h3 className="mt-1 text-lg font-medium">shareable badge — built for screenshots</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">Looks crisp on X/Twitter, Reddit and Discord. Designed to be screenshotted or copied as an image — turns every result into distribution.</p>
        </div>
        <span className="border border-line bg-bg px-2 py-1 font-mono text-2xs text-muted">800×420 · auto-generated</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="overflow-hidden border border-line bg-black p-2">
          <canvas ref={canvasRef} className="h-auto w-full" style={{aspectRatio:"800/420"}} aria-label="Rig score card preview" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="border border-line bg-bg p-3">
            <div className="text-2xs uppercase tracking-widest text-dim">your badge copy</div>
            <div className="mt-2 font-mono text-xs leading-relaxed text-fg break-words">{badgeMd.slice(0,160)}…</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copyImage} className="min-h-10 border border-fg bg-fg px-3 text-2xs uppercase tracking-widest text-bg hover:opacity-90">{copied==="img"?"✓ copied image":"copy image"}</button>
            <button type="button" onClick={download} className="min-h-10 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{copied==="dl"?"✓ downloaded":"download png"}</button>
            <button type="button" onClick={()=> copy(badgeMd,"md")} className="min-h-10 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{copied==="md"?"✓ copied":"copy badge md"}</button>
            <button type="button" onClick={()=> copy(shareUrl,"url")} className="min-h-10 border border-line px-3 text-2xs uppercase tracking-widest text-muted hover:border-fg hover:text-fg">{copied==="url"?"✓ link copied":"copy link"}</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="min-h-10 inline-flex items-center justify-center border border-primary/40 bg-primary/10 px-3 text-center text-2xs uppercase tracking-widest text-primary hover:bg-primary hover:text-white">↗ tweet rig</a>
            <a href={`https://www.reddit.com/r/LocalLLaMA/submit?title=${encodeURIComponent(`My ${s.gpu} runs ${top.model.name} — fit report`)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="min-h-10 inline-flex items-center justify-center border border-orange-600/30 bg-orange-950/20 px-3 text-center text-2xs uppercase tracking-widest text-orange-300 hover:bg-orange-900/30">↗ reddit</a>
          </div>
          <a href={`/share?${new URLSearchParams({gpu:s.gpu, vram:String(s.vramGb), ram:String(s.ramGb), cpu:s.cpu, os:s.os, unified:s.unified?"1":"0", gpus:String(s.gpuCount||1), ctx:String(result.contextK??8)}).toString()}`} className="text-center text-2xs uppercase tracking-widest text-muted underline underline-offset-4 hover:text-fg">open full share studio →</a>
        </div>
      </div>
    </div>
  );
}

function VerdictBanner({ result }: { result: MatchResult }) {
  const top = result.picks[0];
  if (!top) return null;
  const fits = top.fit !== "no";
  const speed = top.tokPerSec || top.speed || "—";
  const vram = result.specs.vramGb || result.specs.ramGb;
  return (
    <div className="mt-6 border-2 border-success bg-success/5 p-6 sm:p-8 text-center">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: fits ? "var(--color-success)" : "var(--color-danger)" }}>
        {fits ? "YES — it runs" : "NO — too heavy"}
      </div>
      <p className="mt-3 text-sm text-muted">
        {fits
          ? `Your ${vram}GB rig runs ${top.model.name} at ${speed}. ${top.model.summary.split(".")[0]}.`
          : `${top.model.name} needs ${top.quant.vramGb}GB+. Closest fit: ${result.picks.find((p) => p.fit !== "no")?.model.name || "none"}`}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <span className="border border-success/40 bg-success px-3 py-1 text-2xs uppercase tracking-widest text-success-foreground">
          {fits ? "GPU-native" : "offload"} · {speed}
        </span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">
          {top.quant.name} · {top.quant.vramGb} GB
        </span>
        <span className="border border-line px-3 py-1 text-2xs uppercase tracking-widest text-muted">
          quality {top.model.quality}/100
        </span>
      </div>
    </div>
  );
}

export function MatchResults({
  result,
  onContextChange,
}: {
  result: MatchResult;
  onContextChange?: (ctx: number) => void;
}) {
  const s = result.specs;
  const ctx = result.contextK ?? 8;
  const [commercialOnly, setCommercialOnly] = useState(false);
  const isCommercial = (m: Model) => ["Apache-2.0", "MIT", "BSD"].includes(m.license);
  const picks = commercialOnly ? result.picks.filter((p) => isCommercial(p.model)) : result.picks;
  const also = commercialOnly ? result.also.filter((p) => isCommercial(p.model)) : result.also;
  const shareParams = new URLSearchParams({
    gpu: s.gpu,
    vram: String(s.vramGb),
    ram: String(s.ramGb),
    cpu: s.cpu,
    os: s.os,
    unified: s.unified ? "1" : "0",
    gpus: String(s.gpuCount || 1),
    ctx: String(ctx),
  });

  return (
    <section>
      <div className="border border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-2xs uppercase tracking-[0.28em] text-muted">your rig configuration</div>
          <div className="flex items-center gap-3">
            {onContextChange ? (
              <div className="flex items-center gap-1 text-2xs uppercase tracking-widest text-muted">
                <span>context:</span>
                <span className="font-mono text-fg">{ctx}k</span>
              </div>
            ) : null}
            <a
              href={`/share?${shareParams.toString()}`}
              className="border border-fg bg-fg px-2.5 py-1 text-2xs font-mono text-bg uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              ⚡ export & share card
            </a>
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-dim">gpu / accelerators</div>
            <div className="mt-1 font-mono">
              {s.gpuCount > 1 && !s.unified ? `${s.gpuCount}x ` : ""}{s.gpu}
            </div>
          </div>
          <div>
            <div className="text-dim">{s.unified ? "unified pool" : "total vram pool"}</div>
            <div className="mt-1 tabular-nums font-mono">
              {s.unified ? `${s.ramGb} GB Unified` : `${s.vramGb * Math.max(1, s.gpuCount || 1)} GB VRAM`}
            </div>
          </div>
          <div>
            <div className="text-dim">system ram</div>
            <div className="mt-1 tabular-nums font-mono">{s.ramGb} GB</div>
          </div>
          <div>
            <div className="text-dim">os / cpu</div>
            <div className="mt-1">
              {s.os} · {s.cpu}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">{result.blurb}</p>
      </div>

        <VerdictBanner result={result} />

        <ViralityShareStrip result={result} />

        <SavingsVsApi result={result} />

        {/* Feature 2: License filter */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCommercialOnly(!commercialOnly)}
            className={cn(
              "min-h-10 border px-4 text-2xs uppercase tracking-widest transition-colors",
              commercialOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted hover:border-fg hover:text-fg"
            )}
          >
            {commercialOnly ? "✓ commercial-safe only" : "filter: commercial-safe only"}
          </button>
          {commercialOnly ? (
            <span className="text-2xs text-muted">Apache-2.0 / MIT only</span>
          ) : null}
        </div>

        <h2 className="mt-8 text-sm uppercase tracking-[0.22em] text-muted">top runnable models</h2>
        <div className="mt-3 grid gap-4">
          {picks.map((p, i) => (
            <PickCard key={p.model.id} fit={p} rank={i + 1} contextK={ctx} specs={s} />
          ))}
        </div>

        <QuantGlossary />
        <MethodologyNote />

        {also.length ? (
          <>
            <h2 className="mt-10 text-sm uppercase tracking-[0.22em] text-muted">also runnable</h2>
            <div className="mt-3 divide-y divide-line border border-line">
              {also.map((p) => (
              <div
                key={p.model.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm">
                    {p.model.name}{" "}
                    <span className="text-muted">
                      · {p.quant.name} {p.quant.vramGb} GB ({p.speed})
                    </span>
                  </div>
                  <div className="text-xs text-muted">{p.model.summary}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <FitBadge fit={p.fit} />
                  <a href={p.model.hf} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    get
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Feature 4: Upgrade path */}
      <UpgradePath result={result} />

      {/* Feature 6: Benchmark compare */}
      <BenchmarkCompare result={result} />

      <SimilarRigsStrip specs={s} />

      {/* Feature 5: Community consensus */}
      <CommunityConsensus specs={s} />

      <DistributionLoop result={result} />
    </section>
  );
}

