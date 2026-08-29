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
  apiFormat?: AiApiFormat;
};

export type AiApiFormat = "chat_completions" | "responses";

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
    apiFormat: parseAiApiFormat(env.AI_API_FORMAT),
  });
}

export class OpenAiCompatibleClient implements AiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiFormat: AiApiFormat;

  constructor(options: OpenAiCompatibleClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.apiFormat = options.apiFormat ?? "chat_completions";
  }

  async completeJson(messages: ChatMessage[]) {
    if (this.apiFormat === "responses") {
      return this.completeJsonWithResponsesApi(messages);
    }

    return this.completeJsonWithChatCompletionsApi(messages);
  }

  private async completeJsonWithChatCompletionsApi(messages: ChatMessage[]) {
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

  private async completeJsonWithResponsesApi(messages: ChatMessage[]) {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        temperature: 0.2,
        text: {
          format: { type: "json_object" },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ResponsesApiResponse;
    const content = extractResponsesApiText(data);
    if (!content) {
      throw new Error("AI response did not include output text.");
    }

    return content;
  }
}

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function parseAiApiFormat(value: string | undefined): AiApiFormat {
  if (!value || value === "chat_completions") {
    return "chat_completions";
  }

  if (value === "responses") {
    return "responses";
  }

  throw new Error(
    `Invalid AI_API_FORMAT: ${value}. Expected "chat_completions" or "responses".`,
  );
}

function extractResponsesApiText(data: ResponsesApiResponse) {
  if (data.output_text) {
    return data.output_text;
  }

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .find((text): text is string => Boolean(text));
}
