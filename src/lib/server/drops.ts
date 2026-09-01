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

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "canirunthis/1.0",
  };
  const tok = typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
  if (tok && !tok.startsWith("your_")) h.Authorization = `Bearer ${tok}`;
  return h;
}

async function fetchGithub(): Promise<DropItem[]> {
  const queries = [
    "gguf stars:>20",
    "llama.cpp stars:>50",
    "topic:gguf",
    "open-weight stars:>10",
  ];
  const out: DropItem[] = [];
  const seen = new Set<string>();
  for (const raw of queries) {
    const q = encodeURIComponent(raw);
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${q}&sort=updated&order=desc&per_page=8`,
      { headers: ghHeaders() },
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

export const getRssFeedXml = createServerFn({ method: "GET" }).handler(async () => {
  const drops = await listDrops();
  const dateStr = new Date().toUTCString();

  const xmlItems = drops.slice(0, 25).map((d) => `
    <item>
      <title><![CDATA[${d.name} [${d.source.toUpperCase()}]]]></title>
      <link>${d.url}</link>
      <guid>${d.url}</guid>
      <pubDate>${new Date(d.when).toUTCString()}</pubDate>
      <description><![CDATA[${d.summary} · ${d.tags.join(", ")} · Likes: ${d.likes}${d.downloads ? ` · Downloads: ${d.downloads}` : ""}]]></description>
    </item>`).join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>What Can I Run? - Open-Weight Model Drops</title>
  <link>https://whatcanirun.dev/drops</link>
  <description>Live stream of new open-weight LLMs, GGUF quants, and llama.cpp releases.</description>
  <language>en-us</language>
  <lastBuildDate>${dateStr}</lastBuildDate>
  <atom:link href="https://whatcanirun.dev/drops/rss" rel="self" type="application/rss+xml" />
  ${xmlItems}
</channel>
</rss>`;
});

export const sendWebhookTest = createServerFn({ method: "POST" })
  .validator((d: { webhookUrl: string; vramTierGb?: number }) => d)
  .handler(async ({ data }) => {
    const { webhookUrl, vramTierGb } = data;
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return { ok: false, error: "Please enter a valid HTTP(S) Discord or Slack webhook URL." };
    }

    try {
      const payload = {
        content: `🚨 **[What Can I Run?] New Open-Weight Model Alert**`,
        embeds: [
          {
            title: "🔥 Qwen3.8-27B-GGUF (Unsloth)",
            url: "https://huggingface.co/unsloth/Qwen3.8-27B-GGUF",
            description: `A new high-demand GGUF drop was detected! Sized for your hardware filter (${vramTierGb ? `≤${vramTierGb} GB VRAM` : "All models"}).`,
            color: 5814783,
            fields: [
              { name: "Quant Formats", value: "Q4_K_M (17.2 GB), Q5_K_M (20.1 GB), Q8_0 (29.8 GB)", inline: true },
              { name: "Context Window", value: "256k tokens", inline: true },
              { name: "Compatibility", value: "Ollama, LM Studio, llama.cpp, vLLM", inline: false },
            ],
            footer: { text: "whatcanirun.dev · automated model drop alerts" },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return { ok: false, error: `Webhook returned HTTP ${res.status}. Verify webhook URL permissions.` };
      }

      return { ok: true, message: "Test alert successfully delivered to webhook!" };
    } catch {
      return { ok: false, error: "Failed to connect to webhook endpoint." };
    }
  });
