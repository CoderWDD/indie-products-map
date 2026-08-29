import { ZodError } from "zod";

import { patternClassificationSchema } from "../schemas";
import type { Pattern, PatternClassification, Project } from "../types";
import type { AiClient } from "./client";

type ClassifyProjectPatternOptions = {
  client: AiClient;
  project: Project;
  patterns: Pattern[];
  maxAttempts?: number;
};

export async function classifyProjectPattern({
  client,
  project,
  patterns,
  maxAttempts = 3,
}: ClassifyProjectPatternOptions): Promise<PatternClassification> {
  if (!project.aiAnalysis || project.aiAnalysis.status !== "available") {
    return { matchedPatternSlug: null, reason: "insufficient_information" };
  }

  if (patterns.length === 0) {
    return { matchedPatternSlug: null, reason: "no_matching_pattern" };
  }

  const errors: string[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const content = await client.completeJson(buildClassificationMessages(project, patterns));
      const classification = patternClassificationSchema.parse(parseJsonObject(content));
      if (
        classification.matchedPatternSlug &&
        !patterns.some((pattern) => pattern.slug === classification.matchedPatternSlug)
      ) {
        throw new Error("AI returned an unknown pattern slug.");
      }
      if (classification.reason === "matched" && !classification.matchedPatternSlug) {
        throw new Error("Matched classification must include matchedPatternSlug.");
      }
      return classification;
    } catch (error) {
      errors.push(formatError(error));
    }
  }

  return {
    matchedPatternSlug: null,
    reason:
      errors.some((error) => error.includes("insufficient_information"))
        ? "insufficient_information"
        : "no_matching_pattern",
  };
}

function buildClassificationMessages(project: Project, patterns: Pattern[]) {
  return [
    {
      role: "system" as const,
      content: [
        "你是产品模式分类助手，只输出严格 JSON。",
        "优先匹配已有产品模式；只有确实不适合时才返回 no_matching_pattern。",
        "不要评价项目成败，不要输出收入、用户量或风险判断。",
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          outputSchema: {
            matchedPatternSlug: "existing pattern slug or null",
            reason: "matched | insufficient_information | no_matching_pattern",
          },
          project: {
            slug: project.slug,
            name: project.name,
            rawDescription: project.rawDescription,
            aiAnalysis: project.aiAnalysis,
          },
          existingPatterns: patterns.map((pattern) => ({
            slug: pattern.slug,
            name: pattern.name,
            description: pattern.description,
            keywords: pattern.keywords,
          })),
        },
        null,
        2,
      ),
    },
  ];
}

function parseJsonObject(content: string) {
  const parsed = JSON.parse(content) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response JSON must be an object.");
  }
  return parsed;
}

function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  return error instanceof Error ? error.message : "Unknown classification error.";
}
