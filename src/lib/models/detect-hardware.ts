import type { Specs } from "./types";
import { parseSpecsHeuristic } from "./parse-specs";

export async function detectSystemHardware(): Promise<{
  specs: Specs;
  summary: string;
} | null> {
  if (typeof window === "undefined") return null;

  let gpuName = "";
  let _vendorName = "";
  let vramEstimateGb = 0;
  let isAppleSilicon = false;
  let isUnified = false;

  // 1. WebGPU detection (modern browsers)
  try {
    if ("gpu" in navigator && typeof navigator.gpu?.requestAdapter === "function") {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        // adapter.info may be available or requestAdapterInfo
        const info = (adapter as { info?: { architecture?: string; vendor?: string; description?: string; device?: string } }).info;
        if (info) {
          if (info.description) gpuName = info.description;
          else if (info.device) gpuName = `${info.vendor ?? ""} ${info.device}`.trim();
          if (info.vendor) _vendorName = info.vendor;
        }
      }
    }
  } catch {
    // WebGPU not permitted or unsupported
  }

  // 2. WebGL unmasked renderer fallback
  if (!gpuName) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          const unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          if (typeof unmaskedRenderer === "string") gpuName = unmaskedRenderer;
          if (typeof unmaskedVendor === "string") _vendorName = unmaskedVendor;
        }
        if (!gpuName) {
          const renderer = gl.getParameter(gl.RENDERER);
          if (typeof renderer === "string") gpuName = renderer;
        }
      }
    } catch {
      // WebGL not available
    }
  }

  // Detect OS & Platform
  const ua = navigator.userAgent.toLowerCase();
  let os = "Windows";
  if (ua.includes("mac") || ua.includes("darwin")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  // Check Apple Silicon
  if (os === "macOS") {
    // Apple GPU or Apple M series
    if (gpuName.toLowerCase().includes("apple") || !gpuName.toLowerCase().includes("intel")) {
      isAppleSilicon = true;
      isUnified = true;
    }
  }

  // Estimate System RAM
  // navigator.deviceMemory gives memory in GiB capped at 8 or 32 depending on browser security
  const deviceMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  let ramGb = deviceMem ? Math.max(deviceMem, 8) : 16;
  // If Chrome reports 8 on a modern desktop with >12 CPU cores, likely 16+ or 32
  const cores = navigator.hardwareConcurrency || 8;
  if (cores >= 16 && ramGb <= 8) {
    ramGb = 32;
  } else if (cores >= 12 && ramGb <= 8) {
    ramGb = 16;
  }

  // Clean up GPU Name & Extract known VRAM
  let cleanGpu = gpuName
    .replace(/^angle \(/i, "")
    .replace(/\)$/, "")
    .replace(/ direct3d.*$/i, "")
    .replace(/ vs_.*$/i, "")
    .replace(/,.*$/, "")
    .trim();

  if (!cleanGpu || cleanGpu.toLowerCase().includes("swiftshader") || cleanGpu.toLowerCase().includes("llvmpipe")) {
    cleanGpu = isAppleSilicon ? "Apple M-Series GPU" : "Generic Dedicated / Integrated GPU";
  }

  // Try parsing GPU specs heuristic to pull known card VRAM
  const heuristic = parseSpecsHeuristic(`${cleanGpu} ${ramGb}GB RAM ${os}`);
  if (heuristic && heuristic.vramGb > 0) {
    vramEstimateGb = heuristic.vramGb;
    if (heuristic.gpu) cleanGpu = heuristic.gpu;
    if (heuristic.unified) isUnified = true;
  } else if (isAppleSilicon) {
    vramEstimateGb = ramGb;
    isUnified = true;
    cleanGpu = cleanGpu.includes("Apple") ? cleanGpu : `Apple Silicon (${ramGb}GB Unified)`;
  } else {
    // Check known cards
    const gLower = cleanGpu.toLowerCase();
    if (gLower.includes("4090")) vramEstimateGb = 24;
    else if (gLower.includes("4080")) vramEstimateGb = 16;
    else if (gLower.includes("4070 ti super")) vramEstimateGb = 16;
    else if (gLower.includes("4070")) vramEstimateGb = 12;
    else if (gLower.includes("4060 ti")) vramEstimateGb = 16;
    else if (gLower.includes("4060")) vramEstimateGb = 8;
    else if (gLower.includes("3090")) vramEstimateGb = 24;
    else if (gLower.includes("3080 ti")) vramEstimateGb = 12;
    else if (gLower.includes("3080")) vramEstimateGb = 10;
    else if (gLower.includes("3070")) vramEstimateGb = 8;
    else if (gLower.includes("3060")) vramEstimateGb = 12;
    else if (gLower.includes("7900 xtx")) vramEstimateGb = 24;
    else if (gLower.includes("7900 xt")) vramEstimateGb = 20;
    else if (gLower.includes("7800 xt")) vramEstimateGb = 16;
    else if (gLower.includes("6800") || gLower.includes("6900")) vramEstimateGb = 16;
    else if (gLower.includes("intel arc a770")) vramEstimateGb = 16;
    else if (gLower.includes("intel arc a750")) vramEstimateGb = 8;
    else if (gLower.includes("radeon") || gLower.includes("geforce") || gLower.includes("rtx")) {
      vramEstimateGb = 8;
    } else {
      vramEstimateGb = Math.min(8, Math.floor(ramGb / 2));
    }
  }

  const specs: Specs = {
    gpu: cleanGpu,
    vramGb: isUnified ? ramGb : vramEstimateGb,
    ramGb,
    cpu: `${cores}-core CPU`,
    os,
    unified: isUnified,
    gpuCount: 1,
    source: "preset",
    raw: `Auto-detected: ${cleanGpu} | ${isUnified ? `${ramGb}GB Unified` : `${vramEstimateGb}GB VRAM`} | ${ramGb}GB RAM | ${os}`,
  };

  const summary = `${cleanGpu} · ${isUnified ? `${ramGb} GB unified` : `${vramEstimateGb} GB VRAM`} · ${ramGb} GB RAM`;

  return { specs, summary };
}
