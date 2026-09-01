import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as getSql } from "./db-DVctcgq-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sponsors--nccJ8j9.js
var listSponsors_createServerFn_handler = createServerRpc({
	id: "609823e73f8ad04de7d6c8bd4c11d25f799c8fc9f55ab09acf45ef35f56ed8b2",
	name: "listSponsors",
	filename: "src/lib/server/sponsors.ts"
}, (opts) => listSponsors.__executeServer(opts));
var listSponsors = createServerFn({ method: "GET" }).handler(listSponsors_createServerFn_handler, async () => {
	try {
		const sql = await getSql();
		const rows = await sql`
      select id, company, url, tagline, slot, logo
      from sponsor_slots
      where active = true
      order by id asc
    `;
		sql`update sponsor_slots set impressions = coalesce(impressions,0)+1 where active = true`.catch(() => {});
		return rows || [];
	} catch (err) {
		console.warn("[sponsors] listSponsors fallback:", err);
		return [];
	}
});
var requestSponsor_createServerFn_handler = createServerRpc({
	id: "50b1eb53820029655ea8dc105ced965adc7689b7241576868eefdff46ab685ab",
	name: "requestSponsor",
	filename: "src/lib/server/sponsors.ts"
}, (opts) => requestSponsor.__executeServer(opts));
var requestSponsor = createServerFn({ method: "POST" }).validator((input) => input).handler(requestSponsor_createServerFn_handler, async ({ data }) => {
	try {
		const company = (data.company || "").trim().slice(0, 80);
		const website = (data.website || "").trim().slice(0, 200);
		const tagline = (data.tagline || "").trim().slice(0, 120);
		const logo = (data.logo || "").trim().slice(0, 500);
		const slot = [
			"top",
			"bottom",
			"both"
		].includes(data.slot) ? data.slot : "both";
		if (!company || !website || !tagline) return {
			ok: false,
			error: "Company, website, and tagline are required."
		};
		if (!/^https?:\/\//i.test(website)) return {
			ok: false,
			error: "Website must start with http:// or https://."
		};
		if (logo && !/^https?:\/\//i.test(logo) && !logo.startsWith("data:image/")) return {
			ok: false,
			error: "Logo must be a valid image URL starting with http://, https://, or data:image/"
		};
		await (await getSql())`
        insert into sponsor_requests (company, website, tagline, slot, logo)
        values (${company}, ${website}, ${tagline}, ${slot}, ${logo || null})
      `;
		return { ok: true };
	} catch (err) {
		console.warn("[sponsors] requestSponsor error:", err);
		return {
			ok: false,
			error: "Submission failed — please try again or email founders@myllmstack.vercel.app"
		};
	}
});
//#endregion
export { listSponsors_createServerFn_handler, requestSponsor_createServerFn_handler };
