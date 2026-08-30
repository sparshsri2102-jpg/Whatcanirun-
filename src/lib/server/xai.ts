import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

export async function grokJson<T>(args: {
  prompt: string;
  imageDataUrl?: string;
  maxTokens?: number;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  // First attempt with Gemini if key is provided
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const contents: Array<unknown> = [];
      if (args.imageDataUrl) {
        const match = args.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      contents.push(args.prompt);

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction:
            "You extract structured data. Reply with a single JSON object. No markdown, no commentary.",
          responseMimeType: "application/json",
          maxOutputTokens: args.maxTokens ?? 500,
          temperature: 0,
        },
      });

      const text = response.text ?? "";
      const json = extractJson(text);
      if (json) {
        return { ok: true, data: json as T };
      }
    } catch (e: unknown) {
      console.warn("[AI] Gemini request fallback:", (e as Error)?.message || e);
    }
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available" };

  const content: Array<Record<string, unknown>> = [];
  if (args.imageDataUrl) {
    content.push({
      type: "image_url",
      image_url: { url: args.imageDataUrl },
    });
  }
  content.push({ type: "text", text: args.prompt });

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: args.maxTokens ?? 500,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You extract structured data. Reply with a single JSON object. No markdown, no commentary.",
          },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `xAI API error ${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const json = extractJson(text);
    if (!json) return { ok: false, error: "Could not parse model output" };
    return { ok: true, data: json as T };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message || "AI request failed" };
  }
}

function extractJson(text: string): unknown | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
