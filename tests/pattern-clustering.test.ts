import { describe, expect, it } from "vitest";

import { classifyProjectPattern } from "../src/lib/ai/classify-pattern";
import { clusterNewPatterns } from "../src/lib/ai/cluster-new-patterns";
import type { AiClient } from "../src/lib/ai/client";
import type { AiAnalysis, Pattern, Project, UnclusteredProject } from "../src/lib/types";

const now = "2026-08-29T10:00:00.000Z";

function mockClient(responses: string[]): AiClient {
  let index = 0;
  return {
    async completeJson() {
      const response = responses[index];
      index += 1;
      if (response === undefined) {
        throw new Error("No mock response configured.");
      }
      return response;
    },
  };
}

function analysis(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    status: "available",
    summary: "面向写作者的内容整理工具。",
    targetUsers: ["写作者"],
    productTypes: ["内容工具"],
    productPatternSlug: null,
    productPatternName: null,
    interpretation: "这个产品看起来围绕写作者的内容整理流程展开，可能帮助用户沉淀材料。",
    inspirationPoints: ["工作流入口清晰"],
    inspirationQuestions: ["哪些材料最值得结构化？"],
    monetization: {
      methods: ["订阅"],
      note: "商业化方式只是推测。",
    },
    relatedProjectSlugs: [],
    evidenceTypes: ["readme_only"],
    lowConfidence: false,
    unavailableReason: null,
    stale: false,
    analyzedAt: now,
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "source-1",
    slug: "writing-tool",
    sourceId: "source-1",
    name: "Writing Tool",
    url: "https://example.com/",
    author: "Alice",
    authorUrl: "https://github.com/alice",
    rawDescription: "帮助写作者整理内容素材。",
    rawSection: "Section",
    sourceOrder: 0,
    sourceUrl: "https://github.com/example/source#L1",
    inSource: true,
    firstSeenAt: now,
    lastSeenAt: now,
    rawUpdatedAt: now,
    aiAnalysis: analysis(),
    ...overrides,
  };
}

function pattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    slug: "content-workflow",
    name: "内容工作流",
    description: "帮助创作者整理、加工或发布内容的产品。",
    keywords: ["内容", "写作"],
    icon: "FileText",
    color: "#2563eb",
    representativeProjectSlugs: ["writing-tool"],
    projectSlugs: ["writing-tool"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("pattern clustering", () => {
  it("matches analyzed projects to existing patterns", async () => {
    const classification = await classifyProjectPattern({
      client: mockClient([
        JSON.stringify({
          matchedPatternSlug: "content-workflow",
          reason: "matched",
        }),
      ]),
      project: project(),
      patterns: [pattern()],
    });

    expect(classification).toEqual({
      matchedPatternSlug: "content-workflow",
      reason: "matched",
    });
  });

  it("returns no matching pattern when no existing patterns are available", async () => {
    const classification = await classifyProjectPattern({
      client: mockClient([]),
      project: project(),
      patterns: [],
    });

    expect(classification).toEqual({
      matchedPatternSlug: null,
      reason: "no_matching_pattern",
    });
  });

  it("creates fixed patterns from unclustered projects and assigns projects", async () => {
    const unclustered: UnclusteredProject[] = [
      {
        projectSlug: "writing-tool",
        reason: "no_matching_pattern",
        addedAt: now,
        lastTriedAt: null,
      },
    ];
    const result = await clusterNewPatterns({
      client: mockClient([
        JSON.stringify([
          {
            name: "内容工作流",
            description: "围绕创作者内容整理与加工流程的产品。",
            keywords: ["内容", "写作"],
            icon: "FileText",
            color: "#2563eb",
            representativeProjectSlugs: ["writing-tool"],
            projectSlugs: ["writing-tool"],
          },
        ]),
      ]),
      projects: [project()],
      unclusteredProjects: unclustered,
      existingPatterns: [],
      now,
    });

    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0]).toMatchObject({
      name: "内容工作流",
      representativeProjectSlugs: ["writing-tool"],
    });
    expect(result.patterns[0].slug).toMatch(/^project-[a-f0-9]{6}$/);
    expect(result.projects[0].aiAnalysis?.productPatternSlug).toBe(result.patterns[0].slug);
    expect(result.unclusteredProjects).toHaveLength(0);
  });

  it("throws when generated pattern output does not pass schema validation", async () => {
    await expect(
      clusterNewPatterns({
        client: mockClient([JSON.stringify([{ name: "" }])]),
        projects: [project()],
        unclusteredProjects: [
          {
            projectSlug: "writing-tool",
            reason: "no_matching_pattern",
            addedAt: now,
            lastTriedAt: null,
          },
        ],
        existingPatterns: [],
        now,
        maxAttempts: 1,
      }),
    ).rejects.toThrow("AI pattern clustering failed");
  });
});
