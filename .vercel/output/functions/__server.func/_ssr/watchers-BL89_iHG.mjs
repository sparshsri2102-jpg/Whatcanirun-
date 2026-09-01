import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { t as getSql } from "./db-DVctcgq-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watchers-BL89_iHG.js
function hashRig(s) {
	const raw = `${s.gpu}|${s.vramGb}|${s.ramGb}|${s.unified}|${s.gpuCount}`;
	let h = 0;
	for (let i = 0; i < raw.length; i++) h = Math.imul(31, h) + raw.charCodeAt(i) | 0;
	return Math.abs(h).toString(36);
}
var createWatcher_createServerFn_handler = createServerRpc({
	id: "e699ba8ef13787105920af2953c52e72704cc116b7823f9a54dc90c8d83a2d75",
	name: "createWatcher",
	filename: "src/lib/server/watchers.ts"
}, (opts) => createWatcher.__executeServer(opts));
var createWatcher = createServerFn({ method: "POST" }).validator((d) => d).handler(createWatcher_createServerFn_handler, async ({ data }) => {
	const contact = (data.contact || "").trim().slice(0, 200);
	if (!contact || contact.length < 5) return {
		ok: false,
		error: "Enter email or webhook URL"
	};
	const isEmail = contact.includes("@");
	const isUrl = /^https?:\/\//i.test(contact);
	if (!isEmail && !isUrl) return {
		ok: false,
		error: "Enter a valid email or https:// webhook URL"
	};
	const rig = data.rig;
	if (!rig || typeof rig.vramGb !== "number") return {
		ok: false,
		error: "Rig missing"
	};
	const vramTier = rig.unified ? rig.ramGb : rig.vramGb * Math.max(1, rig.gpuCount || 1);
	const rigHash = hashRig(rig);
	const contactType = isEmail ? "email" : "webhook";
	try {
		const sql = await getSql();
		if ((await sql`select id from watchers where rig_hash=${rigHash} and contact=${contact} limit 1`).length) return {
			ok: true,
			already: true
		};
		await sql`insert into watchers (rig_hash, vram_tier, contact, contact_type) values (${rigHash}, ${vramTier}, ${contact}, ${contactType})`;
		return { ok: true };
	} catch (e) {
		console.warn("[watchers] createWatcher", e);
		return {
			ok: false,
			error: "Could not save watcher — try again"
		};
	}
});
var getWatcherStats_createServerFn_handler = createServerRpc({
	id: "328ecb5d6571b059b39913e7f6792b805c74e63cc27d82bf06b709aa0c0493d6",
	name: "getWatcherStats",
	filename: "src/lib/server/watchers.ts"
}, (opts) => getWatcherStats.__executeServer(opts));
var getWatcherStats = createServerFn({ method: "GET" }).handler(getWatcherStats_createServerFn_handler, async () => {
	try {
		return { count: (await (await getSql())`select count(*)::int as count from watchers`)[0]?.count ?? 0 };
	} catch {
		return { count: 0 };
	}
});
//#endregion
export { createWatcher_createServerFn_handler, getWatcherStats_createServerFn_handler };
