export type Skill = {
  id: string;
  name: string;
  repo: string;
  url: string;
  stars: number;
  description: string;
  tags: string[];
  role: string;
  category: "leadership" | "engineering" | "security" | "devops" | "design" | "data" | "content" | "product";
};

export const SKILLS: Skill[] = [
  // Executive & Leadership
  {
    id: "cmo-growth",
    name: "CMO / Growth Operator",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "C-level advisory pack: marketing strategy, brand positioning, funnel optimization, launch campaigns, viral hooks, and SEO playbooks.",
    tags: ["cmo", "marketing", "growth", "brand", "copy", "campaigns", "seo", "positioning", "gtm", "funnel"],
    role: "CMO",
    category: "leadership",
  },
  {
    id: "cfo-finance",
    name: "CFO / Finance & Valuation Ops",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "Financial modeling, SaaS unit economics (CAC/LTV/Payback), runway projections, board deck summaries, cap table planning, and pricing models.",
    tags: ["cfo", "finance", "runway", "pricing", "valuation", "economics", "accounting", "burn", "budget", "money"],
    role: "CFO",
    category: "leadership",
  },
  {
    id: "legal-counsel",
    name: "General Counsel & Compliance",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "Contract redlines, SaaS terms of service, open-source license audit, privacy checklists (GDPR/CCPA), and vendor agreement review.",
    tags: ["legal", "contracts", "license", "privacy", "counsel", "lawyer", "gdpr", "tos", "compliance", "nda"],
    role: "Counsel",
    category: "leadership",
  },
  {
    id: "recruiter-hr",
    name: "Head of Talent & Recruiting",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "Job description architecture, candidate scorecards, technical interview question rubrics, outbound candidate outreach, and debrief frameworks.",
    tags: ["hiring", "recruiter", "interview", "hr", "talent", "headcount", "sourcing", "jobs"],
    role: "Recruiter",
    category: "leadership",
  },

  // Engineering & Architecture
  {
    id: "superpowers-tdd",
    name: "Superpowers: Staff Engineer & TDD",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 6400,
    description:
      "Rigorous test-driven development (TDD), multi-file refactoring, systemic debugging, and architecture design that prevents agent slop.",
    tags: ["engineering", "tdd", "debug", "refactor", "cto", "testing", "architecture", "coder", "clean-code", "python", "typescript"],
    role: "CTO",
    category: "engineering",
  },
  {
    id: "backend-architect",
    name: "Backend & API Architect",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "REST & gRPC API design, microservice boundary modeling, idempotent webhooks, caching strategies (Redis), and distributed transactions.",
    tags: ["backend", "api", "rest", "grpc", "architecture", "redis", "database", "node", "go", "python", "microservices"],
    role: "Backend Architect",
    category: "engineering",
  },
  {
    id: "code-reviewer-pro",
    name: "Staff Code Reviewer & PR Auditor",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 6400,
    description:
      "Deep PR review for edge cases, performance bottlenecks, race conditions, type safety, memory leaks, and idiomatic conventions.",
    tags: ["code-review", "pr", "review", "audit", "linter", "edge-cases", "quality", "clean-code", "refactoring"],
    role: "Code Reviewer",
    category: "engineering",
  },
  {
    id: "rust-systems",
    name: "Rust & Systems Programmer",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Memory-safe systems programming, async Tokio runtime architectures, zero-copy parsing, SIMD optimizations, and FFI bindings.",
    tags: ["rust", "systems", "low-level", "tokio", "concurrency", "performance", "memory", "c++"],
    role: "Systems Engineer",
    category: "engineering",
  },
  {
    id: "python-pro",
    name: "Python Master & Data Science",
    repo: "travisvn/awesome-claude-skills",
    url: "https://github.com/travisvn/awesome-claude-skills",
    stars: 2800,
    description:
      "Modern Python 3.12+ patterns (Pydantic v2, FastAPI, typing, asyncio), PyTorch pipeline scaffolding, and scientific computing.",
    tags: ["python", "fastapi", "pydantic", "asyncio", "numpy", "pandas", "data-science", "scripting"],
    role: "Python Engineer",
    category: "engineering",
  },

  // Security & AppSec
  {
    id: "security-review",
    name: "AppSec Reviewer & Threat Modeler",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 6400,
    description:
      "STRIDE threat modeling, OWASP Top 10 audit, SQLi/XSS/CSRF penetration testing, dependency CVE scanning, and cryptographic sanity checks.",
    tags: ["security", "owasp", "audit", "appsec", "threat-model", "pentest", "vulnerability", "cve", "auth", "exploit", "hack"],
    role: "Security",
    category: "security",
  },
  {
    id: "smart-contract-security",
    name: "Smart Contract & EVM Auditor",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Reentrancy attacks, flash loan attack vectors, access control audits, gas optimization, and formal verification for Solidity smart contracts.",
    tags: ["solidity", "security", "web3", "evm", "smart-contracts", "crypto", "audit"],
    role: "Web3 Security",
    category: "security",
  },

  // DevOps & SRE
  {
    id: "sre-incident-commander",
    name: "Staff SRE & Incident Commander",
    repo: "travisvn/awesome-claude-skills",
    url: "https://github.com/travisvn/awesome-claude-skills",
    stars: 2800,
    description:
      "Incident response runbooks, post-mortem generator, Kubernetes pod crash triage, SLI/SLO definitions, and Prometheus/Grafana alerts.",
    tags: ["sre", "devops", "k8s", "kubernetes", "incident", "oncall", "monitoring", "prometheus", "grafana", "outage", "production"],
    role: "SRE",
    category: "devops",
  },
  {
    id: "docker-cicd-pipeline",
    name: "Docker & GitHub Actions CI/CD Specialist",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Multi-stage Dockerfiles, caching strategies, GitHub Actions matrix builds, automated zero-downtime deployments, and Terraform IaC.",
    tags: ["docker", "ci", "cd", "github-actions", "devops", "terraform", "iac", "containers", "deployment", "linux"],
    role: "DevOps",
    category: "devops",
  },

  // Design & Frontend
  {
    id: "frontend-design",
    name: "Frontend UI Taste & Tailwind Craft",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 8900,
    description:
      "Anti-generic layout principles, typographic contrast scales, deliberate micro-interactions, responsive Tailwind CSS, and WCAG AA accessibility.",
    tags: ["design", "frontend", "ui", "ux", "css", "tailwind", "react", "layout", "typography", "components", "interface"],
    role: "UI/UX Designer",
    category: "design",
  },
  {
    id: "brand-identity",
    name: "Brand Identity & Visual Voice",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 8900,
    description:
      "Visual design systems, naming guidelines, typography pairings, color palette theory, and high-conversion landing page design critique.",
    tags: ["brand", "design", "identity", "voice", "landing-page", "colors", "creative", "logo"],
    role: "Brand Designer",
    category: "design",
  },

  // Data & AI Architecture
  {
    id: "data-engineer",
    name: "Data Engineer & SQL/dbt Modeler",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Postgres index tuning, dbt dimensional modeling, ClickHouse analytics queries, ETL streaming pipelines, and warehouse partitioning.",
    tags: ["data", "sql", "dbt", "etl", "postgres", "database", "clickhouse", "analytics", "pipeline", "query"],
    role: "Data Engineer",
    category: "data",
  },
  {
    id: "rag-ai-architect",
    name: "RAG & Vector Search Architect",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Chunking strategies, hybrid BM25 + dense vector search, reranking pipelines, evaluation rubrics (Ragas), and local embedding setups.",
    tags: ["rag", "embeddings", "vector", "ai", "search", "qdrant", "pgvector", "retrieval", "llm", "knowledge-base"],
    role: "AI Architect",
    category: "data",
  },
  {
    id: "prompt-engineer-pro",
    name: "System Prompt & Agent Metaprompting",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Few-shot reasoning chains, XML structured formatting, anti-jailbreak constraints, tool-calling validation schemas, and prompt eval suites.",
    tags: ["prompt", "prompt-engineering", "metaprompt", "agent", "system-prompt", "xml", "few-shot", "reasoning"],
    role: "Prompt Engineer",
    category: "data",
  },

  // Content & GTM
  {
    id: "seo-content-engine",
    name: "SEO + Viral Content Engine",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "High-intent keyword research, search intent mapping, technical SEO audits, programmatic content generation, and organic distribution.",
    tags: ["seo", "content", "writing", "blog", "organic", "keywords", "traffic", "copywriting"],
    role: "Content Lead",
    category: "content",
  },
  {
    id: "sales-outbound",
    name: "Sales & Cold Outreach Strategist",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "B2B cold email sequences, personalized LinkedIn outreach, objection handling matrices, discovery call scripts, and demo battlecards.",
    tags: ["sales", "ae", "outbound", "cold-email", "gtm", "email", "pipeline", "deals", "prospecting"],
    role: "Sales Lead",
    category: "content",
  },
  {
    id: "technical-writer",
    name: "Staff Technical Writer & API Docs",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 8900,
    description:
      "Stripe-quality API documentation, comprehensive developer guides, architectural decision records (ADRs), and clear changelogs.",
    tags: ["docs", "writing", "readme", "api", "technical-writing", "guides", "documentation", "developer-docs"],
    role: "Technical Writer",
    category: "content",
  },

  // Product & QA
  {
    id: "product-manager-pro",
    name: "Product Manager & PRD Author",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "Detailed Product Requirement Documents (PRDs), user personas, acceptance criteria, ICE/RICE prioritization, and sprint roadmaps.",
    tags: ["pm", "product", "prd", "specs", "roadmap", "user-stories", "features", "prioritization", "backlog"],
    role: "Product Manager",
    category: "product",
  },
  {
    id: "qa-playwright-tester",
    name: "QA Lead & End-to-End Playwright Tester",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 6400,
    description:
      "Automated Playwright test suites, regression checklists, edge-case coverage maps, visual regression testing, and CI smoke passes.",
    tags: ["qa", "testing", "playwright", "regression", "e2e", "test-plan", "automation", "smoke-test"],
    role: "QA Engineer",
    category: "product",
  },
  {
    id: "customer-success-ops",
    name: "Customer Success & Support Lead",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 5200,
    description:
      "Customer onboarding playbooks, churn risk alerts, empathetic support macros, QBR presentation decks, and escalation workflows.",
    tags: ["cs", "success", "onboarding", "support", "customer-service", "churn", "tickets", "retention"],
    role: "Customer Success",
    category: "product",
  },
  {
    id: "anthropic-office-docs",
    name: "Anthropic Document & Office Suite",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 8900,
    description:
      "Official reference SKILL.md specs for generating, editing, and extracting insights from PDF, DOCX, XLSX spreadsheets, and PPTX presentations.",
    tags: ["docs", "pdf", "xlsx", "pptx", "office", "spreadsheets", "presentations", "reports"],
    role: "Document Specialist",
    category: "product",
  },
  {
    id: "awesome-agent-skills-directory",
    name: "Awesome Agent Skills Directory",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 4100,
    description:
      "Curated index of 1000+ agent skills for Claude Code, Codex, Cursor, Gemini CLI, Windsurf, and custom autonomous agents.",
    tags: ["index", "catalog", "claude", "cursor", "codex", "all-skills", "directory", "ecosystem"],
    role: "Directory Index",
    category: "engineering",
  },
];

// Conversational and stop-word filter to extract meaningful keywords
const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "you", "your", "he", "she", "it", "they",
  "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does",
  "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
  "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out",
  "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "can", "will", "just", "should", "now", "want", "need", "give", "find", "get", "make",
  "work", "act", "be", "like", "skill", "skills", "agent", "agents", "please", "someone",
  "something", "good", "best", "help", "looking", "create", "write", "run"
]);

// Intent domain keyword synonym maps
const ROLE_INTENTS: Record<string, string[]> = {
  "cmo": ["cmo-growth", "seo-content-engine", "brand-identity", "sales-outbound"],
  "marketing": ["cmo-growth", "seo-content-engine", "brand-identity"],
  "growth": ["cmo-growth", "seo-content-engine", "sales-outbound"],
  "brand": ["brand-identity", "cmo-growth", "frontend-design"],
  "cfo": ["cfo-finance"],
  "finance": ["cfo-finance"],
  "valuation": ["cfo-finance"],
  "accounting": ["cfo-finance"],
  "runway": ["cfo-finance"],
  "money": ["cfo-finance"],
  "sre": ["sre-incident-commander", "docker-cicd-pipeline"],
  "devops": ["sre-incident-commander", "docker-cicd-pipeline"],
  "incident": ["sre-incident-commander"],
  "oncall": ["sre-incident-commander"],
  "kubernetes": ["sre-incident-commander", "docker-cicd-pipeline"],
  "k8s": ["sre-incident-commander", "docker-cicd-pipeline"],
  "docker": ["docker-cicd-pipeline", "sre-incident-commander"],
  "ci": ["docker-cicd-pipeline"],
  "pipeline": ["docker-cicd-pipeline", "data-engineer"],
  "pm": ["product-manager-pro"],
  "product": ["product-manager-pro"],
  "prd": ["product-manager-pro"],
  "specs": ["product-manager-pro", "superpowers-tdd"],
  "roadmap": ["product-manager-pro"],
  "security": ["security-review", "smart-contract-security"],
  "appsec": ["security-review"],
  "audit": ["security-review", "code-reviewer-pro", "smart-contract-security"],
  "pentest": ["security-review"],
  "hack": ["security-review"],
  "vulnerability": ["security-review"],
  "owasp": ["security-review"],
  "code": ["superpowers-tdd", "code-reviewer-pro", "backend-architect", "python-pro", "rust-systems"],
  "coder": ["superpowers-tdd", "code-reviewer-pro", "backend-architect", "python-pro"],
  "engineer": ["superpowers-tdd", "backend-architect", "rust-systems", "python-pro"],
  "engineering": ["superpowers-tdd", "backend-architect", "rust-systems"],
  "tdd": ["superpowers-tdd", "qa-playwright-tester"],
  "review": ["code-reviewer-pro", "security-review"],
  "pr": ["code-reviewer-pro"],
  "refactor": ["superpowers-tdd", "code-reviewer-pro"],
  "python": ["python-pro", "superpowers-tdd"],
  "rust": ["rust-systems"],
  "backend": ["backend-architect", "python-pro", "rust-systems"],
  "api": ["backend-architect", "technical-writer"],
  "design": ["frontend-design", "brand-identity"],
  "ui": ["frontend-design", "brand-identity"],
  "ux": ["frontend-design"],
  "frontend": ["frontend-design"],
  "tailwind": ["frontend-design"],
  "css": ["frontend-design"],
  "data": ["data-engineer", "python-pro", "rag-ai-architect"],
  "sql": ["data-engineer"],
  "dbt": ["data-engineer"],
  "postgres": ["data-engineer"],
  "rag": ["rag-ai-architect", "prompt-engineer-pro"],
  "vector": ["rag-ai-architect"],
  "embedding": ["rag-ai-architect"],
  "prompt": ["prompt-engineer-pro"],
  "copy": ["cmo-growth", "seo-content-engine", "sales-outbound"],
  "copywriter": ["cmo-growth", "seo-content-engine"],
  "seo": ["seo-content-engine", "cmo-growth"],
  "writer": ["technical-writer", "seo-content-engine"],
  "docs": ["technical-writer", "anthropic-office-docs"],
  "documentation": ["technical-writer"],
  "sales": ["sales-outbound", "cmo-growth"],
  "outbound": ["sales-outbound"],
  "email": ["sales-outbound", "cmo-growth"],
  "legal": ["legal-counsel"],
  "lawyer": ["legal-counsel"],
  "contract": ["legal-counsel"],
  "privacy": ["legal-counsel"],
  "recruiter": ["recruiter-hr"],
  "hiring": ["recruiter-hr"],
  "hr": ["recruiter-hr"],
  "qa": ["qa-playwright-tester", "superpowers-tdd"],
  "testing": ["qa-playwright-tester", "superpowers-tdd"],
  "playwright": ["qa-playwright-tester"],
  "support": ["customer-success-ops"],
  "customer": ["customer-success-ops"],
};

export type MatchScoredSkill = Skill & {
  matchScore: number;
  matchReason: string;
};

export function searchLocalSkills(query: string): MatchScoredSkill[] {
  const rawQ = query.trim();
  if (!rawQ) {
    return SKILLS.map((s) => ({
      ...s,
      matchScore: s.stars,
      matchReason: "Curated agent skill catalog",
    })).sort((a, b) => b.stars - a.stars);
  }

  const qLower = rawQ.toLowerCase();
  const rawTokens = qLower.split(/[^a-z0-9#+.-]+/).filter((w) => w.length > 0);
  const keywords = rawTokens.filter((w) => !STOP_WORDS.has(w) && w.length >= 2);

  // If all tokens were stripped by stop-words, use the raw words
  const searchTokens = keywords.length > 0 ? keywords : rawTokens;

  // Check intent mapping
  const boostedIds = new Set<string>();
  const intentHighlights: string[] = [];

  for (const token of searchTokens) {
    if (ROLE_INTENTS[token]) {
      ROLE_INTENTS[token].forEach((id) => boostedIds.add(id));
      intentHighlights.push(token.toUpperCase());
    }
  }

  const results: MatchScoredSkill[] = SKILLS.map((skill) => {
    let score = 0;
    const reasons: string[] = [];

    const skillText = `${skill.name} ${skill.role} ${skill.category} ${skill.description} ${skill.tags.join(" ")} ${skill.repo}`.toLowerCase();
    const skillRoleLower = skill.role.toLowerCase();
    const skillNameLower = skill.name.toLowerCase();

    // 1. Direct role / intent match boost (Highest Priority)
    if (boostedIds.has(skill.id)) {
      score += 120;
      reasons.push(`Matched intent: ${intentHighlights.slice(0, 2).join(", ")}`);
    }

    // 2. Exact match in role or name
    if (qLower.includes(skillRoleLower)) {
      score += 100;
      reasons.push(`Role: ${skill.role}`);
    }

    // 3. Exact substring match of the full query in title / tags
    if (skillNameLower.includes(qLower)) {
      score += 90;
      reasons.push(`Title match: "${skill.name}"`);
    }

    // 4. Token matches
    let matchedTokensCount = 0;
    for (const token of searchTokens) {
      if (skillRoleLower === token || skillRoleLower.includes(token)) {
        score += 40;
        matchedTokensCount++;
      } else if (skill.tags.some((t) => t === token || t.includes(token))) {
        score += 30;
        matchedTokensCount++;
      } else if (skillNameLower.includes(token)) {
        score += 25;
        matchedTokensCount++;
      } else if (skillText.includes(token)) {
        score += 15;
        matchedTokensCount++;
      }
    }

    if (matchedTokensCount > 0 && reasons.length === 0) {
      reasons.push(`Keyword match: ${searchTokens.slice(0, 3).join(", ")}`);
    }

    // Small star popularity tie breaker (normalized log)
    const starBoost = Math.log10(skill.stars || 100) * 2;
    score += starBoost;

    const matchReason = reasons.length > 0 ? reasons.join(" · ") : "Domain relevance";

    return {
      ...skill,
      matchScore: Math.round(score),
      matchReason,
    };
  });

  return results
    .filter((r) => r.matchScore > 10)
    .sort((a, b) => b.matchScore - a.matchScore || b.stars - a.stars);
}
