import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { matchModels } from "@/lib/models/match";
import type { Specs } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/share")({ component: SharePage });

const CARD_THEMES = [
  { id: "obsidian-amber", name: "Obsidian Amber", bg: "#09090b", fg: "#fafafa", accent: "#f59e0b", border: "#27272a", sub: "#a1a1aa" },
  { id: "slate-frost", name: "Slate Frost", bg: "#0f172a", fg: "#f8fafc", accent: "#38bdf8", border: "#1e293b", sub: "#94a3b8" },
  { id: "carbon-emerald", name: "Carbon Emerald", bg: "#0a0f0d", fg: "#ecfdf5", accent: "#10b981", border: "#1f2e28", sub: "#6ee7b7" },
  { id: "nordic-mono", name: "Nordic Mono", bg: "#18181b", fg: "#fafafa", accent: "#e4e4e7", border: "#3f3f46", sub: "#a1a1aa" },
];

const SHARE_PRESETS = [
  {
    label: "RTX 5090 (32 GB)",
    specs: { gpu: "NVIDIA GeForce RTX 5090", vramGb: 32, ramGb: 64, cpu: "AMD Ryzen 9 9950X", os: "Linux", unified: false, gpuCount: 1, ctx: 16 },
  },
  {
    label: "RTX 5080 (16 GB)",
    specs: { gpu: "NVIDIA GeForce RTX 5080", vramGb: 16, ramGb: 32, cpu: "AMD Ryzen 7 9800X3D", os: "Windows", unified: false, gpuCount: 1, ctx: 8 },
  },
  {
    label: "2x RTX 3090 (48 GB)",
    specs: { gpu: "NVIDIA GeForce RTX 3090", vramGb: 24, ramGb: 128, cpu: "AMD Threadripper", os: "Linux", unified: false, gpuCount: 2, ctx: 16 },
  },
  {
    label: "Ryzen AI Max+ 395 (128 GB)",
    specs: { gpu: "AMD Radeon 8060S (Strix Halo)", vramGb: 0, ramGb: 128, cpu: "AMD Ryzen AI Max+ 395", os: "Linux", unified: true, gpuCount: 1, ctx: 32 },
  },
  {
    label: "Mac Studio M3 Ultra (512 GB)",
    specs: { gpu: "Apple M3 Ultra", vramGb: 0, ramGb: 512, cpu: "Apple M3 Ultra", os: "macOS", unified: true, gpuCount: 1, ctx: 32 },
  },
];

function generateMarkdownSnippet(
  specs: Specs,
  topModels: Array<{ name: string; quant: string; mem: number; speed: string; fit: string }>,
  ctx: number,
) {
  const gpuDesc = specs.unified
    ? `${specs.ramGb} GB Unified (${specs.cpu})`
    : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)} GB VRAM) + ${specs.ramGb} GB RAM`;

  return `### What Can I Run — Hardware Fit Report
**Rig:** ${gpuDesc} | **Context:** ${ctx}k tokens | **OS:** ${specs.os}

| Model | Quant | Total Memory | Speed | Fit Mode |
| :--- | :---: | :---: | :---: | :---: |
${topModels.map((m) => `| **${m.name}** | \`${m.quant}\` | ${m.mem} GB | ${m.speed} | ${m.fit.toUpperCase()} |`).join("\n")}

*Generated with What Can I Run*`;
}

function generateAsciiCard(
  specs: Specs,
  topModels: Array<{ name: string; quant: string; mem: number; speed: string; fit: string }>,
  ctx: number,
) {
  const gpuLine = specs.unified
    ? `${specs.ramGb} GB Unified (${specs.gpu})`
    : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)} GB VRAM)`;

  return `+-------------------------------------------------------------+
|  WHAT CAN I RUN - HARDWARE FIT BENCHMARK REPORT             |
+-------------------------------------------------------------+
| RIG:     ${gpuLine.slice(0, 51).padEnd(51)}|
| RAM:     ${`${specs.ramGb} GB System RAM · ${specs.os}`.slice(0, 51).padEnd(51)}|
| CONTEXT: ${`${ctx}k tokens active KV cache`.slice(0, 51).padEnd(51)}|
+-------------------------------------------------------------+
| TOP RUNNABLE OPEN-WEIGHT MODELS:                            |
${topModels.map((m, i) => `| ${i + 1}. ${m.name.slice(0, 20).padEnd(20)} [${m.quant.padEnd(5)}] ${`${m.mem}GB`.padEnd(6)} ${m.speed.slice(0, 16).padEnd(16)} |`).join("\n")}
+-------------------------------------------------------------+`;
}

function SharePage() {
  const [params, setParams] = useState(SHARE_PRESETS[0].specs);
  const [themeId, setThemeId] = useState("obsidian-amber");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://whatcanirun.dev");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
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
        gpu: gpu || "NVIDIA GeForce RTX 5090",
        vramGb: Number(vram) || 32,
        ramGb: Number(ram) || 64,
        cpu: cpu || "AMD Ryzen 9",
        os: os || "Linux",
        unified: unified === "1" || unified === "true",
        gpuCount: Number(gpus) || 1,
        ctx: Number(ctx) || 8,
      });
    }
  }, []);

  const specs: Specs = useMemo(
    () => ({
      gpu: params.gpu,
      vramGb: params.vramGb,
      ramGb: params.ramGb,
      cpu: params.cpu,
      os: params.os,
      unified: params.unified,
      gpuCount: params.gpuCount,
      source: "preset",
    }),
    [params],
  );

  const match = useMemo(() => matchModels(specs, undefined, params.ctx), [specs, params.ctx]);

  const currentTheme = useMemo(
    () => CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0],
    [themeId],
  );

  const topFitList = useMemo(
    () =>
      match.picks.slice(0, 4).map((p) => ({
        name: p.model.name,
        quant: p.quant.name,
        mem: Math.round(((p.weightsGb || p.quant.vramGb) + (p.kvCacheGb || 0.5)) * 10) / 10,
        speed: p.speed,
        fit: p.fit,
      })),
    [match],
  );

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

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, width, height);

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

    ctx.fillStyle = t.bg;
    ctx.fillRect(36, 36, width - 72, height - 72);
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.fillStyle = t.accent;
    ctx.font = "600 16px sans-serif";
    ctx.fillText("WHAT CAN I RUN · HARDWARE FIT REPORT", 64, 82);

    ctx.fillStyle = t.sub;
    ctx.font = "14px monospace";
    ctx.fillText("Local Open-Weight Sizing Engine", width - 310, 82);

    ctx.strokeStyle = t.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, 102);
    ctx.lineTo(width - 64, 102);
    ctx.stroke();

    ctx.fillStyle = t.fg;
    ctx.font = "bold 32px sans-serif";
    const gpuTitle = specs.unified
      ? `${specs.ramGb} GB Unified Memory (${specs.gpu})`
      : `${specs.gpuCount > 1 ? `${specs.gpuCount}x ` : ""}${specs.gpu} (${specs.vramGb * Math.max(1, specs.gpuCount)} GB VRAM)`;
    ctx.fillText(gpuTitle, 64, 154);

    ctx.fillStyle = t.sub;
    ctx.font = "16px monospace";
    ctx.fillText(
      `RAM: ${specs.ramGb} GB · OS: ${specs.os} · Context: ${params.ctx}k · Bandwidth: ~${match.picks[0]?.bandwidthGbS || 900} GB/s`,
      64,
      190,
    );

    ctx.strokeStyle = t.border;
    ctx.beginPath();
    ctx.moveTo(64, 214);
    ctx.lineTo(width - 64, 214);
    ctx.stroke();

    ctx.fillStyle = t.accent;
    ctx.font = "600 13px monospace";
    ctx.fillText("MODEL", 64, 250);
    ctx.fillText("QUANT", 470, 250);
    ctx.fillText("FOOTPRINT", 610, 250);
    ctx.fillText("DECODE SPEED", 800, 250);
    ctx.fillText("FIT", 1040, 250);

    let y = 294;
    topFitList.forEach((item, index) => {
      ctx.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent";
      ctx.fillRect(54, y - 26, width - 108, 48);

      ctx.fillStyle = t.fg;
      ctx.font = "600 18px sans-serif";
      ctx.fillText(`${index + 1}. ${item.name}`, 64, y + 4);

      ctx.fillStyle = t.accent;
      ctx.font = "600 15px monospace";
      ctx.fillText(item.quant, 470, y + 4);

      ctx.fillStyle = t.fg;
      ctx.font = "15px monospace";
      ctx.fillText(`${item.mem} GB`, 610, y + 4);

      ctx.fillStyle = t.sub;
      ctx.font = "15px monospace";
      ctx.fillText(item.speed, 800, y + 4);

      const isGpu = item.fit === "gpu";
      ctx.fillStyle = isGpu ? t.accent : t.sub;
      ctx.font = "600 14px monospace";
      ctx.fillText(isGpu ? "FITS GPU" : "HYBRID", 1040, y + 4);

      y += 58;
    });

    ctx.strokeStyle = t.border;
    ctx.beginPath();
    ctx.moveTo(64, height - 74);
    ctx.lineTo(width - 64, height - 74);
    ctx.stroke();

    ctx.fillStyle = t.sub;
    ctx.font = "13px monospace";
    ctx.fillText("Weights + KV cache sizing for Ollama, LM Studio, llama.cpp, vLLM & MLX", 64, height - 46);

    ctx.fillStyle = t.accent;
    ctx.font = "600 14px monospace";
    ctx.fillText("whatcanirun.dev", width - 190, height - 46);
  }, [specs, currentTheme, topFitList, match, params.ctx]);

  const shareUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("gpu", specs.gpu);
    sp.set("vram", String(specs.vramGb));
    sp.set("ram", String(specs.ramGb));
    sp.set("cpu", specs.cpu);
    sp.set("os", specs.os);
    if (specs.unified) sp.set("unified", "1");
    if (specs.gpuCount > 1) sp.set("gpus", String(specs.gpuCount));
    if (params.ctx !== 8) sp.set("ctx", String(params.ctx));
    return `${origin}/share?${sp.toString()}`;
  }, [origin, specs, params.ctx]);

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

  const copyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new (window as unknown as { ClipboardItem: new (d: Record<string, Blob>) => ClipboardItem }).ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopiedType("image");
        setTimeout(() => setCopiedType(null), 2000);
      });
    } catch {
      downloadImage();
    }
  };

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="text-xs font-medium text-primary">Share Studio</div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
            Hardware Fit Card Generator
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Export high-resolution 1200×630 hardware cards, copy share links, or generate Reddit and Discord benchmark tables.
          </p>
        </div>

        <Link
          to="/"
          className="whitespace-nowrap shrink-0 rounded-lg border border-line-strong bg-surface px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-elevated"
        >
          Back to Bench
        </Link>
      </div>

      {/* Presets */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3.5">
        <span className="mr-1 text-xs font-medium text-dim">Reference Presets:</span>
        {SHARE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setParams(preset.specs)}
            className={cn(
              "whitespace-nowrap shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              params.gpu === preset.specs.gpu && params.ramGb === preset.specs.ramGb
                ? "border-primary bg-primary/10 text-primary"
                : "border-line bg-bg text-muted hover:text-fg",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Theme & Export Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1">
          {CARD_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setThemeId(theme.id)}
              className={cn(
                "whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                themeId === theme.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
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
            className="inline-flex h-10 whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-bg transition-opacity hover:opacity-90"
          >
            {copiedType === "image" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedType === "image" ? "Image Copied" : "Copy Card PNG"}
          </button>
          <button
            type="button"
            onClick={downloadImage}
            className="inline-flex h-10 whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs font-medium text-fg hover:bg-elevated"
          >
            <Download className="h-3.5 w-3.5" />
            {copiedType === "download" ? "Saved" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl, "url")}
            className="inline-flex h-10 whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs font-medium text-fg hover:bg-elevated"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copiedType === "url" ? "Link Copied" : "Copy Link"}
          </button>
          <a
            href={`https://www.reddit.com/r/LocalLLaMA/submit?title=${encodeURIComponent(`My rig can run ${specs.gpu} — ${topFitList[0]?.name ?? "local LLM"} fit report`)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3.5 text-xs font-medium text-fg hover:bg-elevated"
          >
            Post to r/LocalLLaMA <ExternalLink className="h-3.5 w-3.5 text-dim" />
          </a>
        </div>
      </div>

      {/* Canvas Preview */}
      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-bg p-2 sm:p-4">
        <div className="relative aspect-[1200/630] w-full">
          <canvas ref={canvasRef} className="h-full w-full rounded-lg object-contain" />
        </div>
      </div>

      {/* Exports */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg">Reddit / Discord Markdown</span>
            <button
              type="button"
              onClick={() => copyToClipboard(generateMarkdownSnippet(specs, topFitList, params.ctx), "md")}
              className="text-xs font-medium text-primary hover:underline"
            >
              {copiedType === "md" ? "Copied" : "Copy Markdown"}
            </button>
          </div>
          <pre className="mt-3 max-h-52 overflow-x-auto rounded-lg border border-line bg-bg p-3.5 font-mono text-xs text-muted whitespace-pre-wrap">
            {generateMarkdownSnippet(specs, topFitList, params.ctx)}
          </pre>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg">ASCII Terminal Report</span>
            <button
              type="button"
              onClick={() => copyToClipboard(generateAsciiCard(specs, topFitList, params.ctx), "ascii")}
              className="text-xs font-medium text-primary hover:underline"
            >
              {copiedType === "ascii" ? "Copied" : "Copy ASCII"}
            </button>
          </div>
          <pre className="mt-3 max-h-52 overflow-x-auto rounded-lg border border-line bg-bg p-3.5 font-mono text-xs text-muted whitespace-pre">
            {generateAsciiCard(specs, topFitList, params.ctx)}
          </pre>
        </div>
      </div>
    </SiteShell>
  );
}
