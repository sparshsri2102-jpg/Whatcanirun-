/**
 * Pure GitHub skill-discovery helpers (no imports — safe for node tests).
 *
 * Covers: fresh-drop recency window, repo category classification,
 * skill-relevance ranking boost, and search query construction.
 */

export type SkillCategory =
  | "leadership"
  | "engineering"
  | "security"
  | "devops"
  | "design"
  | "data"
  | "content"
  | "product";

/** Recency window for the "fresh drop" radar. */
export const FRESH_DAYS = 30;

export function freshCutoffISO(now: number = Date.now()): string {
  return new Date(now - FRESH_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isFreshRepo(createdAt: string | undefined, now: number = Date.now()): boolean {
  if (!createdAt) return false;
  return createdAt.slice(0, 10) >= freshCutoffISO(now);
}

const CATEGORY_SIGNALS: Array<[SkillCategory, RegExp]> = [
  ["security", /secur|owasp|pentest|vuln|exploit|audit|threat|crypto|solidity|hack/i],
  ["design", /design|ui\b|ux\b|frontend|tailwind|css|figma|brand/i],
  ["devops", /devops|sre|kubernet|docker|terraform|ci\/?cd|deploy|incident|platform/i],
  ["data", /data|rag|vector|embed|llm|ml\b|ai\b|memory|scientist|research/i],
  ["content", /writ|copy|seo|blog|content|market|cmo|humaniz/i],
  ["product", /product|pm\b|plan|roadmap|agile|scrum|test|qa\b/i],
  ["leadership", /cfo|finance|legal|cmo|ceo|cto|hire|recruit|sales/i],
];

/** Classify a live GitHub repo into a catalog category for filter chips. */
export function classifyRepo(name: string, description: string | null, topics: string[] = []): SkillCategory {
  const text = `${name} ${description ?? ""} ${topics.join(" ")}`;
  for (const [cat, re] of CATEGORY_SIGNALS) {
    if (re.test(text)) return cat;
  }
  return "engineering";
}

const SKILL_SIGNAL_SOURCE = "skill\\.md|agent.?skill|claude.?skill|claude.?code|harness|plugin|marketplace|subagent|slash.?command|awesome";

/** +25 for the first skill signal, +5 per extra (capped): skill repos win ties. */
export function skillRelevanceBoost(name: string, description: string | null, topics: string[] = []): number {
  const text = `${name} ${description ?? ""} ${topics.join(" ")}`;
  const hits = text.match(new RegExp(SKILL_SIGNAL_SOURCE, "gi")) ?? [];
  return hits.length > 0 ? 25 + Math.min(15, (hits.length - 1) * 5) : 0;
}

/**
 * Build the 4 GitHub search streams as encoded query strings.
 * IMPORTANT: bare terms only — GitHub's parser silently returns 0 hits for
 * topic: qualifiers or quoted phrases inside parenthesized OR groups.
 * Verified 2026-09-10.
 */
export function buildSkillQueries(q: string, cutoffISO: string): string[] {
  const cleanQ = q.replace(/[^a-zA-Z0-9\s-]/g, " ").trim();
  if (!cleanQ) return [];
  return [
    `${cleanQ} topic:claude-skills`,
    `${cleanQ} topic:agent-skills`,
    `${cleanQ} SKILL.md created:>${cutoffISO}`,
    `${cleanQ} SKILL.md`,
  ].map(encodeURIComponent);
}
