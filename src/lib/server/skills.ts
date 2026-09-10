import { createServerFn } from "@tanstack/react-start";
import { searchLocalSkills, type Skill, type MatchScoredSkill } from "@/lib/skills/catalog";
import {
  FRESH_DAYS,
  classifyRepo,
  freshCutoffISO,
  isFreshRepo,
  skillRelevanceBoost,
  buildSkillQueries,
  type SkillCategory,
} from "@/lib/skills/discovery";
import { grokJson } from "./xai";

export type SkillHit = Skill & {
  origin: "catalog" | "github";
  matchReason?: string;
  matchScore?: number;
  /** True when the repo was created in the last 30 days (fresh drop). */
  fresh?: boolean;
  /** ISO date (YYYY-MM-DD) the repo was created, when known. */
  repoCreatedAt?: string;
};

type GhRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  created_at?: string;
  pushed_at?: string;
  topics?: string[];
};

function ghHeadersSkills(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "whatcanirun-skills/1.0",
  };
  const tok = typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
  if (tok && !tok.startsWith("your_")) h.Authorization = `Bearer ${tok}`;
  return h;
}

// In-memory cache for live GitHub repo stars with 1 hour TTL
const starCache = new Map<string, { stars: number; at: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchLiveRepoStars(repo: string, fallbackStars: number): Promise<number> {
  const cached = starCache.get(repo);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.stars;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: ghHeadersSkills(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as { stargazers_count?: number };
      if (typeof json.stargazers_count === "number" && json.stargazers_count > 0) {
        starCache.set(repo, { stars: json.stargazers_count, at: Date.now() });
        return json.stargazers_count;
      }
    }
  } catch {
    // Ignore error and use cached or fallback
  }

  return cached ? cached.stars : fallbackStars;
}

function toSkillHit(r: GhRepo): SkillHit {
  starCache.set(r.full_name, { stars: r.stargazers_count, at: Date.now() });
  const topics = r.topics ?? [];
  const fresh = isFreshRepo(r.created_at);
  const category = classifyRepo(r.full_name, r.description, topics);
  const boost = skillRelevanceBoost(r.full_name, r.description, topics);
  return {
    id: `gh:${r.full_name}`,
    name: r.full_name.split("/")[1] ?? r.full_name,
    repo: r.full_name,
    url: r.html_url,
    stars: r.stargazers_count,
    description: r.description || "GitHub open agent skill & workflow repository.",
    tags: ["github", "agent-skill", ...topics.slice(0, 4)],
    role: fresh ? "Fresh GitHub Skill" : "GitHub Skill",
    category,
    origin: "github" as const,
    fresh,
    repoCreatedAt: r.created_at?.slice(0, 10),
    matchReason: fresh
      ? `Fresh drop (<${FRESH_DAYS}d) · ${r.stargazers_count.toLocaleString()}★`
      : `GitHub live: ${r.stargazers_count.toLocaleString()}★`,
    matchScore: Math.round(50 + Math.log10(r.stargazers_count || 10) * 10 + boost + (fresh ? 15 : 0)),
  };
}

async function githubSearchRepos(query: string, perPage: number): Promise<GhRepo[]> {
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perPage}`,
    { headers: ghHeadersSkills() },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GhRepo[] };
  return json.items ?? [];
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([p.catch(() => fallback), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function githubSearch(q: string): Promise<SkillHit[]> {
  try {
    // NOTE: GitHub's search parser rejects topic: qualifiers and quoted
    // phrases inside parenthesized OR groups (they silently return 0 hits),
    // so every stream uses BARE terms only (see buildSkillQueries).
    // Verified 2026-09-10.
    const queries = buildSkillQueries(q, freshCutoffISO());
    if (queries.length === 0) return [];
    const [topicalA, topicalB, freshQ, broad] = queries;

    const [topicalAHits, topicalBHits, freshHits, broadHits] = await Promise.all([
      withTimeout(githubSearchRepos(topicalA, 5), 2500, []),
      withTimeout(githubSearchRepos(topicalB, 5), 2500, []),
      withTimeout(githubSearchRepos(freshQ, 6), 2500, []),
      withTimeout(githubSearchRepos(broad, 5), 2500, []),
    ]);

    const seen = new Set<string>();
    const out: SkillHit[] = [];
    // Fresh drops first (recency deserves visibility), then topical, then broad.
    for (const r of [...freshHits, ...topicalAHits, ...topicalBHits, ...broadHits]) {
      const key = r.full_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(toSkillHit(r));
    }
    return out;
  } catch {
    return [];
  }
}

export const searchSkills = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const query = (data?.query ?? "").trim().slice(0, 240);

    // 1. Local smart semantic & intent match
    const rawLocalHits = searchLocalSkills(query).map((s: MatchScoredSkill) => ({
      ...s,
      origin: "catalog" as const,
    }));

    // Enrich top local hits with live GitHub repo star count (in parallel with quick timeout)
    const localHits = await Promise.all(
      rawLocalHits.map(async (skill) => {
        const liveStars = await fetchLiveRepoStars(skill.repo, skill.stars);
        return {
          ...skill,
          stars: liveStars,
        };
      }),
    );

    if (!query) {
      localHits.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || b.stars - a.stars);
      return localHits;
    }

    // 2. Try xAI keyword expansion if available
    let searchKeywords = query;
    try {
      const ai = await grokJson<{ keywords: string }>({
        maxTokens: 100,
        prompt: `Convert this skill request into 2-4 GitHub repository search terms. Focus on role, engineering domain, and agent skills.
Request: ${query}
JSON: {"keywords":"..."}`,
      });
      if (ai.ok && ai.data?.keywords) {
        searchKeywords = ai.data.keywords;
      }
    } catch {
      // Ignore AI errors; continue with local + GitHub
    }

    // 3. Search GitHub with timeout
    const remote = await githubSearch(searchKeywords).catch(() => [] as SkillHit[]);

    // 4. Merge results without duplicates
    const seen = new Set<string>();
    const merged: SkillHit[] = [];

    // Prioritize high-scoring local catalog skills, then integrate top GitHub repos
    for (const s of [...localHits, ...remote]) {
      const key = s.repo.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(s);
    }

    // Sort by match score first, then stars
    merged.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || b.stars - a.stars);
    return merged.slice(0, 25);
  });
