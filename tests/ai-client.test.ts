import { describe, expect, it, vi } from "vitest";

import {
  createAiClientFromEnv,
  MissingAiConfigError,
  OpenAiCompatibleClient,
} from "../src/lib/ai/client";

describe("createAiClientFromEnv", () => {
  it("reports missing AI environment variables clearly", () => {
    expect(() => createAiClientFromEnv({})).toThrow(MissingAiConfigError);
    expect(() => createAiClientFromEnv({})).toThrow(
      "Missing AI configuration: AI_BASE_URL, AI_API_KEY, AI_MODEL.",
    );
  });
});

describe("OpenAiCompatibleClient", () => {
  it("uses chat completions by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{\"ok\":true}" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenAiCompatibleClient({
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "test-model",
    });

    await expect(client.completeJson([{ role: "user", content: "Return JSON" }])).resolves.toBe(
      "{\"ok\":true}",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.any(Object),
    );

    vi.unstubAllGlobals();
  });

  it("can use the responses api format", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: "{\"ok\":true}" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenAiCompatibleClient({
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "test-model",
      apiFormat: "responses",
    });

    await expect(client.completeJson([{ role: "user", content: "Return JSON" }])).resolves.toBe(
      "{\"ok\":true}",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/responses",
      expect.objectContaining({
        body: expect.stringContaining('"text":{"format":{"type":"json_object"}}'),
      }),
    );

    vi.unstubAllGlobals();
  });
});
