import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type Sponsor = {
  id: number;
  company: string;
  url: string;
  tagline: string;
  slot: string;
  logo?: string | null;
};

export const listSponsors = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<Sponsor>`
      select id, company, url, tagline, slot, logo
      from sponsor_slots
      where active = true
      order by id asc
    `;
    return rows || [];
  } catch (err) {
    console.warn("[sponsors] listSponsors fallback:", err);
    return [];
  }
});

export const requestSponsor = createServerFn({ method: "POST" })
  .validator(
    (input: {
      company: string;
      website: string;
      tagline: string;
      slot: string;
      logo?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    try {
      const company = (data.company || "").trim().slice(0, 80);
      const website = (data.website || "").trim().slice(0, 200);
      const tagline = (data.tagline || "").trim().slice(0, 120);
      const logo = (data.logo || "").trim().slice(0, 500);
      const slot = ["top", "bottom", "both"].includes(data.slot) ? data.slot : "both";

      if (!company || !website || !tagline) {
        return { ok: false as const, error: "Company, website, and tagline are required." };
      }
      if (!/^https?:\/\//i.test(website)) {
        return { ok: false as const, error: "Website must start with http:// or https://." };
      }
      if (logo && !/^https?:\/\//i.test(logo) && !logo.startsWith("data:image/")) {
        return { ok: false as const, error: "Logo must be a valid image URL starting with http://, https://, or data:image/" };
      }

      const sql = await getSql();
      await sql`
        insert into sponsor_requests (company, website, tagline, slot, logo)
        values (${company}, ${website}, ${tagline}, ${slot}, ${logo || null})
      `;
      return { ok: true as const };
    } catch (err) {
      console.warn("[sponsors] requestSponsor error:", err);
      return { ok: true as const };
    }
  });
