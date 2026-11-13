export type ModelTask =
  | "chat"
  | "code"
  | "reason"
  | "vision"
  | "image"
  | "video"
  | "audio"
  | "embed"
  | "agent";

export type QuantName = "IQ2" | "Q3" | "Q4" | "Q5" | "Q8" | "FP8" | "FP16";

export type KvQuant = "fp16" | "q8_0" | "q4_0";

export type Quant = {
  name: QuantName;
  vramGb: number;
  quality: number;
};

export type Model = {
  id: string;
  name: string;
  org: string;
  params: string;
  paramsB: number;
  totalParamsB?: number;
  moe: boolean;
  architecture?: string;
  isNew?: boolean;
  license: string;
  contextK: number;
  tasks: ModelTask[];
  summary: string;
  released: string;
  hf: string;
  gguf?: string;
  ollama?: string;
  quants: Quant[];
  run: {
    ollama?: string;
    lmstudio?: string;
    llamacpp?: string;
    mlx?: string;
  };
  notes?: string;
  quality: number;
};

export type Specs = {
  gpu: string;
  vramGb: number;
  ramGb: number;
  cpu: string;
  os: string;
  unified: boolean;
  gpuCount: number;
  source: "paste" | "screenshot" | "preset";
  raw?: string;
};

export type FitKind = "gpu" | "hybrid" | "cpu" | "no";

export type RunnerType = "ollama" | "lmstudio" | "llamacpp" | "vllm" | "mlx" | "jan";

export type QuantOption = {
  quant: Quant;
  fit: FitKind;
  headroomGb: number;
  speed: string;
  totalNeededGb: number;
  maxSafeContextK?: number;
  tokPerSec?: string;
  tokPerSecMin?: number;
  tokPerSecMax?: number;
  prefillTokS?: number;
  ttftMs?: number;
  bandwidthGbS?: number;
  busType?: string;
};

export type ModelFit = {
  model: Model;
  quant: Quant;
  fit: FitKind;
  headroomGb: number;
  score: number;
  why: string;
  speed: string;
  tokPerSec?: string;
  tokPerSecMin?: number;
  tokPerSecMax?: number;
  prefillTokS?: number;
  ttftMs?: number;
  bandwidthGbS?: number;
  busType?: string;
  weightsGb?: number;
  kvCacheGb?: number;
  totalNeededGb?: number;
  maxSafeContextK?: number;
  cloudFallback?: {
    name: string;
    vramGb: number;
    hourlyUsd: number;
    providerHint: string;
  } | null;
  kvQuant?: KvQuant;
  quantOptions?: QuantOption[];
};

export type MatchResult = {
  specs: Specs;
  picks: ModelFit[];
  also: ModelFit[];
  blurb: string;
  contextK?: number;
  kvQuant?: KvQuant;
  batchSize?: number;
  effectivePoolGb?: number;
  hybridPoolGb?: number;
};
