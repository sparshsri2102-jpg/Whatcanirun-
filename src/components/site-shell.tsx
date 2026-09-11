import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { VisitorDock } from "./visitor-dock";
import { ActivityTicker } from "./activity-ticker";

const NAV = [
  { to: "/", label: "bench" },
  { to: "/models", label: "models" },
  { to: "/drops", label: "drops" },
  { to: "/skills", label: "skills" },
  { to: "/share", label: "share card" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="group">
            <Link to="/" className="block" aria-label="What Can I Run — home">
              <div className="text-2xs uppercase tracking-[0.28em] text-muted">whatcanirun · open weights × hardware</div>
              <div className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
                will it run? <span className="text-primary">yes / no</span> in 15s
                <span className="caret-blink text-muted">_</span>
              </div>
              <div className="mt-0.5 font-mono text-2xs text-dim">no signup · RTX · Mac · AMD · laptop iGPU</div>
            </Link>
            <Link
              to="/sponsor"
              className="mt-2 inline-flex whitespace-nowrap border border-line px-2.5 py-1 text-2xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg"
              aria-label="Add sponsor"
            >
              add sponsor
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted hover:text-fg data-[status=active]:text-fg data-[status=active]:underline data-[status=active]:underline-offset-4"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <ActivityTicker />
      <VisitorDock />
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-2xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>What Can I Run (myllmstack.vercel.app) · no account for visitors · open weights only</span>
          <span>estimates · Q4/Q5/Q8 GGUF · leave ~10% VRAM for KV cache</span>
        </div>
      </footer>
    </div>
  );
}
