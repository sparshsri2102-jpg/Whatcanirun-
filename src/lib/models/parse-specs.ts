import type { Specs } from "./types";

const GPU_VRAM: Array<{ re: RegExp; name: string; vram: number }> = [
  { re: /rtx\s*5090/i, name: "RTX 5090", vram: 32 },
  { re: /rtx\s*5080/i, name: "RTX 5080", vram: 16 },
  { re: /rtx\s*5070\s*ti/i, name: "RTX 5070 Ti", vram: 16 },
  { re: /rtx\s*5070/i, name: "RTX 5070", vram: 12 },
  { re: /rtx\s*4090/i, name: "RTX 4090", vram: 24 },
  { re: /rtx\s*4080\s*super/i, name: "RTX 4080 Super", vram: 16 },
  { re: /rtx\s*4080/i, name: "RTX 4080", vram: 16 },
  { re: /rtx\s*4070\s*ti\s*super/i, name: "RTX 4070 Ti Super", vram: 16 },
  { re: /rtx\s*4070\s*ti/i, name: "RTX 4070 Ti", vram: 12 },
  { re: /rtx\s*4070\s*super/i, name: "RTX 4070 Super", vram: 12 },
  { re: /rtx\s*4070/i, name: "RTX 4070", vram: 12 },
  { re: /rtx\s*4060\s*ti\s*16/i, name: "RTX 4060 Ti 16GB", vram: 16 },
  { re: /rtx\s*4060\s*ti/i, name: "RTX 4060 Ti", vram: 8 },
  { re: /rtx\s*4060/i, name: "RTX 4060", vram: 8 },
  { re: /rtx\s*3090\s*ti/i, name: "RTX 3090 Ti", vram: 24 },
  { re: /rtx\s*3090/i, name: "RTX 3090", vram: 24 },
  { re: /rtx\s*3080\s*ti/i, name: "RTX 3080 Ti", vram: 12 },
  { re: /rtx\s*3080/i, name: "RTX 3080", vram: 10 },
  { re: /rtx\s*3070\s*ti/i, name: "RTX 3070 Ti", vram: 8 },
  { re: /rtx\s*3070/i, name: "RTX 3070", vram: 8 },
  { re: /rtx\s*3060\s*ti/i, name: "RTX 3060 Ti", vram: 8 },
  { re: /rtx\s*3060/i, name: "RTX 3060", vram: 12 },
  { re: /rtx\s*3050/i, name: "RTX 3050", vram: 8 },
  { re: /rx\s*7900\s*xtx/i, name: "RX 7900 XTX", vram: 24 },
  { re: /rx\s*7900\s*xt/i, name: "RX 7900 XT", vram: 20 },
  { re: /rx\s*7800\s*xt/i, name: "RX 7800 XT", vram: 16 },
  { re: /rx\s*7600/i, name: "RX 7600", vram: 8 },
  { re: /arc\s*b580/i, name: "Arc B580", vram: 12 },
  { re: /arc\s*a770/i, name: "Arc A770", vram: 16 },
  { re: /a100\s*80/i, name: "A100 80GB", vram: 80 },
  { re: /a100/i, name: "A100", vram: 40 },
  { re: /h100/i, name: "H100", vram: 80 },
  { re: /h200/i, name: "H200", vram: 141 },
  { re: /l40s/i, name: "L40S", vram: 48 },
  { re: /rtx\s*a6000|rtx\s*6000\s*ada/i, name: "RTX 6000 Ada", vram: 48 },
];

function appleChip(text: string): { name: string; unified: boolean } | null {
  const m = text.match(/\b(M[1-5](?:\s*(?:Pro|Max|Ultra))?)\b/i);
  if (!m) return null;
  const name = `Apple ${m[1].replace(/\s+/g, " ")}`;
  return { name, unified: true };
}

function numGb(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const n = Number(m[1] ?? m[2]);
    if (Number.isFinite(n) && n > 0 && n < 2048) return n;
  }
  return null;
}

export function parseSpecsHeuristic(text: string): Specs | null {
  const raw = text.trim();
  if (!raw) return null;

  const apple = appleChip(raw);
  const gpuHit = GPU_VRAM.find((g) => g.re.test(raw));

  const vramFromText = numGb(raw, [
    /(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s*(?:vram|video|dedicated)/i,
    /vram[:\s]+(\d+(?:\.\d+)?)\s*(?:gb|gi?b)/i,
    /dedicated\s*(?:gpu|video)?\s*memory[:\s]+(\d+(?:\.\d+)?)/i,
  ]);
  const ramFromText = numGb(raw, [
    /(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s*(?:(?:of\s+)?(?:system\s+)?ram|memory|ddr[45]|unified)/i,
    /(?:system\s+)?(?:ram|memory)[:\s]+(\d+(?:\.\d+)?)\s*(?:gb|gi?b)/i,
    /installed\s+physical\s+memory[^0-9]*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:gb|gi?b)\s+unified/i,
  ]);

  let os = "unknown";
  if (/windows|win\s*1[01]|dxdiag/i.test(raw)) os = "Windows";
  else if (/macos|os\s*x|darwin|apple\s+m\d/i.test(raw)) os = "macOS";
  else if (/linux|ubuntu|fedora|arch|debian|nixos/i.test(raw)) os = "Linux";

  const cpuMatch = raw.match(
    /((?:intel|amd|apple)\s+(?:core\s+)?(?:i[3579]|ryzen|xeon|epyc|m[1-5])[^\n,]{0,40})/i,
  );
  const cpu = cpuMatch?.[1]?.trim() ?? (apple ? apple.name : "unknown");

  const gpuCount = Math.max(1, (raw.match(/rtx\s*\d{4}/gi) ?? []).length > 1 ? 2 : 1);

  const unified = Boolean(apple);
  const gpu = apple?.name ?? gpuHit?.name ?? (vramFromText ? "discrete GPU" : "none");
  const vramGb = unified
    ? (ramFromText ?? 16)
    : (vramFromText ?? gpuHit?.vram ?? 0);
  const ramGb = ramFromText ?? (unified ? vramGb : 16);

  if (!gpuHit && !apple && vramFromText == null && ramFromText == null) {
    // Too little signal — still return a conservative guess if they typed a number.
    const lone = raw.match(/\b(\d{1,3})\s*gb\b/i);
    if (!lone) return null;
  }

  return {
    gpu,
    vramGb,
    ramGb,
    cpu,
    os,
    unified,
    gpuCount: gpuHit || apple ? gpuCount : 0,
    source: "paste",
    raw: raw.slice(0, 4000),
  };
}

export function specsFromUnknown(data: Partial<Specs> & { raw?: string }): Specs {
  return {
    gpu: data.gpu || "unknown",
    vramGb: Number(data.vramGb) || 0,
    ramGb: Number(data.ramGb) || 16,
    cpu: data.cpu || "unknown",
    os: data.os || "unknown",
    unified: Boolean(data.unified),
    gpuCount: Number(data.gpuCount) || (data.vramGb ? 1 : 0),
    source: data.source || "paste",
    raw: data.raw,
  };
}
