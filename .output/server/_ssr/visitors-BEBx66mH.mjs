import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as getSql } from "./db-C1_LqtiH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/visitors-BEBx66mH.js
var CITIES = [
	{
		city: "Bengaluru",
		lat: 12.97,
		lng: 77.59
	},
	{
		city: "Mumbai",
		lat: 19.08,
		lng: 72.88
	},
	{
		city: "Delhi",
		lat: 28.61,
		lng: 77.21
	},
	{
		city: "Hyderabad",
		lat: 17.39,
		lng: 78.49
	},
	{
		city: "Singapore",
		lat: 1.35,
		lng: 103.82
	},
	{
		city: "Tokyo",
		lat: 35.68,
		lng: 139.69
	},
	{
		city: "Seoul",
		lat: 37.57,
		lng: 126.98
	},
	{
		city: "Shanghai",
		lat: 31.23,
		lng: 121.47
	},
	{
		city: "Shenzhen",
		lat: 22.54,
		lng: 114.06
	},
	{
		city: "Sydney",
		lat: -33.87,
		lng: 151.21
	},
	{
		city: "Melbourne",
		lat: -37.81,
		lng: 144.96
	},
	{
		city: "San Francisco",
		lat: 37.77,
		lng: -122.42
	},
	{
		city: "Seattle",
		lat: 47.61,
		lng: -122.33
	},
	{
		city: "Los Angeles",
		lat: 34.05,
		lng: -118.24
	},
	{
		city: "Austin",
		lat: 30.27,
		lng: -97.74
	},
	{
		city: "New York",
		lat: 40.71,
		lng: -74.01
	},
	{
		city: "Boston",
		lat: 42.36,
		lng: -71.06
	},
	{
		city: "Toronto",
		lat: 43.65,
		lng: -79.38
	},
	{
		city: "Mexico City",
		lat: 19.43,
		lng: -99.13
	},
	{
		city: "Sao Paulo",
		lat: -23.55,
		lng: -46.63
	},
	{
		city: "Buenos Aires",
		lat: -34.6,
		lng: -58.38
	},
	{
		city: "London",
		lat: 51.51,
		lng: -.13
	},
	{
		city: "Berlin",
		lat: 52.52,
		lng: 13.4
	},
	{
		city: "Paris",
		lat: 48.86,
		lng: 2.35
	},
	{
		city: "Amsterdam",
		lat: 52.37,
		lng: 4.9
	},
	{
		city: "Stockholm",
		lat: 59.33,
		lng: 18.07
	},
	{
		city: "Warsaw",
		lat: 52.23,
		lng: 21.01
	},
	{
		city: "Zurich",
		lat: 47.38,
		lng: 8.54
	},
	{
		city: "Tel Aviv",
		lat: 32.09,
		lng: 34.78
	},
	{
		city: "Dubai",
		lat: 25.2,
		lng: 55.27
	},
	{
		city: "Nairobi",
		lat: -1.29,
		lng: 36.82
	},
	{
		city: "Lagos",
		lat: 6.52,
		lng: 3.38
	},
	{
		city: "Cape Town",
		lat: -33.92,
		lng: 18.42
	},
	{
		city: "Jakarta",
		lat: -6.21,
		lng: 106.85
	},
	{
		city: "Bangkok",
		lat: 13.76,
		lng: 100.5
	},
	{
		city: "Taipei",
		lat: 25.03,
		lng: 121.57
	},
	{
		city: "Hong Kong",
		lat: 22.32,
		lng: 114.17
	},
	{
		city: "Vancouver",
		lat: 49.28,
		lng: -123.12
	},
	{
		city: "Chicago",
		lat: 41.88,
		lng: -87.63
	},
	{
		city: "Dublin",
		lat: 53.35,
		lng: -6.26
	}
];
var TZ_CITY = {
	"Asia/Kolkata": CITIES[0],
	"Asia/Calcutta": CITIES[1],
	"Asia/Dhaka": {
		city: "Dhaka",
		lat: 23.81,
		lng: 90.41
	},
	"Asia/Karachi": {
		city: "Karachi",
		lat: 24.86,
		lng: 67
	},
	"Asia/Colombo": {
		city: "Colombo",
		lat: 6.93,
		lng: 79.85
	},
	"Asia/Singapore": CITIES[4],
	"Asia/Tokyo": CITIES[5],
	"Asia/Seoul": CITIES[6],
	"Asia/Shanghai": CITIES[7],
	"Asia/Hong_Kong": CITIES[36],
	"Asia/Taipei": CITIES[35],
	"Asia/Bangkok": CITIES[34],
	"Asia/Jakarta": CITIES[33],
	"Asia/Dubai": CITIES[29],
	"Asia/Jerusalem": CITIES[28],
	"Australia/Sydney": CITIES[9],
	"Australia/Melbourne": CITIES[10],
	"America/Los_Angeles": CITIES[11],
	"America/Vancouver": CITIES[37],
	"America/New_York": CITIES[15],
	"America/Chicago": CITIES[38],
	"America/Denver": {
		city: "Denver",
		lat: 39.74,
		lng: -104.99
	},
	"America/Toronto": CITIES[17],
	"America/Sao_Paulo": CITIES[19],
	"America/Mexico_City": CITIES[18],
	"America/Argentina/Buenos_Aires": CITIES[20],
	"America/Austin": CITIES[14],
	"Europe/London": CITIES[21],
	"Europe/Berlin": CITIES[22],
	"Europe/Paris": CITIES[23],
	"Europe/Amsterdam": CITIES[24],
	"Europe/Stockholm": CITIES[25],
	"Europe/Warsaw": CITIES[26],
	"Europe/Zurich": CITIES[27],
	"Europe/Dublin": CITIES[39],
	"Africa/Nairobi": CITIES[30],
	"Africa/Lagos": CITIES[31],
	"Africa/Johannesburg": CITIES[32],
	"Pacific/Auckland": {
		city: "Auckland",
		lat: -36.85,
		lng: 174.76
	}
};
function cityFromTimezone(tz) {
	if (tz && TZ_CITY[tz]) return TZ_CITY[tz];
	if (tz) {
		const region = tz.split("/")[0];
		const hit = CITIES.find((c) => {
			if (region === "Asia") return c.lng > 40 && c.lat > 0;
			if (region === "Europe") return c.lng > -15 && c.lng < 40 && c.lat > 35;
			if (region === "America") return c.lng < -30;
			if (region === "Australia" || region === "Pacific") return c.lat < 0 && c.lng > 100;
			if (region === "Africa") return c.lat < 20 && c.lng > -20 && c.lng < 50;
			return false;
		});
		if (hit) return hit;
	}
	return CITIES[Math.floor(Math.random() * CITIES.length)];
}
function ago(createdAt) {
	const t = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
	return Math.max(0, Math.round((Date.now() - t) / 1e3));
}
var getVisitors_createServerFn_handler = createServerRpc({
	id: "d6ccf6d0bbaae0347170620da947a906604559cde29ab3f0d7a932ebb5d5382b",
	name: "getVisitors",
	filename: "src/lib/server/visitors.ts"
}, (opts) => getVisitors.__executeServer(opts));
var getVisitors = createServerFn({ method: "GET" }).handler(getVisitors_createServerFn_handler, async () => {
	const sql = await getSql();
	const stats = await sql`
    select count from visitor_stats where id = 'month-current'
  `;
	let live = (await sql`
    select id, city, lat, lng, created_at
    from visitor_pings
    order by created_at desc
    limit 40
  `).map((r) => ({
		id: r.id,
		city: r.city,
		lat: Number(r.lat),
		lng: Number(r.lng),
		agoSec: ago(r.created_at)
	}));
	if (live.length < 8) {
		const extras = CITIES.slice(0, 10).map((c, i) => ({
			id: -1 - i,
			city: c.city,
			lat: c.lat,
			lng: c.lng,
			agoSec: 12 + i * 17
		}));
		live = [...live, ...extras].slice(0, 18);
	}
	return {
		monthCount: stats[0]?.count ?? 18420,
		live
	};
});
var pingVisitor_createServerFn_handler = createServerRpc({
	id: "24d50309f08a3565a4816e61411c6630d8150923748189a2c2efd2a7f578535c",
	name: "pingVisitor",
	filename: "src/lib/server/visitors.ts"
}, (opts) => pingVisitor.__executeServer(opts));
var pingVisitor = createServerFn({ method: "POST" }).validator((input) => input).handler(pingVisitor_createServerFn_handler, async ({ data }) => {
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
	return {
		ok: true,
		city: city.city
	};
});
//#endregion
export { getVisitors_createServerFn_handler, pingVisitor_createServerFn_handler };
