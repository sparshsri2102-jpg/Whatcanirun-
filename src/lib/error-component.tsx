import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred. Try reloading the page.";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <h1 className="text-lg font-medium">something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {message || "An unexpected error occurred. Try reloading the page."}
      </p>
    </main>
  );
}

export function AppNotFoundComponent() {
  return (
    <SiteShell>
      <section className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-16 text-center">
        <p className="font-mono text-xs tracking-wider text-primary uppercase">404 · Route Not Found</p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          This benchmark route does not exist
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          The page or hardware report you requested could not be found. Jump back to the hardware bench or browse the
          supported model catalog.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-invert-fg transition-colors hover:bg-primary/90 whitespace-nowrap"
          >
            Open Hardware Bench
          </Link>
          <Link
            to="/models"
            className="inline-flex items-center justify-center rounded-lg border border-line-strong bg-elevated px-4 py-2 text-xs font-medium text-fg transition-colors hover:border-fg/30 whitespace-nowrap"
          >
            Browse Model Catalog
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
