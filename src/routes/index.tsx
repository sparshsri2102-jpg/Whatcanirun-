import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { SpecBench } from "@/components/spec-bench";
import { FaqSection } from "@/components/faq-section";
import { FAQ_JSONLD } from "@/lib/content/faq";

const ORG_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "What Can I Run",
      url: "https://myllmstack.vercel.app/",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: ["Windows", "macOS", "Linux"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Paste your PC specs and see which open-weight LLMs fit your VRAM, RAM, or unified memory — with GGUF download links, quant sizes, and run commands.",
    },
    {
      "@type": "Organization",
      name: "What Can I Run",
      url: "https://myllmstack.vercel.app/",
      logo: "https://myllmstack.vercel.app/favicon.svg",
    },
    {
      "@type": "WebSite",
      name: "What Can I Run",
      url: "https://myllmstack.vercel.app/",
    },
  ],
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What Can I Run — check if any LLM fits your PC in 15s" },
      {
        name: "description",
        content:
          "The best tool to check if a local model fits in your PC. Paste your specs, see which open-weight LLMs fit: VRAM calculator, GGUF quant sizes, Ollama commands for RTX, Mac, AMD, and CPU-only rigs.",
      },
    ],
    scripts: [
      { type: "application/ld+json", children: ORG_JSONLD },
      { type: "application/ld+json", children: FAQ_JSONLD() },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <SpecBench />
      <FaqSection />
    </SiteShell>
  );
}
