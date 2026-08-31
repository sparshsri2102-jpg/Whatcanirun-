import { t as GoogleGenAI } from "../_libs/@google/genai.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/xai-DfxfEhHz.js
var geminiClient = null;
function getGeminiClient() {
	const key = process.env.GEMINI_API_KEY;
	if (!key) return null;
	if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey: key });
	return geminiClient;
}
async function grokJson(args) {
	const gemini = getGeminiClient();
	if (gemini) try {
		const contents = [];
		if (args.imageDataUrl) {
			const match = args.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
			if (match) contents.push({ inlineData: {
				mimeType: match[1],
				data: match[2]
			} });
		}
		contents.push(args.prompt);
		const json = extractJson((await gemini.models.generateContent({
			model: "gemini-2.5-flash",
			contents,
			config: {
				systemInstruction: "You extract structured data. Reply with a single JSON object. No markdown, no commentary.",
				responseMimeType: "application/json",
				maxOutputTokens: args.maxTokens ?? 500,
				temperature: 0
			}
		})).text ?? "");
		if (json) return {
			ok: true,
			data: json
		};
	} catch (e) {
		console.warn("[AI] Gemini request fallback:", e?.message || e);
	}
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
	try {
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
	} catch (err) {
		return {
			ok: false,
			error: err?.message || "AI request failed"
		};
	}
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
