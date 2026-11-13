import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Copy, Download, ExternalLink, Rss, Search, Webhook, X } from "lucide-react";
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

  const [showWebhookDrawer, setShowWebhookDrawer] = useState(false);
  const [showRssModal, setShowRssModal] = useState(false);
  const [rssXml, setRssXml] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookVramFilter, setWebhookVramFilter] = useState(24);
  const [webhookStatus, setWebhookStatus] = useState<{ ok: boolean; text: string } | null>(null);
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
          if (!n) setError("Could not reach Hugging Face or GitHub feeds right now.");
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
      setWebhookStatus({ ok: false, text: "Enter a Discord or Slack Webhook URL." });
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
        setWebhookStatus({ ok: true, text: res.message });
      } else {
        setWebhookStatus({ ok: false, text: res.error });
      }
    } catch {
      setWebhookStatus({ ok: false, text: "Connection failed. Verify the Webhook URL." });
    } finally {
      setWebhookTesting(false);
    }
  }

  async function handleToggleNotifications() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("What Can I Run", {
        body: "Release notifications are active for new GGUF quants and local model drops.",
      });
      setNotifyEnabled(true);
    } else {
      const perm = await Notification.requestPermission();
      setNotifyEnabled(perm === "granted");
      if (perm === "granted") {
        new Notification("What Can I Run", {
          body: "Subscribed to open-weight release alerts.",
        });
      }
    }
  }

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="text-xs font-medium text-primary">Release Radar</div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-fg">
            Live Open-Weight Drops
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Real-time stream of Hugging Face text-generation and GGUF releases paired with trending GitHub open-weight repositories.
          </p>
          {savedSpecs ? (
            <div className="mt-2.5 text-xs text-muted">
              Active hardware:{" "}
              <span className="font-mono font-medium text-fg">
                {savedSpecs.gpu} ({savedSpecs.unified ? `${savedSpecs.ramGb} GB Unified` : `${savedSpecs.vramGb * Math.max(1, savedSpecs.gpuCount)} GB VRAM`})
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={cn(
              "inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors",
              notifyEnabled
                ? "border-primary bg-primary text-bg"
                : "border-line-strong bg-surface text-fg hover:bg-elevated",
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            {notifyEnabled ? "Alerts Active" : "Enable Alerts"}
          </button>
          <button
            type="button"
            onClick={() => setShowWebhookDrawer(!showWebhookDrawer)}
            className={cn(
              "inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors",
              showWebhookDrawer
                ? "border-primary bg-primary text-bg"
                : "border-line-strong bg-surface text-fg hover:bg-elevated",
            )}
          >
            <Webhook className="h-3.5 w-3.5" />
            {showWebhookDrawer ? "Hide Webhook" : "Webhook Relay"}
          </button>
          <button
            type="button"
            onClick={handleOpenRss}
            className="inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-fg transition-colors hover:bg-elevated"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS Feed
          </button>
        </div>
      </div>

      {showWebhookDrawer ? (
        <div className="mt-6 rounded-xl border border-line-strong bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-fg">
              Discord & Slack Webhook Relay
            </h2>
            <span className="text-xs font-mono text-dim">Push Dispatch</span>
          </div>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Route new model weights and GGUF quantizations directly to a team Discord or Slack channel filtered by your VRAM ceiling.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="h-11 rounded-lg border border-line-strong bg-bg px-3.5 font-mono text-xs text-fg placeholder:text-dim focus:border-primary focus:outline-none"
            />
            <select
              value={webhookVramFilter}
              onChange={(e) => setWebhookVramFilter(Number(e.target.value))}
              className="h-11 rounded-lg border border-line-strong bg-bg px-3.5 text-xs font-medium text-fg focus:border-primary focus:outline-none"
            >
              <option value={12}>Fits &le; 12 GB VRAM</option>
              <option value={16}>Fits &le; 16 GB VRAM</option>
              <option value={24}>Fits &le; 24 GB VRAM</option>
              <option value={48}>Fits &le; 48 GB VRAM</option>
              <option value={128}>All Drops</option>
            </select>
            <button
              type="button"
              disabled={webhookTesting}
              onClick={handleTestWebhook}
              className="h-11 whitespace-nowrap shrink-0 rounded-lg bg-primary px-5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {webhookTesting ? "Dispatching…" : "Send Test Ping"}
            </button>
          </div>

          {webhookStatus ? (
            <div
              className={cn(
                "mt-3 rounded-lg border px-3.5 py-2.5 font-mono text-xs",
                webhookStatus.ok
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-danger/40 bg-danger/10 text-danger",
              )}
            >
              {webhookStatus.text}
            </div>
          ) : null}
        </div>
      ) : null}

      {showRssModal ? (
        <div className="mt-6 rounded-xl border border-line-strong bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-fg">RSS 2.0 Feed Payload</h2>
            <button
              type="button"
              onClick={() => setShowRssModal(false)}
              className="rounded-md p-1 text-muted hover:text-fg"
              aria-label="Close RSS panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Subscribe from Feedly, NetNewsWire, Slack RSS, or automation pipelines.
          </p>

          <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-line bg-bg p-3.5 font-mono text-xs text-muted">
            {rssXml || "Generating RSS feed XML payload…"}
          </pre>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRss}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-bg hover:opacity-90"
            >
              {copiedRss ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedRss ? "Copied XML" : "Copy XML Feed"}
            </button>
            <button
              type="button"
              onClick={handleDownloadRss}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg px-3.5 py-2 text-xs font-medium text-fg hover:bg-elevated"
            >
              <Download className="h-3.5 w-3.5" />
              Download .xml
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter drops by model name, organization, or tag…"
            className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-4 text-sm text-fg placeholder:text-dim focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyGguf(!onlyGguf)}
          className={cn(
            "h-11 whitespace-nowrap shrink-0 rounded-lg border px-4 text-xs font-medium transition-colors",
            onlyGguf
              ? "border-primary bg-primary text-bg"
              : "border-line-strong bg-surface text-muted hover:text-fg",
          )}
        >
          {onlyGguf ? "GGUF Only Active" : "Filter: GGUF Ready"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {!items ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-3 rounded-xl border border-line bg-surface p-5">
              <div className="h-4 w-32 rounded bg-elevated" />
              <div className="h-14 rounded-lg bg-elevated/60" />
              <div className="h-14 rounded-lg bg-elevated/60" />
              <div className="h-14 rounded-lg bg-elevated/60" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-fg">
                Hugging Face ({hf.length})
              </h2>
              <span className="text-xs text-dim">Weights & Quants</span>
            </div>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {hf.map((d) => {
                const gguf = isGguf(d);
                return (
                  <a
                    key={d.id}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-3.5 transition-colors hover:bg-elevated/50"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-2 break-all text-sm font-medium text-fg">
                        <span>{d.name}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-dim" />
                      </div>
                      <div className="shrink-0 font-mono text-xs tabular-nums text-dim">
                        {timeAgo(d.when)}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {gguf ? <span className="font-mono font-medium text-primary">GGUF</span> : null}
                      {gguf ? <span aria-hidden="true">·</span> : null}
                      <span className="tabular-nums">{d.likes} likes</span>
                      {d.downloads ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{d.downloads.toLocaleString()} dl</span>
                        </>
                      ) : null}
                      <span aria-hidden="true">·</span>
                      <span>{d.summary}</span>
                    </div>
                  </a>
                );
              })}
              {hf.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-dim">
                  No matching Hugging Face drops.
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-fg">
                GitHub ({gh.length})
              </h2>
              <span className="text-xs text-dim">Engines & Tooling</span>
            </div>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {gh.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-3.5 transition-colors hover:bg-elevated/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2 break-all text-sm font-medium text-fg">
                      <span>{d.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-dim" />
                    </div>
                    <div className="shrink-0 font-mono text-xs tabular-nums text-dim">
                      {timeAgo(d.when)}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span className="tabular-nums">{(d.stars ?? d.likes).toLocaleString()} stars</span>
                    <span aria-hidden="true">·</span>
                    <span>{d.summary}</span>
                  </div>
                </a>
              ))}
              {gh.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-dim">
                  No matching GitHub repositories.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </SiteShell>
  );
}
