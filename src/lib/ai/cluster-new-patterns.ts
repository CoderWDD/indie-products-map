import { ZodError } from "zod";

import { generatedPatternsDataSchema, patternsDataSchema } from "../schemas";
import type { GeneratedPattern, Pattern, Project, UnclusteredProject } from "../types";
import { createUniqueSlug } from "../slug";
import type { AiClient } from "./client";
import { normalizePatternColor, normalizePatternIcon, allowedPatternColors, allowedPatternIcons } from "./pattern-options";

type ClusterNewPatternsOptions = {
  client: AiClient;
  projects: Project[];
  unclusteredProjects: UnclusteredProject[];
  existingPatterns: Pattern[];
  now?: string;
  maxAttempts?: number;
};

export async function clusterNewPatterns({
  client,
  projects,
  unclusteredProjects,
  existingPatterns,
  now = new Date().toISOString(),
  maxAttempts = 3,
}: ClusterNewPatternsOptions) {
  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
  const candidates = unclusteredProjects
    .map((item) => projectBySlug.get(item.projectSlug))
    .filter((project): project is Project => Boolean(project?.aiAnalysis));

  if (candidates.length === 0) {
    return {
      patterns: existingPatterns,
      projects,
      unclusteredProjects,
    };
  }

  const generatedPatterns = await generatePatternsWithRetry({
    client,
    candidates,
    existingPatterns,
    maxAttempts,
  });
  const takenSlugs = new Set(existingPatterns.map((pattern) => pattern.slug));
  const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));
  const patternsToAdd = generatedPatterns.map((generatedPattern, index) => {
    const slug = createUniqueSlug(generatedPattern.name, takenSlugs, generatedPattern.name);
    takenSlugs.add(slug);
    const projectSlugs = uniqueKnownSlugs(generatedPattern.projectSlugs, projectsBySlug);
    const representativeProjectSlugs = uniqueKnownSlugs(
      generatedPattern.representativeProjectSlugs,
      projectsBySlug,
    ).filter((projectSlug) => projectSlugs.includes(projectSlug));

    return {
      slug,
      name: generatedPattern.name,
      description: generatedPattern.description,
      keywords: generatedPattern.keywords,
      icon: normalizePatternIcon(generatedPattern.icon),
      color: normalizePatternColor(generatedPattern.color, existingPatterns.length + index),
      representativeProjectSlugs: representativeProjectSlugs.slice(0, 6),
      projectSlugs,
      createdAt: now,
      updatedAt: now,
    } satisfies Pattern;
  }).filter((pattern) => pattern.projectSlugs.length > 0);

  const assignedProjectSlugs = new Map<string, Pattern>();
  for (const pattern of patternsToAdd) {
    for (const projectSlug of pattern.projectSlugs) {
      assignedProjectSlugs.set(projectSlug, pattern);
    }
  }

  const updatedProjects = projects.map((project) => {
    const pattern = assignedProjectSlugs.get(project.slug);
    if (!pattern || !project.aiAnalysis) {
      return project;
    }

    return {
      ...project,
      aiAnalysis: {
        ...project.aiAnalysis,
        productPatternSlug: pattern.slug,
        productPatternName: pattern.name,
        stale: false,
      },
    };
  });

  const remainingUnclusteredProjects = unclusteredProjects
    .filter((item) => !assignedProjectSlugs.has(item.projectSlug))
    .map((item) => ({ ...item, lastTriedAt: now }));

  return {
    patterns: patternsDataSchema.parse([...existingPatterns, ...patternsToAdd]),
    projects: updatedProjects,
    unclusteredProjects: remainingUnclusteredProjects,
  };
}

async function generatePatternsWithRetry(input: {
  client: AiClient;
  candidates: Project[];
  existingPatterns: Pattern[];
  maxAttempts: number;
}): Promise<GeneratedPattern[]> {
  const errors: string[] = [];
  for (let attempt = 1; attempt <= input.maxAttempts; attempt += 1) {
    try {
      const content = await input.client.completeJson(buildClusterMessages(input.candidates, input.existingPatterns));
      return generatedPatternsDataSchema.parse(JSON.parse(content) as unknown);
    } catch (error) {
      errors.push(formatError(error));
    }
  }

  throw new Error(`AI pattern clustering failed after ${input.maxAttempts} attempts: ${errors.at(-1) ?? "unknown error"}`);
}

function buildClusterMessages(candidates: Project[], existingPatterns: Pattern[]) {
  return [
    {
      role: "system" as const,
      content: [
        "你是产品模式聚类助手，只输出严格 JSON 数组。",
        "从未匹配项目中归纳产品模式，模式名称和说明必须中性克制。",
        "代表项目只表示该模式典型且信息较完整，不代表项目好坏。",
        "不要输出项目成败、收入估算、用户量推断、风险提示或作者动机。",
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          allowedIcons: allowedPatternIcons,
          allowedColors: allowedPatternColors,
          existingPatterns: existingPatterns.map((pattern) => ({
            slug: pattern.slug,
            name: pattern.name,
            keywords: pattern.keywords,
          })),
          outputItemSchema: {
            name: "string",
            description: "one concise sentence",
            keywords: ["1-8 strings"],
            icon: "one allowed icon",
            color: "one allowed color",
            representativeProjectSlugs: ["1-6 project slugs"],
            projectSlugs: ["project slugs included in this pattern"],
          },
          projects: candidates.map((project) => ({
            slug: project.slug,
            name: project.name,
            rawDescription: project.rawDescription,
            aiAnalysis: project.aiAnalysis,
          })),
        },
        null,
        2,
      ),
    },
  ];
}

function uniqueKnownSlugs(slugs: string[], projectsBySlug: Map<string, Project>) {
  return [...new Set(slugs)].filter((slug) => projectsBySlug.has(slug));
}

function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  return error instanceof Error ? error.message : "Unknown clustering error.";
}
