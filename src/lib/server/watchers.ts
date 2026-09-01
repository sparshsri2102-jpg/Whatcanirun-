import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

function hashRig(s: { gpu: string; vramGb: number; ramGb: number; unified: boolean; gpuCount: number }): string {
  const raw = `${s.gpu}|${s.vramGb}|${s.ramGb}|${s.unified}|${s.gpuCount}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export const createWatcher = createServerFn({ method: "POST" })
  .validator(
    (d: { rig: { gpu: string; vramGb: number; ramGb: number; unified: boolean; gpuCount: number }; contact: string }) => d,
  )
  .handler(async ({ data }) => {
    const contact = (data.contact || "").trim().slice(0, 200);
    if (!contact || contact.length < 5) return { ok: false as const, error: "Enter email or webhook URL" };
    const isEmail = contact.includes("@");
    const isUrl = /^https?:\/\//i.test(contact);
    if (!isEmail && !isUrl) return { ok: false as const, error: "Enter a valid email or https:// webhook URL" };
    const rig = data.rig;
    if (!rig || typeof rig.vramGb !== "number") return { ok: false as const, error: "Rig missing" };
    const vramTier = rig.unified ? rig.ramGb : rig.vramGb * Math.max(1, rig.gpuCount || 1);
    const rigHash = hashRig(rig);
    const contactType = isEmail ? "email" : "webhook";
    try {
      const sql = await getSql();
      // dedupe
      const existing = await sql<{ id: number }>`select id from watchers where rig_hash=${rigHash} and contact=${contact} limit 1`;
      if (existing.length) return { ok: true as const, already: true as const };
      await sql`insert into watchers (rig_hash, vram_tier, contact, contact_type) values (${rigHash}, ${vramTier}, ${contact}, ${contactType})`;
      return { ok: true as const };
    } catch (e) {
      console.warn("[watchers] createWatcher", e);
      return { ok: false as const, error: "Could not save watcher — try again" };
    }
  });

export const getWatcherStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<{ count: number }>`select count(*)::int as count from watchers`;
    return { count: rows[0]?.count ?? 0 };
  } catch {
    return { count: 0 };
  }
});
