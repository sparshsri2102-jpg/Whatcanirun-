import { createServerFn } from "@tanstack/react-start";
import {
  KNOWN_HF_ARCHITECTURES,
  parseHfConfigJson,
  type HfArchitecture,
} from "@/lib/models/hf-architecture";

function normalizeRepoId(raw: string): string | null {
  let clean = raw.trim();
  clean = clean.replace(/^https?:\/\/huggingface\.co\//i, "");
  clean = clean.replace(/\/(tree|blob|resolve)\/.*$/, "");
  clean = clean.replace(/\/+$/, "");
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(clean)) {
    return null;
  }
  return clean;
}

export const inspectHuggingFaceRepo = createServerFn({ method: "POST" })
  .validator((input: { repoInput: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; arch: HfArchitecture } | { ok: false; error: string }> => {
      const repoId = normalizeRepoId(data.repoInput);
      if (!repoId) {
        return {
          ok: false,
          error: "Enter a valid Hugging Face repo ID (e.g. Qwen/Qwen3-32B) or full URL.",
        };
      }

      const fallbackKey = Object.keys(KNOWN_HF_ARCHITECTURES).find(
        (k) => k.toLowerCase() === repoId.toLowerCase(),
      );

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5500);

        const cfgRes = await fetch(
          `https://huggingface.co/${repoId}/resolve/main/config.json`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );
        clearTimeout(timer);

        if (!cfgRes.ok) {
          if (fallbackKey) {
            return { ok: true, arch: KNOWN_HF_ARCHITECTURES[fallbackKey] };
          }
          if (cfgRes.status === 401 || cfgRes.status === 403) {
            return {
              ok: false,
              error: `Repository "${repoId}" is gated or requires Hugging Face authorization.`,
            };
          }
          return {
            ok: false,
            error: `Could not fetch config.json for "${repoId}" (HTTP ${cfgRes.status}). If this is a GGUF-only repo, inspect the base model ID instead.`,
          };
        }

        const rawConfig = (await cfgRes.json()) as Record<string, unknown>;

        // Optional lightweight check for safetensors.index.json metadata total size
        let totalBytes: number | undefined;
        try {
          const idxController = new AbortController();
          const idxTimer = setTimeout(() => idxController.abort(), 2500);
          const idxRes = await fetch(
            `https://huggingface.co/${repoId}/resolve/main/model.safetensors.index.json`,
            { signal: idxController.signal },
          );
          clearTimeout(idxTimer);
          if (idxRes.ok) {
            const idxJson = (await idxRes.json()) as {
              metadata?: { total_size?: number };
            };
            if (idxJson?.metadata?.total_size) {
              totalBytes = Number(idxJson.metadata.total_size);
            }
          }
        } catch {
          /* index optional */
        }

        const arch = parseHfConfigJson(repoId, rawConfig, totalBytes);
        return { ok: true, arch };
      } catch {
        if (fallbackKey) {
          return { ok: true, arch: KNOWN_HF_ARCHITECTURES[fallbackKey] };
        }
        return {
          ok: false,
          error: `Network timeout reading "${repoId}" from Hugging Face Hub. Try again or use a built-in architecture preset.`,
        };
      }
    },
  );
