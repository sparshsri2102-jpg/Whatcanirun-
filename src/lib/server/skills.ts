import { createServerFn } from "@tanstack/react-start";
import { searchLocalSkills, type Skill, type MatchScoredSkill } from "@/lib/skills/catalog";
import { grokJson } from "./xai";

export type SkillHit = Skill & {
  origin: "catalog" | "github";
  matchReason?: string;
  matchScore?: number;
};

type GhRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
};

async function githubSearch(q: string): Promise<SkillHit[]> {
  try {
    const cleanQ = q.replace(/[^a-zA-Z0-9\s-]/g, " ").trim();
    if (!cleanQ) return [];

    const query = encodeURIComponent(
      `${cleanQ} (SKILL.md OR "agent skill" OR "claude skill" OR topic:claude-skills OR topic:agent-skills)`,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=8`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "canirunthis/1.0",
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!res.ok) return [];
    const json = (await res.json()) as { items?: GhRepo[] };
    return (json.items ?? []).map((r) => ({
      id: `gh:${r.full_name}`,
      name: r.full_name.split("/")[1] ?? r.full_name,
      repo: r.full_name,
      url: r.html_url,
      stars: r.stargazers_count,
      description: r.description || "GitHub open agent skill & workflow repository.",
      tags: ["github", "agent-skill"],
      role: "GitHub Skill",
      category: "engineering" as const,
      origin: "github" as const,
      matchReason: `GitHub live repository: ${r.full_name}`,
      matchScore: Math.round(50 + Math.log10(r.stargazers_count || 10) * 10),
    }));
  } catch {
    return [];
  }
}

export const searchSkills = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const query = (data?.query ?? "").trim().slice(0, 240);
    if (!query) {
      return searchLocalSkills("").map((s) => ({ ...s, origin: "catalog" as const }));
    }

    // 1. Local smart semantic & intent match
    const localHits = searchLocalSkills(query).map((s: MatchScoredSkill) => ({
      ...s,
      origin: "catalog" as const,
    }));

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
    return merged.slice(0, 20);
  });
