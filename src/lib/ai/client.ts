export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type AiClient = {
  completeJson(messages: ChatMessage[]): Promise<string>;
};

type OpenAiCompatibleClientOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class MissingAiConfigError extends Error {
  constructor(missingKeys: string[]) {
    super(`Missing AI configuration: ${missingKeys.join(", ")}.`);
    this.name = "MissingAiConfigError";
  }
}

export function createAiClientFromEnv(env = process.env): AiClient {
  const missingKeys = ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"].filter(
    (key) => !env[key],
  );

  if (missingKeys.length > 0) {
    throw new MissingAiConfigError(missingKeys);
  }

  return new OpenAiCompatibleClient({
    baseUrl: env.AI_BASE_URL as string,
    apiKey: env.AI_API_KEY as string,
    model: env.AI_MODEL as string,
  });
}

export class OpenAiCompatibleClient implements AiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: OpenAiCompatibleClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  async completeJson(messages: ChatMessage[]) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI response did not include message content.");
    }

    return content;
  }
}
