import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { listSponsors, type Sponsor } from "@/lib/server/sponsors";

const FALLBACK: Sponsor[] = [
  {
    id: 1,
    company: "LOCALWEIGHTS",
    url: "https://huggingface.co",
    tagline: "GGUF drops, ranked by what actually fits.",
    slot: "both",
    logo: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
  },
  {
    id: 2,
    company: "VRAMHAUS",
    url: "https://ollama.com",
    tagline: "Run the model. Skip the cloud bill.",
    slot: "both",
    logo: "https://ollama.com/public/ollama.png",
  },
  {
    id: 3,
    company: "NIGHTSHIFT GPU",
    url: "https://lmstudio.ai",
    tagline: "Desktop inference for people with a job in the morning.",
    slot: "both",
    logo: "https://lmstudio.ai/favicon.ico",
  },
  {
    id: 4,
    company: "OPENNODE",
    url: "https://github.com/ggml-org/llama.cpp",
    tagline: "The runtime the rest of the stack pretends to be.",
    slot: "both",
    logo: "https://raw.githubusercontent.com/ggml-org/llama.cpp/master/media/logo.png",
  },
  {
    id: 5,
    company: "SILICON ATTIC",
    url: "https://unsloth.ai",
    tagline: "Quants that still think.",
    slot: "both",
    logo: "https://unsloth.ai/favicon.ico",
  },
];

function SponsorLogoImage({ logo, company }: { logo?: string | null; company: string }) {
  const [hasError, setHasError] = useState(false);

  if (!logo || hasError) {
    return (
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center border border-line bg-bg text-[9px] font-mono font-bold text-fg">
        {company.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt={`${company} logo`}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      className="inline-block h-3.5 w-3.5 rounded-none object-contain grayscale contrast-125"
    />
  );
}

export function SponsorTicker({ position }: { position: "top" | "bottom" }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(FALLBACK);

  useEffect(() => {
    listSponsors()
      .then((rows) => {
        if (rows.length) setSponsors(rows);
      })
      .catch(() => {});
  }, []);

  const row = sponsors.filter((s) => s.slot === "both" || s.slot === position);
  const items = row.length ? row : FALLBACK;
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="border-b border-line bg-surface text-2xs uppercase tracking-[0.18em] text-muted">
      <div className="flex items-stretch">
        <Link
          to="/sponsor"
          className="shrink-0 border-r border-line px-3 py-2 text-fg hover:bg-fg hover:text-bg transition-colors"
        >
          sponsored
        </Link>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-10 py-2 pr-10">
            {loop.map((s, i) => (
              <a
                key={`${s.id}-${i}`}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 whitespace-nowrap hover:text-fg transition-colors"
              >
                <SponsorLogoImage logo={s.logo} company={s.company} />
                <span className="font-medium text-fg">{s.company}</span>
                <span className="text-dim">·</span>
                <span className="normal-case tracking-normal text-muted">{s.tagline}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
