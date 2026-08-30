import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { listDrops, getRssFeedXml, sendWebhookTest, type DropItem } from "@/lib/server/drops";
import type { Specs } from "@/lib/models/types";
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
  const [savedSpecs, setSavedSpecs] = useState<Specs | null>(null);

  // Webhook & RSS States
  const [showWebhookDrawer, setShowWebhookDrawer] = useState(false);
  const [showRssModal, setShowRssModal] = useState(false);
  const [rssXml, setRssXml] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookVramFilter, setWebhookVramFilter] = useState(24);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [copiedRss, setCopiedRss] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("whatcanirun_last_specs");
      if (s) setSavedSpecs(JSON.parse(s));
      const savedWh = localStorage.getItem("whatcanirun_webhook_url");
      if (savedWh) setWebhookUrl(savedWh);
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifyEnabled(Notification.permission === "granted");
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  async function handleOpenRss() {
    setShowRssModal(true);
    if (!rssXml) {
      const xml = await getRssFeedXml();
      setRssXml(xml);
    }
  }

  async function handleCopyRss() {
    if (!rssXml) {
      const xml = await getRssFeedXml();
      setRssXml(xml);
      await navigator.clipboard.writeText(xml);
    } else {
      await navigator.clipboard.writeText(rssXml);
    }
    setCopiedRss(true);
    setTimeout(() => setCopiedRss(false), 2000);
  }

  function handleDownloadRss() {
    if (!rssXml) return;
    const blob = new Blob([rssXml], { type: "application/rss+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whatcanirun-drops.xml";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleTestWebhook() {
    if (!webhookUrl.trim()) {
      setWebhookStatus("Please enter a Discord or Slack Webhook URL.");
      return;
    }
    setWebhookTesting(true);
    setWebhookStatus(null);
    try {
      localStorage.setItem("whatcanirun_webhook_url", webhookUrl.trim());
      const res = await sendWebhookTest({
        data: {
          webhookUrl: webhookUrl.trim(),
          vramTierGb: webhookVramFilter,
        },
      });
      if (res.ok) {
        setWebhookStatus(`✓ ${res.message}`);
      } else {
        setWebhookStatus(`✗ ${res.error}`);
      }
    } catch {
      setWebhookStatus("✗ Connection failed. Please check the Webhook URL.");
    } finally {
      setWebhookTesting(false);
    }
  }

  async function handleToggleNotifications() {
    if (!("Notification" in window)) {
      alert("Desktop notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification("What Can I Run?", {
        body: "Drop alerts are active. You will receive notifications when new GGUF quants drop!",
      });
      setNotifyEnabled(true);
    } else {
      const perm = await Notification.requestPermission();
      setNotifyEnabled(perm === "granted");
      if (perm === "granted") {
        new Notification("What Can I Run?", {
          body: "Subscribed to live open-weight model drop notifications!",
        });
      }
    }
  }

  return (
    <SiteShell>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-2xs uppercase tracking-[0.28em] text-muted">live feed & alert radar</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">open-weight drops</h1>
        </div>

        {/* RSS & Webhook Alert Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={cn(
              "min-h-9 border px-3 text-2xs uppercase tracking-widest transition-colors",
              notifyEnabled
                ? "border-fg bg-fg text-bg"
                : "border-line text-muted hover:border-fg hover:text-fg"
            )}
          >
            {notifyEnabled ? "🔔 alerts on" : "🔔 enable alerts"}
          </button>
          <button
            type="button"
            onClick={() => setShowWebhookDrawer(!showWebhookDrawer)}
            className={cn(
              "min-h-9 border px-3 text-2xs uppercase tracking-widest transition-colors",
              showWebhookDrawer
                ? "border-fg bg-fg text-bg"
                : "border-line text-muted hover:border-fg hover:text-fg"
            )}
          >
            {showWebhookDrawer ? "hide webhooks" : "⚡ webhook relay"}
          </button>
          <button
            type="button"
            onClick={handleOpenRss}
            className="min-h-9 border border-line bg-surface px-3 text-2xs uppercase tracking-widest text-fg hover:border-fg"
          >
            📡 rss feed
          </button>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Real-time radar scanning Hugging Face text-generation + GGUF uploads and GitHub open-weight repos.
        {savedSpecs ? (
          <span className="block mt-1 text-xs text-fg">
            Filtered for your active rig:{" "}
            <span className="font-mono">{savedSpecs.gpu} ({savedSpecs.vramGb} GB VRAM)</span>
          </span>
        ) : null}
      </p>

      {/* Webhook Configuration Drawer */}
      {showWebhookDrawer ? (
        <div className="mt-6 border border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-[0.24em] text-muted">
              Discord / Slack Webhook Alerts
            </span>
            <span className="text-2xs font-mono text-dim">Automated Push Relay</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Paste your Discord server channel Webhook URL to get instant notifications when new high-profile
            LLM weights and GGUF quantizations drop.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="min-h-11 border border-line bg-bg px-3 text-xs font-mono text-fg focus:border-fg focus:outline-none"
            />
            <select
              value={webhookVramFilter}
              onChange={(e) => setWebhookVramFilter(Number(e.target.value))}
              className="min-h-11 border border-line bg-bg px-3 text-xs text-fg focus:border-fg focus:outline-none"
            >
              <option value={12}>Fits ≤ 12GB VRAM</option>
              <option value={16}>Fits ≤ 16GB VRAM</option>
              <option value={24}>Fits ≤ 24GB VRAM</option>
              <option value={48}>Fits ≤ 48GB VRAM</option>
              <option value={128}>All Drops</option>
            </select>
            <button
              type="button"
              disabled={webhookTesting}
              onClick={handleTestWebhook}
              className="min-h-11 border border-fg bg-fg px-4 text-2xs uppercase tracking-widest text-bg hover:opacity-90 disabled:opacity-50"
            >
              {webhookTesting ? "dispatching…" : "send test ping"}
            </button>
          </div>

          {webhookStatus ? (
            <div
              className={cn(
                "mt-3 text-xs font-mono p-2 border",
                webhookStatus.startsWith("✓")
                  ? "border-emerald-600/40 text-emerald-400 bg-emerald-950/20"
                  : "border-rose-600/40 text-rose-400 bg-rose-950/20"
              )}
            >
              {webhookStatus}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* RSS XML Modal */}
      {showRssModal ? (
        <div className="mt-6 border border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xs uppercase tracking-[0.24em] text-muted">
              Live RSS 2.0 Feed Spec
            </span>
            <button
              type="button"
              onClick={() => setShowRssModal(false)}
              className="text-2xs uppercase text-muted hover:text-fg"
            >
              close [✕]
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Add this syndication feed to Feedly, NetNewsWire, Slack RSS, or Zapier to track model drops:
          </p>

          <pre className="mt-3 max-h-56 overflow-auto border border-line bg-bg p-3 text-2xs font-mono text-dim">
            {rssXml || "Generating RSS feed XML payload…"}
          </pre>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRss}
              className="min-h-9 border border-fg bg-fg px-3 text-2xs uppercase tracking-widest text-bg hover:opacity-90"
            >
              {copiedRss ? "✓ copied xml" : "copy xml feed"}
            </button>
            <button
              type="button"
              onClick={handleDownloadRss}
              className="min-h-9 border border-line bg-bg px-3 text-2xs uppercase tracking-widest text-fg hover:border-fg"
            >
              download .xml
            </button>
          </div>
        </div>
      ) : null}

      {/* Filter and search bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter live drops by name / lab / tag…"
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
      {!items ? <p className="mt-8 text-sm text-muted">listening for drops…</p> : null}

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
                  <div className="mt-1 text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{d.likes} likes</span>
                    {d.downloads ? <span>· {d.downloads.toLocaleString()} dl</span> : null}
                    <span>· {d.summary}</span>
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

