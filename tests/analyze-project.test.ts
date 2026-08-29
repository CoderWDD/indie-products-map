import { describe, expect, it } from "vitest";

import { analyzeProject } from "../src/lib/ai/analyze-project";
import type { AiClient } from "../src/lib/ai/client";
import type { HomepageSummary, LinkStatus, Project } from "../src/lib/types";

const now = "2026-08-29T01:00:00.000Z";

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

function project(): Project {
  return {
    id: "project-1",
    slug: "example-app",
    sourceId: "source-1",
    name: "Example App",
    url: "https://example.com/",
    author: "Alice",
    authorUrl: "https://github.com/alice",
    rawDescription: "A focused tool for makers.",
    rawSection: "Section",
    sourceOrder: 0,
    sourceUrl: "https://github.com/example/source#L1",
    inSource: true,
    firstSeenAt: now,
    lastSeenAt: now,
    rawUpdatedAt: now,
    aiAnalysis: null,
  };
}

function homepageSummary(): HomepageSummary {
  return {
    projectSlug: "example-app",
    url: "https://example.com/",
    title: "Example App",
    description: "A focused tool for makers.",
    headings: ["Plan clearly"],
    extractedText: "Example App helps makers plan product ideas clearly.",
    extractedAt: now,
  };
}

function linkStatus(): LinkStatus {
  return {
    projectSlug: "example-app",
    url: "https://example.com/",
    status: "ok",
    httpStatus: 200,
    finalUrl: "https://example.com/",
    checkedAt: now,
    errorMessage: null,
  };
}

function validAnalysisJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    status: "available",
    summary: "一个面向创作者的轻量规划工具。",
    targetUsers: ["独立开发者", "内容创作者"],
    productTypes: ["效率工具"],
    productPatternSlug: "maker-planning-tool",
    productPatternName: "创作者规划工具",
    interpretation:
      "这个产品看起来围绕创作者的早期规划流程展开，可能适合把分散想法整理成可执行的产品方向。",
    inspirationPoints: ["入口聚焦在单一工作流", "信息结构清晰"],
    inspirationQuestions: ["用户最常重复的规划动作是什么？", "哪些信息需要保留为原始事实？"],
    monetization: {
      methods: ["订阅"],
      note: "商业化方式只是基于产品形态的推测。",
    },
    relatedProjectSlugs: [],
    evidenceTypes: ["readme_and_homepage"],
    lowConfidence: false,
    unavailableReason: null,
    stale: false,
    analyzedAt: now,
    ...overrides,
  });
}

describe("analyzeProject", () => {
  it("returns validated analysis from AI JSON", async () => {
    const analysis = await analyzeProject({
      client: mockClient([validAnalysisJson()]),
      project: project(),
      homepageSummary: homepageSummary(),
      linkStatus: linkStatus(),
      now,
    });

    expect(analysis.status).toBe("available");
    expect(analysis.analyzedAt).toBe(now);
    expect(analysis.stale).toBe(false);
  });

  it("retries invalid JSON before returning a valid analysis", async () => {
    const analysis = await analyzeProject({
      client: mockClient(["not json", validAnalysisJson()]),
      project: project(),
      homepageSummary: homepageSummary(),
      linkStatus: linkStatus(),
      now,
      maxAttempts: 2,
    });

    expect(analysis.status).toBe("available");
  });

  it("returns unavailable analysis after repeated validation failures", async () => {
    const analysis = await analyzeProject({
      client: mockClient(["{}", "{}"]),
      project: project(),
      now,
      maxAttempts: 2,
    });

    expect(analysis).toMatchObject({
      status: "unavailable",
      summary: null,
      lowConfidence: true,
      analyzedAt: now,
      evidenceTypes: ["readme_only"],
    });
    expect(analysis.unavailableReason).toContain("AI analysis failed");
  });

  it("rejects forbidden analysis content and falls back to unavailable", async () => {
    const analysis = await analyzeProject({
      client: mockClient([
        validAnalysisJson({
          summary: "这是一个成功项目。",
        }),
      ]),
      project: project(),
      now,
      maxAttempts: 1,
    });

    expect(analysis.status).toBe("unavailable");
    expect(analysis.unavailableReason).toContain("forbidden content");
  });
});
