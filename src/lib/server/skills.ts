import { createServerFn } from "@tanstack/react-start";
import { searchLocalSkills, type Skill } from "@/lib/skills/catalog";
import { grokJson } from "./xai";

export type SkillHit = Skill & { origin: "catalog" | "github" };

type GhRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
};

async function githubSearch(q: string): Promise<SkillHit[]> {
  const query = encodeURIComponent(
    `${q} (SKILL.md OR "claude skill" OR "agent skill" OR topic:claude-skills OR topic:agent-skills)`,
  );
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "canirunthis/1.0",
      },
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GhRepo[] };
  return (json.items ?? []).map((r) => ({
    id: `gh:${r.full_name}`,
    name: r.full_name.split("/")[1] ?? r.full_name,
    repo: r.full_name,
    url: r.html_url,
    stars: r.stargazers_count,
    description: r.description || "GitHub skill / agent pack.",
    tags: ["github"],
    role: "github",
    origin: "github" as const,
  }));
}

export const searchSkills = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const query = data.query.trim().slice(0, 240);
    if (!query) {
      return searchLocalSkills("").map((s) => ({ ...s, origin: "catalog" as const }));
    }

    let keywords = query;
    const ai = await grokJson<{ keywords: string }>({
      maxTokens: 120,
      prompt: `Turn this skill request into a short GitHub search string (3–7 keywords). Focus on role (CMO, SRE, PM), domain, and "claude skill" synonyms.
Request: ${query}
JSON: {"keywords":"..."}`,
    });
    if (ai.ok && ai.data.keywords) keywords = ai.data.keywords;

    const local = searchLocalSkills(`${query} ${keywords}`).map((s) => ({
      ...s,
      origin: "catalog" as const,
    }));

    const remote = await githubSearch(keywords).catch(() => [] as SkillHit[]);
    const seen = new Set<string>();
    const merged: SkillHit[] = [];
    for (const s of [...local, ...remote]) {
      const key = s.repo.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(s);
    }
    merged.sort((a, b) => b.stars - a.stars);
    return merged.slice(0, 16);
  });
