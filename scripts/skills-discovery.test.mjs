/**
 * Unit tests for GitHub skill-discovery helpers (offline, no network).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FRESH_DAYS,
  buildSkillQueries,
  classifyRepo,
  freshCutoffISO,
  isFreshRepo,
  skillRelevanceBoost,
} from "../src/lib/skills/discovery.ts";

test("fresh window is 30 days and cutoff math holds", () => {
  assert.equal(FRESH_DAYS, 30);
  const now = Date.parse("2026-09-10T12:00:00Z");
  assert.equal(freshCutoffISO(now), "2026-08-11");
  assert.equal(isFreshRepo("2026-09-01T00:00:00Z", now), true);
  assert.equal(isFreshRepo("2026-08-11T00:00:00Z", now), true);
  assert.equal(isFreshRepo("2026-08-10T23:59:59Z", now), false);
  assert.equal(isFreshRepo(undefined, now), false);
});

test("query builder emits 4 bare-term streams (no paren-poisoned qualifiers)", () => {
  const qs = buildSkillQueries("sre incident", "2026-08-11");
  assert.equal(qs.length, 4);
  const raw = qs.map(decodeURIComponent).join(" | ");
  assert.match(raw, /topic:claude-skills/);
  assert.match(raw, /topic:agent-skills/);
  assert.match(raw, /SKILL\.md created:>2026-08-11/);
  // GitHub silently returns 0 hits for topic:/quoted terms inside parens.
  for (const q of qs.map(decodeURIComponent)) {
    assert.doesNotMatch(q, /\(.*(topic:|")/);
  }
  assert.deepEqual(buildSkillQueries("   ", "2026-08-11"), []);
  assert.deepEqual(buildSkillQueries("!!!", "2026-08-11"), []);
});

test("classifier routes repos to the right filter chip", () => {
  assert.equal(classifyRepo("acme/appsec-scanner", "OWASP scanner", []), "security");
  assert.equal(classifyRepo("acme/ui-kit", "tailwind components", []), "design");
  assert.equal(classifyRepo("acme/k8s-helper", "deploy tools", []), "devops");
  assert.equal(classifyRepo("acme/rag-pipe", "vector search", []), "data");
  assert.equal(classifyRepo("acme/seo-writer", "blog engine", []), "content");
  assert.equal(classifyRepo("acme/sprint-board", "roadmap planner", []), "product");
  assert.equal(classifyRepo("acme/cfo-models", "finance sheets", []), "leadership");
  assert.equal(classifyRepo("acme/some-tool", "does things", []), "engineering");
});

test("skill-signal boost favors real skill repos over generic stars", () => {
  const skillRepo = skillRelevanceBoost("acme/claude-skills", "agent skills collection", ["claude-skills"]);
  const generic = skillRelevanceBoost("acme/web-utils", "handy helpers", []);
  assert.ok(skillRepo >= 25);
  assert.equal(generic, 0);
  assert.ok(skillRepo > generic);
});
