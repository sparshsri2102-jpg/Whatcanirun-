import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { listDrops, type DropItem } from "@/lib/server/drops";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drops")({ component: DropsPage });

function timeAgo(iso: string) {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isGguf(item: DropItem): boolean {
  const hay = `${item.name} ${item.tags.join(" ")} ${item.summary}`.toLowerCase();
  return hay.includes("gguf") || hay.includes("llama.cpp") || hay.includes("unsloth") || hay.includes("quant");
}

function DropsPage() {
  const [items, setItems] = useState<DropItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyGguf, setOnlyGguf] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let n = 0;
    const load = () => {
      listDrops()
        .then((rows) => {
          setItems(rows);
          setError(null);
        })
        .catch(() => {
          if (!n) setError("Could not reach Hugging Face / GitHub right now.");
        });
      n += 1;
    };
    load();
    const id = window.setInterval(load, 90_000);
    return () => window.clearInterval(id);
  }, []);

  const filteredItems = useMemo(() => {
    if (!items) return null;
    return items.filter((i) => {
      if (onlyGguf && !isGguf(i)) return false;
      if (search) {
        const text = `${i.name} ${i.summary} ${i.tags.join(" ")}`.toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, onlyGguf, search]);

  const hf = filteredItems?.filter((i) => i.source === "huggingface") ?? [];
  const gh = filteredItems?.filter((i) => i.source === "github") ?? [];

  return (
    <SiteShell>
      <p className="text-2xs uppercase tracking-[0.28em] text-muted">live feed</p>
      <h1 className="mt-3 text-2xl sm:text-3xl">open-weight drops</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Hugging Face text-generation + GGUF, filtered for known labs and anything with real likes. GitHub
        repos tagged gguf / llama.cpp / open-weight from the last weeks. Refreshes on its own.
      </p>

      {/* Filter and search bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter live drops by name / lab…"
          className="min-h-11 flex-1 min-w-[200px] border border-line bg-surface px-3 text-xs focus:border-fg focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setOnlyGguf(!onlyGguf)}
          className={cn(
            "min-h-11 border px-3 text-xs uppercase tracking-widest transition-colors",
            onlyGguf ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"
          )}
        >
          {onlyGguf ? "✓ GGUF only" : "show all formats"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm">{error}</p> : null}
      {!items ? <p className="mt-8 text-sm text-muted">listening…</p> : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.22em] text-muted">huggingface ({hf.length})</h2>
          </div>
          <div className="mt-3 divide-y divide-line border border-line">
            {hf.map((d) => {
              const gguf = isGguf(d);
              return (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-3 hover:bg-surface transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="break-all text-sm font-medium flex items-center gap-2">
                      {d.name}
                      {gguf ? (
                        <span className="border border-line px-1.5 py-0.5 text-2xs uppercase tracking-wider text-fg">
                          GGUF
                        </span>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-2xs tabular-nums text-muted">{timeAgo(d.when)}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {d.likes} likes
                    {d.downloads ? ` · ${d.downloads.toLocaleString()} dl` : ""} · {d.summary}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.22em] text-muted">github ({gh.length})</h2>
          </div>
          <div className="mt-3 divide-y divide-line border border-line">
            {gh.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 hover:bg-surface transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="break-all text-sm font-medium">{d.name}</div>
                  <div className="shrink-0 text-2xs tabular-nums text-muted">{timeAgo(d.when)}</div>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {d.stars ?? d.likes} stars · {d.summary}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}

