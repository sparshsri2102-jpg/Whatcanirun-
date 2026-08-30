import { createServerFn } from "@tanstack/react-start";
import { matchModels } from "@/lib/models/match";
import { parseSpecsHeuristic, specsFromUnknown } from "@/lib/models/parse-specs";
import type { MatchResult, ModelTask, Specs } from "@/lib/models/types";
import { grokJson } from "./xai";

type MatchInput = {
  text?: string;
  imageDataUrl?: string;
  prefer?: ModelTask;
  presetSpecs?: Specs;
  contextK?: number;
};

type Parsed = {
  gpu: string;
  vramGb: number;
  ramGb: number;
  cpu: string;
  os: string;
  unified: boolean;
  gpuCount: number;
};

export const matchHardware = createServerFn({ method: "POST" })
  .validator((input: MatchInput) => input)
  .handler(async ({ data }): Promise<MatchResult | { error: string }> => {
    if (data.presetSpecs) {
      return matchModels(data.presetSpecs, data.prefer, data.contextK ?? 8);
    }

    const text = (data.text ?? "").slice(0, 8000);
    const image = data.imageDataUrl?.startsWith("data:image/")
      ? data.imageDataUrl.slice(0, 900_000)
      : undefined;

    if (!text && !image) {
      return { error: "Paste specs or drop a screenshot first." };
    }

    let specs: Specs | null = text ? parseSpecsHeuristic(text) : null;

    const ai = await grokJson<Parsed>({
      maxTokens: 400,
      imageDataUrl: image,
      prompt: `Extract PC / Mac hardware for local LLM VRAM matching.
Return JSON:
{"gpu":string,"vramGb":number,"ramGb":number,"cpu":string,"os":string,"unified":boolean,"gpuCount":number}
Rules:
- unified=true for Apple Silicon (M1–M5). Then vramGb = ramGb = total unified memory.
- vramGb is dedicated GPU memory in GB. 0 if none.
- If a GPU name implies VRAM (RTX 4090=24, 4070=12, 3060=12, 5090=32) and VRAM is missing, fill it.
- gpuCount is number of discrete GPUs, 0 if none.
- Ignore monitors, disks, and peripherals.
${text ? `SPECS TEXT:\n${text}` : "Read the screenshot of Task Manager / About This Mac / dxdiag / neofetch / GPU-Z."}`,
    });

    if (ai.ok) {
      specs = specsFromUnknown({
        ...ai.data,
        source: image ? "screenshot" : "paste",
        raw: text,
      });
    }

    if (!specs) {
      return {
        error:
          "Could not read those specs. Name the GPU and RAM, e.g. “RTX 4070 12GB, 32GB RAM”.",
      };
    }

    const result = matchModels(specs, data.prefer, data.contextK ?? 8);
    return result;
  });
