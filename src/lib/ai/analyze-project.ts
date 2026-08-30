import { ZodError } from "zod";

import { aiAnalysisSchema } from "../schemas";
import type { AiAnalysis, HomepageSummary, LinkStatus, Project } from "../types";
import type { AiClient } from "./client";
import { buildAnalyzeProjectMessages } from "./prompts";

type AnalyzeProjectOptions = {
  client: AiClient;
  project: Project;
  homepageSummary?: HomepageSummary | null;
  linkStatus?: LinkStatus | null;
  now?: string;
  maxAttempts?: number;
};

const forbiddenOutputPatterns = [
  /风险/,
  /失败/,
  /成功/,
  /收入/,
  /用户规模/,
  /用户量/,
  /动机/,
  /攻击/,
];

export async function analyzeProject({
  client,
  project,
  homepageSummary = null,
  linkStatus = null,
  now = new Date().toISOString(),
  maxAttempts = 3,
}: AnalyzeProjectOptions): Promise<AiAnalysis> {
  const messages = buildAnalyzeProjectMessages({ project, homepageSummary, linkStatus });
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const content = await client.completeJson(messages);
      const parsed = parseAiJson(content);
      const analysis = aiAnalysisSchema.parse({
        ...parsed,
        productPatternSlug: null,
        productPatternName: null,
        status: "available",
        stale: false,
        analyzedAt: now,
      });
      assertAllowedAnalysisText(analysis);
      return analysis;
    } catch (error) {
      errors.push(formatAnalysisError(error));
    }
  }

  return createUnavailableAnalysis(
    `AI analysis failed after ${maxAttempts} attempts: ${errors.at(-1) ?? "unknown error"}`,
    now,
    homepageSummary,
  );
}

export function createUnavailableAnalysis(
  reason: string,
  now: string,
  homepageSummary: HomepageSummary | null = null,
): AiAnalysis {
  return aiAnalysisSchema.parse({
    status: "unavailable",
    summary: null,
    targetUsers: [],
    productTypes: [],
    productPatternSlug: null,
    productPatternName: null,
    interpretation: null,
    inspirationPoints: [],
    inspirationQuestions: [],
    monetization: null,
    relatedProjectSlugs: [],
    evidenceTypes: [homepageSummary ? "readme_and_homepage" : "readme_only"],
    lowConfidence: true,
    unavailableReason: reason,
    stale: false,
    analyzedAt: now,
  });
}

function parseAiJson(content: string): Record<string, unknown> {
  try {
    return ensureJsonObject(JSON.parse(content) as unknown);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response was not valid JSON.");
    }
    return ensureJsonObject(JSON.parse(match[0]) as unknown);
  }
}

function ensureJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI response JSON must be an object.");
  }

  return value as Record<string, unknown>;
}

function assertAllowedAnalysisText(analysis: AiAnalysis) {
  const text = JSON.stringify(analysis);
  const matchedPattern = forbiddenOutputPatterns.find((pattern) => pattern.test(text));
  if (matchedPattern) {
    throw new Error("AI response included forbidden content.");
  }
}

function formatAnalysisError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");
  }

  return error instanceof Error ? error.message : "Unknown analysis error.";
}
