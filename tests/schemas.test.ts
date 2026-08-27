import { describe, expect, it } from "vitest";

import {
  aiAnalysisSchema,
  homepageSummarySchema,
  latestUpdateSchema,
  linkStatusSchema,
  patternSchema,
  projectSchema,
  sourceProjectSchema,
} from "../src/lib/schemas";

const now = "2026-08-27T14:30:00.000Z";
const sourceUrl = "https://github.com/1c7/chinese-independent-developer";

describe("data schemas", () => {
  it("accepts a valid source project", () => {
    expect(() =>
      sourceProjectSchema.parse({
        sourceId: "source-1",
        name: "Example Product",
        url: "https://example.com",
        author: "Example Author",
        authorUrl: "https://example.com/about",
        rawDescription: "A short original description.",
        rawSection: "Products",
        sourceOrder: 0,
        sourceLine: 12,
        sourceUrl,
        parseFailed: false,
        parseError: null,
        rawText: "- [Example Product](https://example.com) - description",
      }),
    ).not.toThrow();
  });

  it("rejects invalid source URLs", () => {
    expect(() =>
      sourceProjectSchema.parse({
        sourceId: "source-1",
        name: "Example Product",
        url: "not-a-url",
        author: null,
        authorUrl: null,
        rawDescription: "",
        rawSection: null,
        sourceOrder: 0,
        sourceLine: null,
        sourceUrl,
        parseFailed: false,
        parseError: null,
        rawText: "Example Product",
      }),
    ).toThrow();
  });

  it("accepts valid AI analysis without forbidden factual metrics", () => {
    const analysis = aiAnalysisSchema.parse({
      status: "available",
      summary: "A concise product summary.",
      targetUsers: ["Independent developers"],
      productTypes: ["SaaS"],
      productPatternSlug: "developer-tool",
      productPatternName: "Developer Tool",
      interpretation: "Looks like a focused utility for a clear workflow.",
      inspirationPoints: ["Narrow entry point", "Clear user context"],
      inspirationQuestions: ["What workflow is repeated most often?"],
      monetization: {
        methods: ["Subscription"],
        note: "This is a monetization guess for inspiration only.",
      },
      relatedProjectSlugs: ["another-tool"],
      evidenceTypes: ["readme_and_homepage"],
      lowConfidence: false,
      unavailableReason: null,
      stale: false,
      analyzedAt: now,
    });

    expect(analysis).not.toHaveProperty("revenueEstimate");
    expect(analysis).not.toHaveProperty("userScale");
    expect(analysis).not.toHaveProperty("risk");
  });

  it("rejects invalid project slugs", () => {
    expect(() =>
      projectSchema.parse({
        id: "project-1",
        slug: "Invalid Slug",
        sourceId: "source-1",
        name: "Example Product",
        url: "https://example.com",
        author: null,
        authorUrl: null,
        rawDescription: "Original description.",
        rawSection: null,
        sourceOrder: 0,
        sourceUrl,
        inSource: true,
        firstSeenAt: now,
        lastSeenAt: now,
        rawUpdatedAt: now,
        aiAnalysis: null,
      }),
    ).toThrow();
  });

  it("accepts valid pattern, link, homepage, and update records", () => {
    expect(() =>
      patternSchema.parse({
        slug: "developer-tool",
        name: "Developer Tool",
        description: "Tools that help developers complete focused work.",
        keywords: ["developer", "workflow"],
        icon: "Wrench",
        color: "#2563eb",
        representativeProjectSlugs: ["example-product"],
        projectSlugs: ["example-product"],
        createdAt: now,
        updatedAt: now,
      }),
    ).not.toThrow();

    expect(() =>
      linkStatusSchema.parse({
        projectSlug: "example-product",
        url: "https://example.com",
        status: "ok",
        httpStatus: 200,
        finalUrl: "https://example.com",
        checkedAt: now,
        errorMessage: null,
      }),
    ).not.toThrow();

    expect(() =>
      homepageSummarySchema.parse({
        projectSlug: "example-product",
        url: "https://example.com",
        title: "Example Product",
        description: "Short homepage description.",
        headings: ["Example Product"],
        extractedText: "Short extracted text only.",
        extractedAt: now,
      }),
    ).not.toThrow();

    expect(() =>
      latestUpdateSchema.parse({
        schemaVersion: 1,
        sourceUrl,
        fetchedAt: now,
        updatedAt: now,
        counts: {
          sourceProjects: 1,
          projects: 1,
          patterns: 1,
          aiAnalyzedProjects: 1,
        },
        changes: {
          added: [{ sourceId: "source-1", projectSlug: "example-product", name: "Example Product" }],
          removed: [],
          changed: [],
          unchanged: [],
        },
      }),
    ).not.toThrow();
  });
});
