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
    stars: 25772,
    description:
      "C-level advisory pack: marketing strategy, brand positioning, funnel optimization, launch campaigns, viral hooks, and SEO playbooks.",
    tags: ["cmo", "marketing", "growth", "brand", "copy", "campaigns", "seo", "positioning", "gtm", "funnel", "ceo", "founder", "startup", "launch", "social", "calendar", "pitch", "analysis", "survey"],
    role: "CMO",
    category: "leadership",
  },
  {
    id: "cfo-finance",
    name: "CFO / Finance & Valuation Ops",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
    description:
      "Financial modeling, SaaS unit economics (CAC/LTV/Payback), runway projections, board deck summaries, cap table planning, and pricing models.",
    tags: ["cfo", "finance", "runway", "pricing", "valuation", "economics", "accounting", "accountant", "burn", "budget", "money", "analyst", "bookkeeping", "bi", "metrics", "dashboard", "business", "real-estate", "modeling"],
    role: "CFO",
    category: "leadership",
  },
  {
    id: "legal-counsel",
    name: "General Counsel & Compliance",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
    description:
      "Contract redlines, SaaS terms of service, open-source license audit, privacy checklists (GDPR/CCPA), and vendor agreement review.",
    tags: ["legal", "contracts", "license", "privacy", "counsel", "lawyer", "gdpr", "tos", "compliance", "nda", "terms", "hipaa", "fintech", "document", "paralegal"],
    role: "Counsel",
    category: "leadership",
  },
  {
    id: "recruiter-hr",
    name: "Head of Talent & Recruiting",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
    description:
      "Job description architecture, candidate scorecards, technical interview question rubrics, outbound candidate outreach, and debrief frameworks.",
    tags: ["hiring", "recruiter", "interview", "hr", "talent", "headcount", "sourcing", "jobs", "executive", "assistant", "chief-of-staff", "career", "compensation", "benefits", "benchmarking", "calibration", "payroll", "reviews", "appraisal"],
    role: "Recruiter",
    category: "leadership",
  },

  // Engineering & Architecture
  {
    id: "superpowers-tdd",
    name: "Superpowers: Staff Engineer & TDD",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 284184,
    description:
      "Rigorous test-driven development (TDD), multi-file refactoring, systemic debugging, and architecture design that prevents agent slop.",
    tags: ["engineering", "tdd", "debug", "refactor", "cto", "testing", "architecture", "coder", "clean-code", "python", "typescript", "tech-lead", "staff", "postmortem", "requirements", "game", "automation"],
    role: "CTO",
    category: "engineering",
  },
  {
    id: "backend-architect",
    name: "Backend & API Architect",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
    description:
      "REST & gRPC API design, microservice boundary modeling, idempotent webhooks, caching strategies (Redis), and distributed transactions.",
    tags: ["backend", "api", "rest", "grpc", "graphql", "architecture", "architect", "redis", "database", "node", "nodejs", "express", "django", "orm", "rails", "activerecord", "laravel", "blade", "php", "wordpress", "rabbitmq", "queue", "websocket", "realtime", "stripe", "webhooks", "elasticsearch", "solutions", "go", "java", "python", "microservices", "cloud", "aws", "schema"],
    role: "Backend Architect",
    category: "engineering",
  },
  {
    id: "code-reviewer-pro",
    name: "Staff Code Reviewer & PR Auditor",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 284184,
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
    stars: 34002,
    description:
      "Memory-safe systems programming, async Tokio runtime architectures, zero-copy parsing, SIMD optimizations, and FFI bindings.",
    tags: ["rust", "systems", "low-level", "tokio", "concurrency", "performance", "memory", "c++", "firmware", "embedded"],
    role: "Systems Engineer",
    category: "engineering",
  },
  {
    id: "python-pro",
    name: "Python Master & Data Science",
    repo: "travisvn/awesome-claude-skills",
    url: "https://github.com/travisvn/awesome-claude-skills",
    stars: 15018,
    description:
      "Modern Python 3.12+ patterns (Pydantic v2, FastAPI, typing, asyncio), PyTorch pipeline scaffolding, and scientific computing.",
    tags: ["python", "fastapi", "pydantic", "asyncio", "numpy", "pandas", "data-science", "scripting", "training", "loop", "ml", "machine"],
    role: "Python Engineer",
    category: "engineering",
  },

  // Security & AppSec
  {
    id: "security-review",
    name: "AppSec Reviewer & Threat Modeler",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 284184,
    description:
      "STRIDE threat modeling, OWASP Top 10 audit, SQLi/XSS/CSRF penetration testing, dependency CVE scanning, and cryptographic sanity checks for security engineers.",
    tags: ["security", "owasp", "audit", "appsec", "threat-model", "pentest", "vulnerability", "cve", "auth", "oauth", "login", "jwt", "exploit", "hack", "red-team", "soc", "bounty", "hardening", "tls"],
    role: "Security",
    category: "security",
  },
  {
    id: "smart-contract-security",
    name: "Smart Contract & EVM Auditor",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
    description:
      "Reentrancy attacks, flash loan attack vectors, access control audits, gas optimization, and formal verification for Solidity smart contracts.",
    tags: ["solidity", "security", "web3", "evm", "smart-contracts", "crypto", "audit", "blockchain", "dapp", "defi", "nft"],
    role: "Web3 Security",
    category: "security",
  },

  // DevOps & SRE
  {
    id: "sre-incident-commander",
    name: "Staff SRE & Incident Commander",
    repo: "travisvn/awesome-claude-skills",
    url: "https://github.com/travisvn/awesome-claude-skills",
    stars: 15018,
    description:
      "Incident response runbooks, post-mortem generator, Kubernetes pod crash triage, SLI/SLO definitions, and Prometheus/Grafana alerts.",
    tags: ["sre", "devops", "k8s", "kubernetes", "incident", "oncall", "monitoring", "prometheus", "grafana", "outage", "production", "postmortem", "slo", "reliability", "triage", "site", "dns"],
    role: "SRE",
    category: "devops",
  },
  {
    id: "docker-cicd-pipeline",
    name: "Docker & GitHub Actions CI/CD Specialist",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
    description:
      "Multi-stage Dockerfiles, caching strategies, GitHub Actions matrix builds, automated zero-downtime deployments, and Terraform IaC.",
    tags: ["docker", "ci", "cd", "github-actions", "devops", "terraform", "iac", "containers", "deployment", "linux", "platform", "cloud", "aws", "gcp", "azure", "release", "automation", "mlops", "airflow", "network", "dns", "ansible", "jenkins", "groovy", "nginx", "proxy", "cutover"],
    role: "DevOps",
    category: "devops",
  },

  // Design & Frontend
  {
    id: "frontend-design",
    name: "Frontend UI Taste & Tailwind Craft",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 175471,
    description:
      "Anti-generic layout principles, typographic contrast scales, deliberate micro-interactions, responsive Tailwind CSS, and WCAG AA accessibility.",
    tags: ["design", "frontend", "ui", "ux", "css", "tailwind", "react", "angular", "vue", "layout", "typography", "components", "interface", "mobile", "flutter", "ios", "android", "swift", "swiftui", "kotlin", "native", "accessibility", "wcag", "motion", "prototype", "fullstack", "nextjs", "webflow", "cms", "shopify", "liquid"],
    role: "UI/UX Designer",
    category: "design",
  },
  {
    id: "brand-identity",
    name: "Brand Identity & Visual Voice",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 175471,
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
    stars: 34002,
    description:
      "Postgres index tuning, dbt dimensional modeling, ClickHouse analytics queries, ETL streaming pipelines, and warehouse partitioning.",
    tags: ["data", "sql", "dbt", "etl", "postgres", "database", "clickhouse", "analytics", "pipeline", "query", "warehouse", "airflow", "analyst", "bi", "metrics", "kafka", "spark"],
    role: "Data Engineer",
    category: "data",
  },
  {
    id: "rag-ai-architect",
    name: "RAG & Vector Search Architect",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
    description:
      "Chunking strategies, hybrid BM25 + dense vector search, reranking pipelines, evaluation rubrics (Ragas), and local embedding setups.",
    tags: ["rag", "embeddings", "vector", "ai", "search", "qdrant", "pgvector", "retrieval", "llm", "knowledge-base", "architect", "rerank", "reranking", "design"],
    role: "AI Architect",
    category: "data",
  },
  {
    id: "prompt-engineer-pro",
    name: "System Prompt & Agent Metaprompting",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
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
    stars: 34002,
    description:
      "High-intent keyword research, search intent mapping, technical SEO audits, programmatic content generation, and organic distribution.",
    tags: ["seo", "content", "writing", "blog", "organic", "keywords", "traffic", "copywriting", "social", "calendar", "newsletter", "curriculum", "course"],
    role: "Content Lead",
    category: "content",
  },
  {
    id: "sales-outbound",
    name: "Sales & Cold Outreach Strategist",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
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
    stars: 175471,
    description:
      "Stripe-quality API documentation, comprehensive developer guides, architectural decision records (ADRs), and clear changelogs.",
    tags: ["docs", "writing", "readme", "api", "technical-writing", "guides", "documentation", "dev-docs"],
    role: "Technical Writer",
    category: "content",
  },

  // Product & QA
  {
    id: "product-manager-pro",
    name: "Product Manager & PRD Author",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
    description:
      "Detailed Product Requirement Documents (PRDs), user personas, acceptance criteria, ICE/RICE prioritization, and sprint roadmaps.",
    tags: ["pm", "product", "prd", "specs", "roadmap", "user-stories", "features", "prioritization", "backlog", "sprint", "scrum", "agile", "business", "requirements", "analyst", "facilitation", "coach", "program", "delivery"],
    role: "Product Manager",
    category: "product",
  },
  {
    id: "qa-playwright-tester",
    name: "QA Lead & End-to-End Playwright Tester",
    repo: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 284184,
    description:
      "Automated Playwright test suites, regression checklists, edge-case coverage maps, visual regression testing, and CI smoke passes.",
    tags: ["qa", "testing", "playwright", "regression", "e2e", "test-plan", "automation", "smoke-test", "usability", "experimentation", "unittest", "coverage"],
    role: "QA Engineer",
    category: "product",
  },
  {
    id: "customer-success-ops",
    name: "Customer Success & Support Lead",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    stars: 25772,
    description:
      "Customer onboarding playbooks, churn risk alerts, empathetic support macros, QBR presentation decks, and escalation workflows.",
    tags: ["cs", "success", "onboarding", "support", "customer-service", "churn", "tickets", "retention", "assistant", "inbox", "facilitation", "deck", "enterprise"],
    role: "Customer Success",
    category: "product",
  },
  {
    id: "anthropic-office-docs",
    name: "Anthropic Document & Office Suite",
    repo: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    stars: 175471,
    description:
      "Official reference SKILL.md specs for generating, editing, and extracting insights from PDF, DOCX, XLSX spreadsheets, and PPTX presentations.",
    tags: ["docs", "pdf", "xlsx", "pptx", "office", "spreadsheets", "presentations", "reports", "powerpoint", "pitch", "deck", "excel"],
    role: "Document Specialist",
    category: "product",
  },
  {
    id: "awesome-agent-skills-directory",
    name: "Awesome Agent Skills Directory",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    stars: 34002,
    description:
      "Curated index of 1000+ agent skills for Claude Code, Codex, Cursor, Gemini CLI, Windsurf, and custom autonomous agents.",
    tags: ["index", "catalog", "claude", "cursor", "codex", "all-skills", "directory", "ecosystem", "browse", "list", "all", "every", "available", "collection", "find"],
    role: "Directory Index",
    category: "engineering",
  },
  {
    id: "addyosmani-agent-skills",
    name: "Production Engineering Skills",
    repo: "addyosmani/agent-skills",
    url: "https://github.com/addyosmani/agent-skills",
    stars: 93298,
    description:
      "Production-grade engineering skills for AI coding agents: code quality bars, best practices, testing standards, and reliability craft.",
    tags: ["production", "engineering", "best-practices", "code-quality", "standards", "review", "backend", "reliability", "coding", "craft", "grade"],
    role: "Production Engineer",
    category: "engineering",
  },
  {
    id: "wshobson-agents",
    name: "Multi-Harness Plugin Marketplace",
    repo: "wshobson/agents",
    url: "https://github.com/wshobson/agents",
    stars: 39543,
    description:
      "Agentic plugin marketplace spanning Claude Code, Codex, Cursor, Gemini CLI, and Windsurf — installable skills, rules, and subagents.",
    tags: ["plugins", "marketplace", "cursor", "codex", "windsurf", "gemini-cli", "collection", "subagents", "rules", "install"],
    role: "Plugin Curator",
    category: "engineering",
  },
  {
    id: "open-design",
    name: "Open Design System Plugin",
    repo: "nexu-io/open-design",
    url: "https://github.com/nexu-io/open-design",
    stars: 95269,
    description:
      "Open-source Claude design plugin: design systems, tasteful high-end UI, and a local-first design workflow.",
    tags: ["design", "design-system", "plugin", "system", "ui", "frontend", "taste", "local-first"],
    role: "Design Engineer",
    category: "design",
  },
  {
    id: "claude-mem",
    name: "Persistent Agent Memory",
    repo: "thedotmack/claude-mem",
    url: "https://github.com/thedotmack/claude-mem",
    stars: 93597,
    description:
      "Persistent memory across sessions for every agent — long-horizon context, recall, and conversation history that survives restarts.",
    tags: ["memory", "context", "persistent", "sessions", "recall", "history", "remember", "long-horizon", "agents"],
    role: "Memory Architect",
    category: "data",
  },
  {
    id: "scientific-skills",
    name: "AI Scientist Skills",
    repo: "K-Dense-AI/scientific-agent-skills",
    url: "https://github.com/K-Dense-AI/scientific-agent-skills",
    stars: 44192,
    description:
      "Turn any AI agent into an AI scientist: literature review, bioinformatics and chemoinformatics workflows, and experiment design.",
    tags: ["science", "scientist", "scientific", "papers", "literature", "experiments", "bioinformatics", "study"],
    role: "AI Scientist",
    category: "data",
  },
  {
    id: "humanizer",
    name: "AI Writing Humanizer",
    repo: "blader/humanizer",
    url: "https://github.com/blader/humanizer",
    stars: 46169,
    description:
      "Agent skill that removes signs of AI-generated writing — natural, human-sounding copy that passes AI detectors.",
    tags: ["writing", "humanize", "humanizer", "human", "copy", "natural", "undetectable", "detector", "essay"],
    role: "Writing Humanizer",
    category: "content",
  },
  {
    id: "planning-with-files",
    name: "File-Based Agent Planning",
    repo: "OthmanAdi/planning-with-files",
    url: "https://github.com/OthmanAdi/planning-with-files",
    stars: 26761,
    description:
      "Persistent file-based planning for AI coding agents and long-running tasks — plans that live in markdown, not in context.",
    tags: ["planning", "plans", "files", "markdown", "roadmap", "long-running", "tracking", "organization", "todos"],
    role: "Planning Lead",
    category: "product",
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
  "graphic": ["brand-identity"],
  "logo": ["brand-identity"],
  "video": ["brand-identity", "seo-content-engine"],
  "premiere": ["brand-identity"],
  "podcast": ["seo-content-engine", "brand-identity"],
  "producer": ["seo-content-engine"],
  "cfo": ["cfo-finance"],
  "accountant": ["cfo-finance"],
  "bookkeeping": ["cfo-finance"],
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
  "aws": ["docker-cicd-pipeline", "sre-incident-commander"],
  "gcp": ["docker-cicd-pipeline", "sre-incident-commander"],
  "azure": ["docker-cicd-pipeline", "sre-incident-commander"],
  "zone": ["docker-cicd-pipeline"],
  "postmortem": ["sre-incident-commander"],
  "reliability": ["sre-incident-commander"],
  "dns": ["docker-cicd-pipeline", "security-review"],
  "site": ["sre-incident-commander"],
  "platform": ["docker-cicd-pipeline", "sre-incident-commander"],
  "pm": ["product-manager-pro"],
  "product": ["product-manager-pro"],
  "prd": ["product-manager-pro"],
  "sprint": ["product-manager-pro"],
  "scrum": ["product-manager-pro"],
  "agile": ["product-manager-pro"],
  "specs": ["product-manager-pro", "superpowers-tdd"],
  "roadmap": ["product-manager-pro"],
  "security": ["security-review", "smart-contract-security"],
  "appsec": ["security-review"],
  "solidity": ["smart-contract-security", "security-review"],
  "reentrancy": ["smart-contract-security"],
  "evm": ["smart-contract-security"],
  "web3": ["smart-contract-security"],
  "audit": ["security-review", "code-reviewer-pro", "smart-contract-security"],
  "pentest": ["security-review"],
  "hack": ["security-review"],
  "vulnerability": ["security-review"],
  "owasp": ["security-review"],
  "red": ["security-review"],
  "bounty": ["security-review"],
  "injection": ["security-review"],
  "xss": ["security-review"],
  "sqli": ["security-review"],
  "code": ["superpowers-tdd", "code-reviewer-pro", "backend-architect", "python-pro", "rust-systems"],
  "coder": ["superpowers-tdd", "code-reviewer-pro", "backend-architect", "python-pro"],
  "engineer": ["superpowers-tdd", "backend-architect", "rust-systems", "python-pro", "sre-incident-commander", "docker-cicd-pipeline", "prompt-engineer-pro", "security-review", "data-engineer", "qa-playwright-tester", "frontend-design"],
  "developer": ["frontend-design", "backend-architect", "superpowers-tdd"],
  "advocate": ["technical-writer", "backend-architect"],
  "engineering": ["superpowers-tdd", "backend-architect", "rust-systems"],
  "tdd": ["superpowers-tdd", "qa-playwright-tester"],
  "review": ["code-reviewer-pro", "security-review"],
  "pr": ["code-reviewer-pro"],
  "refactor": ["superpowers-tdd", "code-reviewer-pro"],
  "python": ["python-pro", "superpowers-tdd"],
  "rust": ["rust-systems"],
  "machine": ["python-pro"],
  "learning": ["python-pro", "rag-ai-architect"],
  "fullstack": ["frontend-design", "backend-architect", "superpowers-tdd"],
  "nextjs": ["frontend-design"],
  "backend": ["backend-architect", "python-pro", "rust-systems"],
  "api": ["backend-architect", "technical-writer"],
  "graphql": ["backend-architect"],
  "schema": ["backend-architect"],
  "django": ["backend-architect", "python-pro"],
  "orm": ["backend-architect", "data-engineer"],
  "rails": ["backend-architect"],
  "activerecord": ["backend-architect"],
  "laravel": ["backend-architect"],
  "blade": ["backend-architect"],
  "php": ["backend-architect"],
  "wordpress": ["backend-architect", "frontend-design"],
  "express": ["backend-architect"],
  "rabbitmq": ["backend-architect"],
  "queue": ["backend-architect"],
  "websocket": ["backend-architect", "frontend-design"],
  "realtime": ["backend-architect"],
  "oauth": ["security-review", "backend-architect"],
  "login": ["security-review", "backend-architect"],
  "swift": ["frontend-design"],
  "swiftui": ["frontend-design"],
  "kotlin": ["frontend-design"],
  "webflow": ["frontend-design"],
  "cms": ["frontend-design"],
  "shopify": ["frontend-design", "backend-architect"],
  "liquid": ["frontend-design"],
  "ecommerce": ["cmo-growth", "frontend-design"],
  "prototype": ["frontend-design", "product-manager-pro"],
  "design": ["frontend-design", "brand-identity"],
  "ui": ["frontend-design", "brand-identity"],
  "ux": ["frontend-design"],
  "frontend": ["frontend-design"],
  "tailwind": ["frontend-design"],
  "css": ["frontend-design"],
  "mobile": ["frontend-design"],
  "flutter": ["frontend-design"],
  "ios": ["frontend-design"],
  "android": ["frontend-design"],
  "wcag": ["frontend-design", "qa-playwright-tester"],
  "accessibility": ["frontend-design", "qa-playwright-tester"],
  "data": ["data-engineer", "python-pro", "rag-ai-architect"],
  "sql": ["data-engineer"],
  "dbt": ["data-engineer"],
  "postgres": ["data-engineer"],
  "warehouse": ["data-engineer"],
  "rag": ["rag-ai-architect", "prompt-engineer-pro"],
  "vector": ["rag-ai-architect"],
  "embedding": ["rag-ai-architect"],
  "rerank": ["rag-ai-architect"],
  "reranking": ["rag-ai-architect"],
  "prompt": ["prompt-engineer-pro"],
  "copy": ["cmo-growth", "seo-content-engine", "sales-outbound"],
  "copywriter": ["cmo-growth", "seo-content-engine"],
  "seo": ["seo-content-engine", "cmo-growth"],
  "writer": ["technical-writer", "seo-content-engine"],
  "docs": ["technical-writer", "anthropic-office-docs"],
  "documentation": ["technical-writer"],
  "readme": ["technical-writer"],
  "curriculum": ["seo-content-engine", "technical-writer"],
  "edtech": ["seo-content-engine", "technical-writer"],
  "course": ["seo-content-engine", "technical-writer"],
  "powerpoint": ["anthropic-office-docs"],
  "pitch": ["anthropic-office-docs", "cmo-growth"],
  "deck": ["anthropic-office-docs"],
  "excel": ["anthropic-office-docs", "cfo-finance"],
  "sales": ["sales-outbound", "cmo-growth"],
  "outbound": ["sales-outbound"],
  "email": ["sales-outbound", "cmo-growth"],
  "revenue": ["sales-outbound", "cfo-finance"],
  "hubspot": ["sales-outbound", "customer-success-ops"],
  "investor": ["cfo-finance", "customer-success-ops"],
  "press": ["cmo-growth", "technical-writer"],
  "announcement": ["cmo-growth"],
  "crisis": ["cmo-growth", "legal-counsel"],
  "legal": ["legal-counsel"],
  "lawyer": ["legal-counsel"],
  "contract": ["legal-counsel"],
  "privacy": ["legal-counsel"],
  "nda": ["legal-counsel"],
  "hipaa": ["legal-counsel", "security-review"],
  "fintech": ["legal-counsel", "security-review", "cfo-finance"],
  "tax": ["cfo-finance"],
  "recruiter": ["recruiter-hr"],
  "hiring": ["recruiter-hr"],
  "hr": ["recruiter-hr"],
  "compensation": ["recruiter-hr", "cfo-finance"],
  "benefits": ["recruiter-hr"],
  "benchmarking": ["recruiter-hr", "data-engineer"],
  "payroll": ["cfo-finance", "recruiter-hr"],
  "performance": ["recruiter-hr", "rust-systems"],
  "angular": ["frontend-design"],
  "vue": ["frontend-design"],
  "ansible": ["docker-cicd-pipeline"],
  "blockchain": ["smart-contract-security", "backend-architect"],
  "stripe": ["backend-architect", "cfo-finance"],
  "elasticsearch": ["backend-architect", "rag-ai-architect", "data-engineer"],
  "firmware": ["rust-systems"],
  "embedded": ["rust-systems"],
  "network": ["docker-cicd-pipeline", "security-review"],
  "jenkins": ["docker-cicd-pipeline"],
  "groovy": ["docker-cicd-pipeline"],
  "nginx": ["docker-cicd-pipeline"],
  "tls": ["docker-cicd-pipeline", "security-review"],
  "usability": ["qa-playwright-tester", "frontend-design"],
  "program": ["product-manager-pro"],
  "delivery": ["product-manager-pro"],
  "risk": ["security-review", "cfo-finance"],
  "supply": ["data-engineer"],
  "training": ["python-pro", "rag-ai-architect"],
  "loop": ["python-pro"],
  "redis": ["backend-architect", "data-engineer"],
  "document": ["legal-counsel"],
  "paralegal": ["legal-counsel"],
  "calibration": ["recruiter-hr"],
  "patent": ["legal-counsel"],
  "attorney": ["legal-counsel"],
  "trademark": ["legal-counsel", "brand-identity"],
  "registration": ["legal-counsel"],
  "policy": ["legal-counsel", "technical-writer"],
  "regulation": ["legal-counsel"],
  "procurement": ["legal-counsel", "cfo-finance"],
  "rfps": ["legal-counsel"],
  "rfp": ["legal-counsel"],
  "maintainer": ["code-reviewer-pro", "customer-success-ops"],
  "solopreneur": ["docker-cicd-pipeline", "prompt-engineer-pro", "cmo-growth"],
  "technology": ["superpowers-tdd"],
  "officer": ["superpowers-tdd", "security-review"],
  "qa": ["qa-playwright-tester", "superpowers-tdd"],
  "testing": ["qa-playwright-tester", "superpowers-tdd"],
  "playwright": ["qa-playwright-tester"],
  "support": ["customer-success-ops"],
  "customer": ["customer-success-ops"],
  "humanize": ["humanizer"],
  "scientist": ["scientific-skills"],
  "science": ["scientific-skills"],
  "bioinformatics": ["scientific-skills"],
  "competitive": ["cmo-growth", "sales-outbound", "product-manager-pro"],
  "market": ["cmo-growth", "data-engineer"],
  "plugin": ["wshobson-agents"],
  "plugins": ["wshobson-agents"],
  "churn": ["customer-success-ops"],
  "defi": ["smart-contract-security"],
  "community": ["customer-success-ops", "seo-content-engine"],
  "discord": ["customer-success-ops"],
  "desk": ["customer-success-ops"],
  "qbr": ["customer-success-ops"],
  "facilitator": ["product-manager-pro", "customer-success-ops"],
  "retrospective": ["product-manager-pro", "customer-success-ops"],
  "retrospectives": ["product-manager-pro", "customer-success-ops"],
  "browse": ["awesome-agent-skills-directory"],
  "list": ["awesome-agent-skills-directory"],
  "all": ["awesome-agent-skills-directory"],
  "every": ["awesome-agent-skills-directory"],
  "available": ["awesome-agent-skills-directory"],
  "directory": ["awesome-agent-skills-directory"],
  "index": ["awesome-agent-skills-directory"],
  "catalog": ["awesome-agent-skills-directory"],
  "find": ["awesome-agent-skills-directory"],
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
