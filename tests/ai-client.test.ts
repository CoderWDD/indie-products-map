import { describe, expect, it } from "vitest";

import { createAiClientFromEnv, MissingAiConfigError } from "../src/lib/ai/client";

describe("createAiClientFromEnv", () => {
  it("reports missing AI environment variables clearly", () => {
    expect(() => createAiClientFromEnv({})).toThrow(MissingAiConfigError);
    expect(() => createAiClientFromEnv({})).toThrow(
      "Missing AI configuration: AI_BASE_URL, AI_API_KEY, AI_MODEL.",
    );
  });
});
