//#region node_modules/.nitro/vite/services/ssr/assets/xai-BGj4Qahd.js
async function grokJson(args) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available"
	};
	const content = [];
	if (args.imageDataUrl) content.push({
		type: "image_url",
		image_url: { url: args.imageDataUrl }
	});
	content.push({
		type: "text",
		text: args.prompt
	});
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: args.maxTokens ?? 500,
			temperature: 0,
			messages: [{
				role: "system",
				content: "You extract structured data. Reply with a single JSON object. No markdown, no commentary."
			}, {
				role: "user",
				content
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const json = extractJson((await res.json()).choices?.[0]?.message?.content ?? "");
	if (!json) return {
		ok: false,
		error: "Could not parse model output"
	};
	return {
		ok: true,
		data: json
	};
}
function extractJson(text) {
	const trimmed = text.trim();
	const candidate = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? trimmed;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");
	if (start < 0 || end <= start) return null;
	try {
		return JSON.parse(candidate.slice(start, end + 1));
	} catch {
		return null;
	}
}
//#endregion
export { grokJson as t };
