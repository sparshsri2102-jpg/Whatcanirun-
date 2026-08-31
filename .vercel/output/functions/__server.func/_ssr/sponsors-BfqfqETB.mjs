import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as getSql } from "./db-C1_LqtiH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sponsors-BfqfqETB.js
var listSponsors_createServerFn_handler = createServerRpc({
	id: "609823e73f8ad04de7d6c8bd4c11d25f799c8fc9f55ab09acf45ef35f56ed8b2",
	name: "listSponsors",
	filename: "src/lib/server/sponsors.ts"
}, (opts) => listSponsors.__executeServer(opts));
var listSponsors = createServerFn({ method: "GET" }).handler(listSponsors_createServerFn_handler, async () => {
	return (await getSql())`
    select id, company, url, tagline, slot, logo
    from sponsor_slots
    where active = true
    order by id asc
  `;
});
var requestSponsor_createServerFn_handler = createServerRpc({
	id: "50b1eb53820029655ea8dc105ced965adc7689b7241576868eefdff46ab685ab",
	name: "requestSponsor",
	filename: "src/lib/server/sponsors.ts"
}, (opts) => requestSponsor.__executeServer(opts));
var requestSponsor = createServerFn({ method: "POST" }).validator((input) => input).handler(requestSponsor_createServerFn_handler, async ({ data }) => {
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
});
//#endregion
export { listSponsors_createServerFn_handler, requestSponsor_createServerFn_handler };
