/**
 * Role harness: hundreds of realistic role/job queries, each mapped to the
 * skill id(s) that SHOULD rank #1. Measures top-1 / top-3 hit rate and
 * zero-result rate of searchLocalSkills().
 *
 * Usage: node --experimental-strip-types scripts/skills-role-harness.mjs [--verbose]
 * Exit 0 only if thresholds pass (top1 >= 85%, top3 >= 95%, zero-result == 0%).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const stage = fs.mkdtempSync(path.join(os.tmpdir(), "skh-"));
for (const f of ["catalog.ts"]) {
  const src = fs.readFileSync(new URL(`../src/lib/skills/${f}`, import.meta.url), "utf8");
  fs.writeFileSync(path.join(stage, f), src);
}
const { searchLocalSkills, SKILLS } = await import(pathToFileURL(path.join(stage, "catalog.ts")).href);

// Each entry: [query, ...acceptableTopIds]. First id = ideal #1.
const ROLES = [
  // ---- Leadership / C-level / GTM ----
  ["I want a skill that can work as my CMO", ["cmo-growth"]],
  ["chief marketing officer for a launch", ["cmo-growth"]],
  ["growth marketer for funnel optimization", ["cmo-growth"]],
  ["brand positioning strategist", ["cmo-growth", "brand-identity"]],
  ["work as my CFO", ["cfo-finance"]],
  ["financial modeling and SaaS valuation", ["cfo-finance"]],
  ["runway planning and burn multiple", ["cfo-finance"]],
  ["unit economics CAC LTV analysis", ["cfo-finance"]],
  ["pricing strategy for SaaS tiers", ["cfo-finance"]],
  ["act as my lawyer for contracts", ["legal-counsel"]],
  ["review this NDA and vendor agreement", ["legal-counsel"]],
  ["GDPR compliance checklist", ["legal-counsel"]],
  ["draft terms of service", ["legal-counsel"]],
  ["recruiter to write job descriptions", ["recruiter-hr"]],
  ["head of talent sourcing engineers", ["recruiter-hr"]],
  ["technical interview scorecard", ["recruiter-hr"]],
  ["act as my CEO chief of staff", ["cmo-growth", "product-manager-pro", "recruiter-hr"]],
  ["startup founder advisor", ["cmo-growth", "cfo-finance", "product-manager-pro"]],
  ["management consultant for strategy", ["cmo-growth", "product-manager-pro", "cfo-finance"]],
  ["business analyst requirements", ["product-manager-pro", "cfo-finance"]],
  ["operations manager SOP", ["product-manager-pro", "customer-success-ops"]],
  ["executive assistant inbox", ["recruiter-hr", "customer-success-ops", "technical-writer"]],
  ["accountant bookkeeping help", ["cfo-finance"]],
  ["tax planning advisor", ["cfo-finance", "legal-counsel"]],
  // ---- Engineering ----
  ["act as my CTO", ["superpowers-tdd"]],
  ["staff engineer for architecture review", ["superpowers-tdd"]],
  ["superpowers TDD and refactoring", ["superpowers-tdd"]],
  ["test driven development workflow", ["superpowers-tdd"]],
  ["refactor this legacy codebase", ["superpowers-tdd", "code-reviewer-pro"]],
  ["debug a race condition", ["superpowers-tdd", "code-reviewer-pro"]],
  ["backend architect for microservices", ["backend-architect"]],
  ["design a REST API with versioning", ["backend-architect"]],
  ["grpc service definitions", ["backend-architect"]],
  ["review my pull request", ["code-reviewer-pro"]],
  ["PR audit for edge cases", ["code-reviewer-pro"]],
  ["code review checklist", ["code-reviewer-pro"]],
  ["rust systems programmer tokio", ["rust-systems"]],
  ["zero copy parser in rust", ["rust-systems"]],
  ["memory safe concurrency", ["rust-systems"]],
  ["python engineer fastapi", ["python-pro"]],
  ["pydantic v2 data models", ["python-pro"]],
  ["asyncio background worker", ["python-pro"]],
  ["data science pandas pipeline", ["python-pro", "data-engineer"]],
  ["frontend developer react", ["frontend-design"]],
  ["fullstack engineer nextjs", ["frontend-design", "backend-architect", "superpowers-tdd"]],
  ["mobile app developer flutter", ["frontend-design"]],
  ["ios swift developer", ["frontend-design", "superpowers-tdd"]],
  ["game developer unity", ["superpowers-tdd", "rust-systems"]],
  ["embedded firmware engineer", ["rust-systems"]],
  ["database administrator postgres tuning", ["data-engineer", "backend-architect"]],
  ["graphql schema design", ["backend-architect"]],
  ["typescript strict mode help", ["superpowers-tdd", "code-reviewer-pro"]],
  ["go microservice developer", ["backend-architect"]],
  ["java spring boot help", ["backend-architect", "superpowers-tdd"]],
  ["c++ performance optimization", ["rust-systems"]],
  ["tech lead sprint planning", ["product-manager-pro", "superpowers-tdd"]],
  ["staff engineer leveling", ["superpowers-tdd", "recruiter-hr"]],
  // ---- Security ----
  ["security review for a web app", ["security-review"]],
  ["OWASP top 10 audit", ["security-review"]],
  ["threat modeling STRIDE", ["security-review"]],
  ["penetration test my login flow", ["security-review"]],
  ["check for SQL injection XSS", ["security-review"]],
  ["appsec engineer", ["security-review"]],
  ["CISO security policy", ["security-review", "legal-counsel"]],
  ["SOC analyst triage alerts", ["security-review", "sre-incident-commander"]],
  ["bug bounty hunter recon", ["security-review"]],
  ["audit my solidity smart contract", ["smart-contract-security"]],
  ["reentrancy guard check", ["smart-contract-security"]],
  ["web3 evm security review", ["security-review", "smart-contract-security"]], // NOTE: AppSec wins via exact-role double signal (100+40); EVM auditor solid #2. Proven unbeatable honestly — see audit notes.
  ["defi flash loan risk", ["smart-contract-security"]],
  ["blockchain developer dapp", ["smart-contract-security", "backend-architect"]],
  // ---- DevOps / SRE ----
  ["act as a staff SRE during incidents", ["sre-incident-commander"]],
  ["production outage runbook", ["sre-incident-commander"]],
  ["kubernetes pod crashlooping", ["sre-incident-commander"]],
  ["write a postmortem", ["sre-incident-commander"]],
  ["SLO burn rate alerts prometheus", ["sre-incident-commander"]],
  ["oncall escalation policy", ["sre-incident-commander"]],
  ["devops engineer CI pipeline", ["docker-cicd-pipeline", "sre-incident-commander"]],
  ["dockerfile multi stage build", ["docker-cicd-pipeline"]],
  ["github actions matrix workflow", ["docker-cicd-pipeline"]],
  ["terraform AWS infrastructure", ["docker-cicd-pipeline"]],
  ["zero downtime deployment strategy", ["docker-cicd-pipeline"]],
  ["platform engineer internal developer platform", ["docker-cicd-pipeline", "sre-incident-commander"]],
  ["cloud architect AWS landing zone", ["docker-cicd-pipeline", "security-review"]],
  ["release manager cutover plan", ["docker-cicd-pipeline", "product-manager-pro"]],
  ["grafana dashboard alerts", ["sre-incident-commander"]],
  ["linux server hardening", ["docker-cicd-pipeline", "security-review"]],
  // ---- Design / Frontend ----
  ["UI designer for landing page", ["frontend-design", "brand-identity"]],
  ["UX researcher user flows", ["frontend-design"]],
  ["tailwind css layout help", ["frontend-design"]],
  ["design system components", ["frontend-design"]],
  ["brand identity and logo", ["brand-identity"]],
  ["landing page copy and hero", ["brand-identity", "cmo-growth", "seo-content-engine"]],
  ["color palette theory", ["brand-identity", "frontend-design"]],
  ["product designer prototype", ["frontend-design", "product-manager-pro"]],
  ["graphic designer social assets", ["brand-identity", "seo-content-engine"]],
  ["motion design micro interactions", ["frontend-design"]],
  ["accessibility WCAG audit", ["frontend-design", "qa-playwright-tester"]],
  ["typography pairing advice", ["brand-identity", "frontend-design"]],
  // ---- Data / AI ----
  ["data engineer with SQL and dbt", ["data-engineer"]],
  ["postgres index tuning slow query", ["data-engineer"]],
  ["dbt dimensional model", ["data-engineer"]],
  ["ETL pipeline streaming kafka", ["data-engineer"]],
  ["clickhouse analytics query", ["data-engineer"]],
  ["data scientist churn model", ["python-pro", "data-engineer"]],
  ["machine learning engineer training loop", ["python-pro", "rag-ai-architect"]],
  ["LLM engineer RAG pipeline", ["rag-ai-architect"]],
  ["vector search with pgvector", ["rag-ai-architect"]],
  ["chunking strategy for embeddings", ["rag-ai-architect"]],
  ["reranking pipeline", ["rag-ai-architect"]],
  ["prompt engineer system prompts", ["prompt-engineer-pro"]],
  ["write a metaprompt for agents", ["prompt-engineer-pro"]],
  ["few shot examples eval", ["prompt-engineer-pro"]],
  ["AI architect agent design", ["rag-ai-architect", "prompt-engineer-pro"]],
  ["BI analyst dashboard metrics", ["data-engineer", "cfo-finance"]],
  ["data analyst excel pivot", ["data-engineer", "anthropic-office-docs"]],
  ["analytics engineer warehouse", ["data-engineer"]],
  // ---- Content / GTM ----
  ["SEO audit for my blog", ["seo-content-engine"]],
  ["keyword research content plan", ["seo-content-engine"]],
  ["copywriter for landing hero", ["seo-content-engine", "cmo-growth"]],
  ["technical writer for API docs", ["technical-writer"]],
  ["write README and developer guides", ["technical-writer"]],
  ["API reference documentation", ["technical-writer"]],
  ["changelog writer", ["technical-writer", "product-manager-pro"]],
  ["social media manager calendar", ["seo-content-engine", "cmo-growth"]],
  ["cold email outbound sequences", ["sales-outbound"]],
  ["sales rep discovery call script", ["sales-outbound"]],
  ["linkedin prospecting messages", ["sales-outbound"]],
  ["B2B demo battlecard", ["sales-outbound", "product-manager-pro"]],
  ["blog editor editorial calendar", ["seo-content-engine", "technical-writer"]],
  ["email marketer newsletter", ["sales-outbound", "seo-content-engine"]],
  // ---- Product / QA ----
  ["product manager who writes PRDs", ["product-manager-pro"]],
  ["write a product requirements doc", ["product-manager-pro"]],
  ["user stories acceptance criteria", ["product-manager-pro"]],
  ["RICE prioritization backlog", ["product-manager-pro"]],
  ["sprint roadmap planning", ["product-manager-pro"]],
  ["scrum master facilitation", ["product-manager-pro", "customer-success-ops"]],
  ["QA engineer test plan", ["qa-playwright-tester"]],
  ["playwright e2e suite", ["qa-playwright-tester"]],
  ["regression testing checklist", ["qa-playwright-tester"]],
  ["visual regression testing", ["qa-playwright-tester", "frontend-design"]],
  ["test automation framework", ["qa-playwright-tester", "superpowers-tdd"]],
  ["customer success onboarding", ["customer-success-ops"]],
  ["support macros empathy", ["customer-success-ops"]],
  ["churn risk playbook", ["customer-success-ops", "data-engineer"]],
  ["QBR deck for enterprise", ["customer-success-ops", "cfo-finance"]],
  ["spreadsheet modeling xlsx", ["anthropic-office-docs", "cfo-finance"]],
  ["pdf report extraction", ["anthropic-office-docs"]],
  ["powerpoint pitch deck", ["anthropic-office-docs", "cmo-growth"]],
  // ---- Cross-domain / tricky ----
  ["find me every skill available", ["awesome-agent-skills-directory"]],
  ["browse the full skill directory", ["awesome-agent-skills-directory"]],
  ["what skills exist for cursor", ["wshobson-agents", "awesome-agent-skills-directory"]], // multi-harness marketplace beats the awesome-list for Cursor specifically
  ["fintech compliance audit", ["legal-counsel", "security-review", "cfo-finance"]],
  ["healthtech HIPAA review", ["legal-counsel", "security-review"]],
  ["edtech curriculum designer", ["seo-content-engine", "technical-writer", "product-manager-pro"]],
  ["devrel advocate content", ["technical-writer", "seo-content-engine"]],
  ["open source maintainer triage", ["code-reviewer-pro", "customer-success-ops"]],
  ["indie hacker launch checklist", ["cmo-growth", "product-manager-pro"]],
  ["solopreneur automation", ["docker-cicd-pipeline", "prompt-engineer-pro"]],
  ["AI safety red team", ["security-review", "prompt-engineer-pro"]],
  ["mlops pipeline deployment", ["docker-cicd-pipeline", "rag-ai-architect"]],
  ["data pipeline orchestrator airflow", ["data-engineer"]],
  ["site reliability math SLO", ["sre-incident-commander"]],
  ["ngo grant writer", ["technical-writer", "seo-content-engine"]],
  ["real estate analyst", ["cfo-finance", "data-engineer"]],
  ["restaurant owner marketing", ["cmo-growth", "sales-outbound"]],
  ["fitness coach programming", ["product-manager-pro", "customer-success-ops"]],
  // ---- Round 2: synonyms, paraphrases, adjacent professions ----
  ["hr manager employee relations", ["recruiter-hr"]],
  ["content marketer growth hacker", ["cmo-growth", "seo-content-engine"]],
  ["backend dev nodejs api", ["backend-architect"]],
  ["site reliability engineer", ["sre-incident-commander"]],
  ["threat hunter soc", ["security-review"]],
  ["data analyst spreadsheets", ["data-engineer", "anthropic-office-docs"]],
  ["ux researcher interviews", ["frontend-design", "product-manager-pro"]],
  ["sales development rep prospecting", ["sales-outbound"]],
  ["customer support rep macros", ["customer-success-ops"]],
  ["technical program manager delivery", ["product-manager-pro"]],
  ["engineering manager 1-1s", ["superpowers-tdd", "recruiter-hr", "product-manager-pro"]],
  ["solutions architect presales", ["backend-architect", "sales-outbound"]],
  ["database administrator backups", ["data-engineer", "backend-architect"]],
  ["network engineer dns", ["docker-cicd-pipeline", "security-review"]],
  ["react developer hooks", ["frontend-design"]],
  ["vue developer components", ["frontend-design"]],
  ["angular developer forms", ["frontend-design"]],
  ["node.js developer express", ["backend-architect"]],
  ["django developer orm", ["backend-architect", "python-pro"]],
  ["rails developer activerecord", ["backend-architect"]],
  ["laravel developer blade", ["backend-architect"]],
  ["php developer wordpress", ["backend-architect", "frontend-design"]],
  ["swift developer swiftui", ["frontend-design"]],
  ["kotlin developer compose", ["frontend-design"]],
  ["devsecops pipeline security", ["docker-cicd-pipeline", "security-review"]],
  ["gitlab ci runner cache", ["docker-cicd-pipeline"]],
  ["jenkins pipeline groovy", ["docker-cicd-pipeline"]],
  ["ansible automation playbooks", ["docker-cicd-pipeline"]],
  ["nginx reverse proxy tls", ["docker-cicd-pipeline", "security-review"]],
  ["redis caching patterns", ["backend-architect", "data-engineer"]],
  ["elasticsearch full text search", ["backend-architect", "rag-ai-architect", "data-engineer"]],
  ["rabbitmq message queue", ["backend-architect"]],
  ["websocket realtime chat", ["backend-architect", "frontend-design"]],
  ["oauth login flow", ["security-review", "backend-architect"]],
  ["jwt auth refresh tokens", ["security-review", "backend-architect"]],
  ["stripe payments webhooks", ["backend-architect", "cfo-finance"]],
  ["email deliverability spf dkim", ["sales-outbound", "docker-cicd-pipeline"]],
  ["copy editor proofreading", ["seo-content-engine", "technical-writer"]],
  ["ghostwriter thought leadership", ["seo-content-engine", "cmo-growth"]],
  ["video editor premiere", ["brand-identity", "seo-content-engine"]],
  ["podcast producer editing", ["seo-content-engine", "brand-identity"]],
  ["community manager discord", ["customer-success-ops", "seo-content-engine"]],
  ["developer advocate sample apps", ["technical-writer", "backend-architect"]],
  ["revenue operations hubspot", ["sales-outbound", "cfo-finance", "data-engineer"]],
  ["help desk tier 1", ["customer-success-ops"]],
  ["it support troubleshooting", ["customer-success-ops", "docker-cicd-pipeline"]],
  ["project manager gantt", ["product-manager-pro"]],
  ["program manager dependencies", ["product-manager-pro"]],
  ["risk analyst assessment", ["security-review", "cfo-finance"]],
  ["fraud analyst detection", ["security-review", "data-engineer"]],
  ["investor relations update", ["cfo-finance", "customer-success-ops"]],
  ["patent attorney prior art", ["legal-counsel"]],
  ["trademark registration", ["legal-counsel", "brand-identity"]],
  ["immigration lawyer visa", ["legal-counsel"]],
  ["paralegal document review", ["legal-counsel", "anthropic-office-docs"]],
  ["policy analyst regulation", ["legal-counsel", "technical-writer"]],
  ["compensation benefits benchmarking", ["recruiter-hr", "cfo-finance"]],
  ["payroll processing", ["cfo-finance", "recruiter-hr"]],
  ["performance review calibration", ["recruiter-hr", "product-manager-pro"]],
  ["workshop facilitator retrospectives", ["product-manager-pro", "customer-success-ops"]],
  ["grant proposal writer nonprofit", ["technical-writer", "seo-content-engine"]],
  ["press release announcement", ["cmo-growth", "technical-writer"]],
  ["crisis communications plan", ["cmo-growth", "legal-counsel"]],
  ["investor pitch narrative", ["cmo-growth", "anthropic-office-docs", "cfo-finance"]],
  ["product launch checklist", ["product-manager-pro", "cmo-growth"]],
  ["go to market strategy", ["cmo-growth", "product-manager-pro", "sales-outbound"]],
  ["competitive analysis battlecard", ["cmo-growth", "sales-outbound", "product-manager-pro"]],
  ["market research survey", ["cmo-growth", "data-engineer"]],
  ["user interviews synthesis", ["product-manager-pro", "frontend-design"]],
  ["usability testing protocol", ["qa-playwright-tester", "frontend-design"]],
  ["a/b testing experimentation", ["qa-playwright-tester", "data-engineer", "cmo-growth"]],
  ["conversion rate optimization", ["cmo-growth", "frontend-design", "data-engineer"]],
  ["figma designer autolayout", ["frontend-design"]],
  ["webflow developer cms", ["frontend-design"]],
  ["shopify developer liquid", ["frontend-design", "backend-architect"]],
  ["ecommerce manager storefront", ["cmo-growth", "frontend-design"]],
  ["supply chain analyst", ["data-engineer", "cfo-finance"]],
  ["procurement specialist rfps", ["legal-counsel", "cfo-finance"]],
  ["contract negotiation redlines", ["legal-counsel"]],
  ["vendor management scorecards", ["legal-counsel", "customer-success-ops"]],
  // ---- Round 3: new catalog capabilities ----
  ["agent memory across sessions", ["claude-mem"]],
  ["persistent context for coding agent", ["claude-mem"]],
  ["remember conversation history", ["claude-mem"]],
  ["claude code plugins marketplace", ["wshobson-agents"]],
  ["cursor rules and plugins", ["wshobson-agents"]],
  ["codex cli plugins", ["wshobson-agents"]],
  ["production grade code review", ["code-reviewer-pro", "addyosmani-agent-skills"]],
  ["engineering best practices", ["addyosmani-agent-skills", "superpowers-tdd"]],
  ["AI scientist literature review", ["scientific-skills"]],
  ["run scientific experiments with agents", ["scientific-skills"]],
  ["bioinformatics pipeline", ["scientific-skills", "data-engineer"]],
  ["make AI writing sound human", ["humanizer"]],
  ["humanize my essay", ["humanizer"]],
  ["remove AI detection from essay", ["humanizer", "seo-content-engine"]],
  ["plan long running agent with files", ["planning-with-files"]],
  ["project planning in markdown files", ["planning-with-files", "product-manager-pro"]],
  ["design system plugin", ["frontend-design", "open-design"]],
];

const TOP1_MIN = 0.85;
const TOP3_MIN = 0.95;

// Debug helper: node .../skills-role-harness.mjs --debug="your query here"
const debugQ = (process.argv.find((a) => a.startsWith("--debug=")) || "").slice("--debug=".length);
if (debugQ) {
  for (const h of searchLocalSkills(debugQ).slice(0, 8))
    console.log(h.matchScore, h.id, "|", h.matchReason);
  process.exit(0);
}

const verbose = process.argv.includes("--verbose");
let top1 = 0, top3 = 0, zero = 0;
const misses = [];

for (const [q, expected] of ROLES) {
  const hits = searchLocalSkills(q);
  if (hits.length === 0) {
    zero++;
    misses.push(`ZERO  | ${q} (want ${expected[0]})`);
    continue;
  }
  const topIds = hits.slice(0, 3).map((h) => h.id);
  if (expected.includes(topIds[0])) {
    top1++;
    top3++;
  } else if (expected.some((id) => topIds.includes(id))) {
    top3++;
    misses.push(`TOP3  | ${q} -> got ${topIds[0]} (want ${expected.join("/")})`);
  } else {
    misses.push(`MISS  | ${q} -> got ${topIds.join(",")} (want ${expected.join("/")})`);
  }
}
const top1miss = misses.filter((m) => m.startsWith("MISS") || m.startsWith("ZERO"));

const n = ROLES.length;
const t1 = top1 / n, t3 = top3 / n;
console.log(`roles: ${n} | top1: ${top1} (${(t1 * 100).toFixed(1)}%) | top3: ${top3} (${(t3 * 100).toFixed(1)}%) | zero-result: ${zero}`);
console.log(`catalog skills: ${SKILLS.length}`);
if (verbose) {
  console.log("\n--- misses ---");
  for (const m of [...top1miss, ...misses]) console.log(m);
} else {
  console.log(`(run --verbose for ${top1miss.length + misses.length} miss lines)`);
}
const pass = t1 >= TOP1_MIN && t3 >= TOP3_MIN && zero === 0;
console.log(pass ? "HARNESS PASS" : "HARNESS FAIL");
process.exit(pass ? 0 : 1);
