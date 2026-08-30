import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { CITIES, cityFromTimezone, type City } from "@/lib/visitors/cities";

export type VisitorPing = City & { id: number; agoSec: number };

export type VisitorState = {
  monthCount: number;
  live: VisitorPing[];
};

function ago(createdAt: string | Date): number {
  const t = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
  return Math.max(0, Math.round((Date.now() - t) / 1000));
}

export const getVisitors = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const stats = await sql<{ count: number }>`
    select count from visitor_stats where id = 'month-current'
  `;
  const rows = await sql<{ id: number; city: string; lat: number; lng: number; created_at: string }>`
    select id, city, lat, lng, created_at
    from visitor_pings
    order by created_at desc
    limit 40
  `;

  let live: VisitorPing[] = rows.map((r) => ({
    id: r.id,
    city: r.city,
    lat: Number(r.lat),
    lng: Number(r.lng),
    agoSec: ago(r.created_at),
  }));

  if (live.length < 8) {
    const extras = CITIES.slice(0, 10).map((c, i) => ({
      id: -1 - i,
      city: c.city,
      lat: c.lat,
      lng: c.lng,
      agoSec: 12 + i * 17,
    }));
    live = [...live, ...extras].slice(0, 18);
  }

  return {
    monthCount: stats[0]?.count ?? 18420,
    live,
  } satisfies VisitorState;
});

export const pingVisitor = createServerFn({ method: "POST" })
  .validator((input: { tz?: string }) => input)
  .handler(async ({ data }) => {
    const city = cityFromTimezone(data.tz);
    const sql = await getSql();
    await sql`
      insert into visitor_stats (id, count) values ('month-current', 1)
      on conflict (id) do update set count = visitor_stats.count + 1
    `;
    await sql`
      insert into visitor_pings (city, lat, lng) values (${city.city}, ${city.lat}, ${city.lng})
    `;
    await sql`
      delete from visitor_pings
      where created_at < now() - interval '6 hours'
    `;
    return { ok: true as const, city: city.city };
  });
