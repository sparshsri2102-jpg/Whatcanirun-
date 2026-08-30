import { createServerFn } from "@tanstack/react-start";

export type DropItem = {
  id: string;
  name: string;
  source: "huggingface" | "github";
  url: string;
  likes: number;
  downloads?: number;
  stars?: number;
  when: string;
  tags: string[];
  summary: string;
};

type Cache = { at: number; items: DropItem[] };
let cache: Cache | null = null;
const TTL = 120_000;

const KNOWN = [
  "qwen/",
  "meta-llama/",
  "google/",
  "mistralai/",
  "zai-org/",
  "deepseek-ai/",
  "unsloth/",
  "ggml-org/",
  "microsoft/",
  "nvidia/",
  "tencent/",
  "openai/",
  "black-forest-labs/",
  "stabilityai/",
  "huggingface/",
  "ibm-granite/",
  "allenai/",
  "openbmb/",
  "opengvlab/",
  "coherelabs/",
];

type HfModel = {
  id: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  pipeline_tag?: string;
  tags?: string[];
};

async function fetchHf(url: string): Promise<HfModel[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as HfModel[];
  return Array.isArray(json) ? json : [];
}

async function fetchGithub(): Promise<DropItem[]> {
  const queries = [
    "gguf stars:>20",
    "llama.cpp stars:>50",
    "topic:gguf",
  ];
  const out: DropItem[] = [];
  const seen = new Set<string>();
  for (const raw of queries) {
    const q = encodeURIComponent(raw);
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${q}&sort=updated&order=desc&per_page=8`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "canirunthis/1.0",
        },
      },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as {
      items?: Array<{
        full_name: string;
        html_url: string;
        description: string | null;
        stargazers_count: number;
        updated_at: string;
        topics?: string[];
      }>;
    };
    for (const r of json.items ?? []) {
      if (seen.has(r.full_name)) continue;
      seen.add(r.full_name);
      out.push({
        id: `gh:${r.full_name}`,
        name: r.full_name,
        source: "github",
        url: r.html_url,
        likes: r.stargazers_count,
        stars: r.stargazers_count,
        when: r.updated_at,
        tags: r.topics ?? [],
        summary: r.description || "Open-weight related repository.",
      });
    }
  }
  out.sort((a, b) => +new Date(b.when) - +new Date(a.when));
  return out;
}

function notable(m: HfModel): boolean {
  const id = (m.id ?? "").toLowerCase();
  if (KNOWN.some((k) => id.startsWith(k))) return true;
  const likes = m.likes ?? 0;
  const downloads = m.downloads ?? 0;
  return likes >= 20 || downloads >= 500;
}

export const listDrops = createServerFn({ method: "GET" }).handler(async () => {
  if (cache && Date.now() - cache.at < TTL) return cache.items;

  const [trending, recent, gguf, github] = await Promise.all([
    fetchHf(
      "https://huggingface.co/api/models?sort=likes&limit=24&pipeline_tag=text-generation",
    ),
    fetchHf(
      "https://huggingface.co/api/models?sort=lastModified&limit=40&pipeline_tag=text-generation",
    ),
    fetchHf("https://huggingface.co/api/models?sort=lastModified&limit=24&filter=gguf"),
    fetchGithub().catch(() => [] as DropItem[]),
  ]);

  const seen = new Set<string>();
  const hfItems: DropItem[] = [];
  for (const m of [...trending, ...recent, ...gguf]) {
    if (!m.id || seen.has(m.id) || !notable(m)) continue;
    seen.add(m.id);
    hfItems.push({
      id: `hf:${m.id}`,
      name: m.id,
      source: "huggingface",
      url: `https://huggingface.co/${m.id}`,
      likes: m.likes ?? 0,
      downloads: m.downloads ?? 0,
      when: m.lastModified ?? new Date().toISOString(),
      tags: (m.tags ?? []).slice(0, 6),
      summary: m.pipeline_tag || "model",
    });
  }

  hfItems.sort((a, b) => +new Date(b.when) - +new Date(a.when));
  const items = [...hfItems.slice(0, 28), ...github.slice(0, 10)];
  cache = { at: Date.now(), items };
  return items;
});
