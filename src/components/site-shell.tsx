import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SponsorTicker } from "./sponsor-ticker";
import { VisitorDock } from "./visitor-dock";

const NAV = [
  { to: "/", label: "this" },
  { to: "/models", label: "models" },
  { to: "/drops", label: "drops" },
  { to: "/skills", label: "skills" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <SponsorTicker position="top" />
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <Link to="/" className="group block">
            <div className="text-2xs uppercase tracking-[0.28em] text-muted">open weights × hardware</div>
            <div className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
              can i run this
              <span className="caret-blink text-muted">_</span>
            </div>
          </Link>
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
            <Link
              to="/sponsor"
              className="whitespace-nowrap border border-line-strong px-3 py-2 text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg"
            >
              add sponsor
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <VisitorDock />
      <SponsorTicker position="bottom" />
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-2xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>no account for visitors · companies sponsor the tape</span>
          <span>estimates · Q4/Q5/Q8 GGUF · leave ~10% VRAM for KV cache</span>
        </div>
      </footer>
    </div>
  );
}
