import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { matchModels } from "@/lib/models/match";
import type { Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/share")({ component: SharePage });

const CARD_THEMES = [
  { id: "cyber-mono", name: "Cyber Mono", bg: "#0d1117", fg: "#e6edf3", accent: "#58a6ff", border: "#30363d", sub: "#8b949e" },
  { id: "terminal-green", name: "Phosphor 80s", bg: "#080f0a", fg: "#39ff14", accent: "#00ff66", border: "#183b1c", sub: "#1e822a" },
  { id: "nordic-ice", name: "Nordic Frost", bg: "#2e3440", fg: "#eceff4", accent: "#88c0d0", border: "#4c566a", sub: "#d8dee9" },
  { id: "amber-crt", name: "Amber CRT", bg: "#120a00", fg: "#ffb000", accent: "#ffcc00", border: "#422500", sub: "#b37400" },
];

function generateMarkdownSnippet(specs: Specs, topModels: Array<{ name: string; quant: string; mem: number; speed: string; fit: string }>, ctx: number) {
  const gpuDesc = specs.unified
    ? `${specs.ramGb}GB Unified (${specs.cpu})`
    : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)}GB VRAM) + ${specs.ramGb}GB RAM`;

  return `### ⚡ What Can I Run? Fit Report
**Rig:** ${gpuDesc} | **Context:** ${ctx}k tokens
**OS:** ${specs.os}

| Model | Quant | Total Memory | Speed | Fit Mode |
| :--- | :---: | :---: | :---: | :---: |
${topModels.map((m) => `| **${m.name}** | \`${m.quant}\` | ${m.mem} GB | ${m.speed} | ${m.fit.toUpperCase()} |`).join("\n")}

*Generated with [whatcanirun.dev](https://whatcanirun.dev)*`;
}

function generateAsciiCard(specs: Specs, topModels: Array<{ name: string; quant: string; mem: number; speed: string; fit: string }>, ctx: number) {
  const gpuLine = specs.unified
    ? `${specs.ramGb}GB Unified (${specs.gpu})`
    : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)}GB VRAM)`;

  return `+-------------------------------------------------------------+
|  WHAT CAN I RUN? - HARDWARE FIT BENCHMARK REPORT             |
+-------------------------------------------------------------+
| RIG:     ${gpuLine.padEnd(51)}|
| RAM:     ${`${specs.ramGb} GB System RAM · ${specs.os}`.padEnd(51)}|
| CONTEXT: ${`${ctx}k tokens active KV cache`.padEnd(51)}|
+-------------------------------------------------------------+
| TOP RUNNABLE OPEN-WEIGHT MODELS:                            |
${topModels.map((m, i) => `| ${i + 1}. ${m.name.padEnd(20)} [${m.quant.padEnd(5)}] ${`${m.mem}GB`.padEnd(6)} ${m.speed.padEnd(16)} |`).join("\n")}
+-------------------------------------------------------------+
| Verify your specs & copy runner commands at whatcanirun.dev |
+-------------------------------------------------------------+`;
}

function SharePage() {
  const [params, setParams] = useState<{
    gpu: string;
    vramGb: number;
    ramGb: number;
    cpu: string;
    os: string;
    unified: boolean;
    gpuCount: number;
    ctx: number;
  }>({
    gpu: "NVIDIA GeForce RTX 4090",
    vramGb: 24,
    ramGb: 64,
    cpu: "AMD Ryzen 9 7950X",
    os: "Linux",
    unified: false,
    gpuCount: 1,
    ctx: 8,
  });

  const [themeId, setThemeId] = useState("cyber-mono");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read URL search params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const gpu = sp.get("gpu");
    const vram = sp.get("vram");
    const ram = sp.get("ram");
    const cpu = sp.get("cpu");
    const os = sp.get("os");
    const unified = sp.get("unified");
    const gpus = sp.get("gpus");
    const ctx = sp.get("ctx");

    if (gpu || vram || ram) {
      setParams({
        gpu: gpu || "NVIDIA GeForce RTX 4090",
        vramGb: Number(vram) || 24,
        ramGb: Number(ram) || 64,
        cpu: cpu || "AMD Ryzen 9",
        os: os || "Linux",
        unified: unified === "1" || unified === "true",
        gpuCount: Number(gpus) || 1,
        ctx: Number(ctx) || 8,
      });
    }
  }, []);

  const specs: Specs = useMemo(() => ({
    gpu: params.gpu,
    vramGb: params.vramGb,
    ramGb: params.ramGb,
    cpu: params.cpu,
    os: params.os,
    unified: params.unified,
    gpuCount: params.gpuCount,
    source: "preset",
  }), [params]);

  const match = useMemo(() => {
    return matchModels(specs, undefined, params.ctx);
  }, [specs, params.ctx]);

  const currentTheme = useMemo(() => {
    return CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];
  }, [themeId]);

  const topFitList = useMemo(() => {
    return match.picks.slice(0, 4).map((p) => ({
      name: p.model.name,
      quant: p.quant.name,
      mem: Math.round(((p.weightsGb || p.quant.vramGb) + (p.kvCacheGb || 0.5)) * 10) / 10,
      speed: p.speed,
      fit: p.fit,
    }));
  }, [match]);

  // Draw High-Resolution Social Preview Card to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    const t = currentTheme;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer border frame
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner card background
    ctx.fillStyle = t.bg;
    ctx.fillRect(40, 40, width - 80, height - 80);

    // Header badge
    ctx.fillStyle = t.accent;
    ctx.font = "bold 18px monospace";
    ctx.fillText("⚡ WHAT CAN I RUN? // HARDWARE FIT BENCHMARK", 60, 85);

    ctx.fillStyle = t.sub;
    ctx.font = "14px monospace";
    ctx.fillText("whatcanirun.dev · local llm sizing engine", width - 380, 85);

    // Divider
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 105);
    ctx.lineTo(width - 60, 105);
    ctx.stroke();

    // Rig overview section
    ctx.fillStyle = t.fg;
    ctx.font = "bold 34px sans-serif";
    const gpuTitle = specs.unified
      ? `${specs.ramGb}GB Unified Memory (${specs.gpu})`
      : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)}GB VRAM)`;
    ctx.fillText(gpuTitle, 60, 160);

    ctx.fillStyle = t.sub;
    ctx.font = "18px monospace";
    ctx.fillText(
      `System RAM: ${specs.ramGb}GB · OS: ${specs.os} · Context: ${params.ctx}k tokens · Bandwidth: ~${match.picks[0]?.bandwidthGbS || 900} GB/s`,
      60,
      195
    );

    // Divider
    ctx.strokeStyle = t.border;
    ctx.beginPath();
    ctx.moveTo(60, 220);
    ctx.lineTo(width - 60, 220);
    ctx.stroke();

    // Table Header
    ctx.fillStyle = t.accent;
    ctx.font = "bold 15px monospace";
    ctx.fillText("RUNNABLE MODEL", 60, 255);
    ctx.fillText("QUANT", 480, 255);
    ctx.fillText("TOTAL VRAM / RAM", 620, 255);
    ctx.fillText("EST. INFERENCE SPEED", 830, 255);
    ctx.fillText("FIT STATUS", 1040, 255);

    // Rows
    let y = 295;
    topFitList.forEach((item, index) => {
      ctx.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent";
      ctx.fillRect(50, y - 25, width - 100, 48);

      ctx.fillStyle = t.fg;
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`${index + 1}. ${item.name}`, 60, y + 5);

      ctx.fillStyle = t.accent;
      ctx.font = "bold 16px monospace";
      ctx.fillText(item.quant, 480, y + 5);

      ctx.fillStyle = t.fg;
      ctx.font = "16px monospace";
      ctx.fillText(`${item.mem} GB`, 620, y + 5);

      ctx.fillStyle = t.sub;
      ctx.font = "15px monospace";
      ctx.fillText(item.speed, 830, y + 5);

      // Fit badge
      const isGpu = item.fit === "gpu";
      ctx.fillStyle = isGpu ? t.accent : t.sub;
      ctx.font = "bold 14px monospace";
      ctx.fillText(isGpu ? "[✓ FITS GPU]" : "[HYBRID / RAM]", 1040, y + 5);

      y += 58;
    });

    // Footer
    ctx.strokeStyle = t.border;
    ctx.beginPath();
    ctx.moveTo(60, height - 75);
    ctx.lineTo(width - 60, height - 75);
    ctx.stroke();

    ctx.fillStyle = t.sub;
    ctx.font = "13px monospace";
    ctx.fillText("Accurate weights + KV cache footprint modeling for Ollama, llama.cpp, vLLM & LM Studio", 60, height - 45);

    ctx.fillStyle = t.accent;
    ctx.font = "bold 14px monospace";
    ctx.fillText("whatcanirun.dev", width - 180, height - 45);
  }, [specs, currentTheme, topFitList, match, params.ctx]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://whatcanirun.dev";
    const base = window.location.origin;
    const sp = new URLSearchParams();
    sp.set("gpu", specs.gpu);
    sp.set("vram", String(specs.vramGb));
    sp.set("ram", String(specs.ramGb));
    sp.set("cpu", specs.cpu);
    sp.set("os", specs.os);
    if (specs.unified) sp.set("unified", "1");
    if (specs.gpuCount > 1) sp.set("gpus", String(specs.gpuCount));
    if (params.ctx !== 8) sp.set("ctx", String(params.ctx));
    return `${base}/share?${sp.toString()}`;
  }, [specs, params.ctx]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const copyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        // @ts-expect-error ClipboardItem is available in modern browsers
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopiedType("image");
        setTimeout(() => setCopiedType(null), 2000);
      });
    } catch {
      downloadImage();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whatcanirun-${specs.gpu.replace(/\s+/g, "_")}-${specs.unified ? `${specs.ramGb}GB-unified` : `${specs.vramGb * Math.max(1, specs.gpuCount)}GB-vram`}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setCopiedType("download");
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <SiteShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xs uppercase tracking-[0.28em] text-muted">social spec card & share</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">hardware fit card generator</h1>
        </div>
        <Link
          to="/"
          className="border border-line px-3 py-1.5 text-xs uppercase tracking-widest text-muted hover:text-fg"
        >
          ← back to bench
        </Link>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Generate high-resolution social preview cards, copy share links, or export Reddit & Discord formatted benchmark tables to show your rig's local model sizing.
      </p>

      {/* Preset Quick Switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border border-line bg-surface p-3">
        <span className="text-2xs uppercase tracking-widest text-dim mr-2">quick presets:</span>
        <button
          type="button"
          onClick={() => setParams({ gpu: "NVIDIA GeForce RTX 4090", vramGb: 24, ramGb: 64, cpu: "AMD Ryzen 9 7950X", os: "Linux", unified: false, gpuCount: 1, ctx: 8 })}
          className="border border-line px-2 py-1 text-2xs hover:border-fg"
        >
          1x RTX 4090 (24GB)
        </button>
        <button
          type="button"
          onClick={() => setParams({ gpu: "NVIDIA GeForce RTX 3090", vramGb: 24, ramGb: 128, cpu: "AMD Threadripper", os: "Linux", unified: false, gpuCount: 2, ctx: 8 })}
          className="border border-line px-2 py-1 text-2xs hover:border-fg"
        >
          2x RTX 3090 (48GB Stacking)
        </button>
        <button
          type="button"
          onClick={() => setParams({ gpu: "Apple M2 Ultra", vramGb: 192, ramGb: 192, cpu: "Apple M2 Ultra (24-core)", os: "macOS", unified: true, gpuCount: 1, ctx: 32 })}
          className="border border-line px-2 py-1 text-2xs hover:border-fg"
        >
          Mac Studio M2 Ultra (192GB)
        </button>
        <button
          type="button"
          onClick={() => setParams({ gpu: "NVIDIA GeForce RTX 3060", vramGb: 12, ramGb: 32, cpu: "Intel Core i7-12700K", os: "Windows", unified: false, gpuCount: 1, ctx: 8 })}
          className="border border-line px-2 py-1 text-2xs hover:border-fg"
        >
          RTX 3060 (12GB Budget King)
        </button>
      </div>

      {/* Theme Picker & Action Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-dim">card style:</span>
          {CARD_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setThemeId(theme.id)}
              className={cn(
                "px-2.5 py-1 text-2xs uppercase tracking-wider border transition-colors",
                themeId === theme.id ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"
              )}
            >
              {theme.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyImageToClipboard}
            className="min-h-10 border border-fg bg-fg px-3 text-xs font-mono text-bg uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            {copiedType === "image" ? "✓ image copied to clipboard!" : "📋 copy card image"}
          </button>
          <button
            type="button"
            onClick={downloadImage}
            className="min-h-10 border border-line px-3 text-xs uppercase tracking-wider text-muted hover:text-fg hover:border-fg transition-colors"
          >
            {copiedType === "download" ? "✓ downloaded!" : "⬇ download png"}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl, "url")}
            className="min-h-10 border border-line px-3 text-xs uppercase tracking-wider text-muted hover:text-fg hover:border-fg transition-colors"
          >
            {copiedType === "url" ? "✓ link copied!" : "🔗 copy share link"}
          </button>
        </div>
      </div>

      {/* Visual Canvas Card Preview */}
      <div className="mt-6 overflow-hidden border border-line bg-black p-2 sm:p-4">
        <div className="relative aspect-[1200/630] w-full">
          <canvas
            ref={canvasRef}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Export Formats Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Reddit & Discord Markdown */}
        <div className="border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-widest text-dim">reddit / discord markdown:</span>
            <button
              type="button"
              onClick={() => copyToClipboard(generateMarkdownSnippet(specs, topFitList, params.ctx), "md")}
              className="text-2xs uppercase tracking-widest text-muted underline hover:text-fg"
            >
              {copiedType === "md" ? "✓ copied" : "copy markdown"}
            </button>
          </div>
          <pre className="mt-3 max-h-48 overflow-x-auto border border-line bg-bg p-3 text-2xs text-muted font-mono whitespace-pre-wrap">
            {generateMarkdownSnippet(specs, topFitList, params.ctx)}
          </pre>
        </div>

        {/* ASCII Terminal Art */}
        <div className="border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-widest text-dim">ascii telemetry card:</span>
            <button
              type="button"
              onClick={() => copyToClipboard(generateAsciiCard(specs, topFitList, params.ctx), "ascii")}
              className="text-2xs uppercase tracking-widest text-muted underline hover:text-fg"
            >
              {copiedType === "ascii" ? "✓ copied" : "copy ascii"}
            </button>
          </div>
          <pre className="mt-3 max-h-48 overflow-x-auto border border-line bg-bg p-3 text-2xs text-muted font-mono whitespace-pre">
            {generateAsciiCard(specs, topFitList, params.ctx)}
          </pre>
        </div>
      </div>
    </SiteShell>
  );
}
