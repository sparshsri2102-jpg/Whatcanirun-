import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type Sponsor = {
  id: number;
  company: string;
  url: string;
  tagline: string;
  slot: string;
};

export const listSponsors = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<Sponsor>`
    select id, company, url, tagline, slot
    from sponsor_slots
    where active = true
    order by id asc
  `;
});

export const requestSponsor = createServerFn({ method: "POST" })
  .validator((input: { company: string; website: string; tagline: string; slot: string }) => input)
  .handler(async ({ data }) => {
    const company = data.company.trim().slice(0, 80);
    const website = data.website.trim().slice(0, 200);
    const tagline = data.tagline.trim().slice(0, 120);
    const slot = ["top", "bottom", "both"].includes(data.slot) ? data.slot : "both";
    if (!company || !website || !tagline) {
      return { ok: false as const, error: "Company, website, and tagline are required." };
    }
    if (!/^https?:\/\//i.test(website)) {
      return { ok: false as const, error: "Website must start with http:// or https://." };
    }
    const sql = await getSql();
    await sql`
      insert into sponsor_requests (company, website, tagline, slot)
      values (${company}, ${website}, ${tagline}, ${slot})
    `;
    return { ok: true as const };
  });
