import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { VisitorDock } from "./visitor-dock";

const NAV = [
  { to: "/", label: "Bench" },
  { to: "/models", label: "Models" },
  { to: "/drops", label: "Drops" },
  { to: "/skills", label: "Skills" },
  { to: "/share", label: "Share" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="What Can I Run — Home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-surface">
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="14" height="14" rx="2.5" />
                <path d="M7 10h6M10 7v6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-fg sm:text-base">
              What Can I Run
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap text-muted transition-colors hover:text-fg data-[status=active]:font-medium data-[status=active]:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/sponsor"
              className="hidden sm:inline-flex whitespace-nowrap shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-fg transition-colors hover:border-fg/40 hover:bg-elevated"
            >
              Sponsor
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-fg md:hidden"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-muted hover:bg-elevated hover:text-fg data-[status=active]:bg-elevated data-[status=active]:font-medium data-[status=active]:text-fg"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/sponsor"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-fg hover:bg-elevated"
              >
                Sponsor
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>

      <VisitorDock />

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium text-muted">What Can I Run</span>
            <span>Open-weight hardware sizing &amp; local inference telemetry</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link to="/models" className="hover:text-fg transition-colors">
              Model Catalog
            </Link>
            <Link to="/drops" className="hover:text-fg transition-colors">
              Release Radar
            </Link>
            <Link to="/skills" className="hover:text-fg transition-colors">
              Agent Skills
            </Link>
            <Link to="/share" className="hover:text-fg transition-colors">
              Share Studio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
