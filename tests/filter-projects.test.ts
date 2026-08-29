import { describe, expect, it } from "vitest";

import {
  filterProjects,
  sortProjects,
  type ProjectFilters,
  type ProjectWithLinkStatus,
} from "../src/lib/filter-projects";
import { searchProjects } from "../src/lib/search";
import type { AiAnalysis } from "../src/lib/types";

const now = "2026-08-29T12:00:00.000Z";

const emptyFilters: ProjectFilters = {
  patternSlugs: [],
  targetUsers: [],
  productTypes: [],
  monetizationMethods: [],
  linkStatuses: [],
};

function analysis(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    status: "available",
    summary: "面向写作者的内容整理工具。",
    targetUsers: ["写作者"],
    productTypes: ["内容工具"],
    productPatternSlug: "content-workflow",
    productPatternName: "内容工作流",
    interpretation: "这个产品看起来围绕内容整理流程展开，可能帮助用户沉淀材料。",
    inspirationPoints: ["入口清晰"],
    inspirationQuestions: ["哪些材料需要结构化？"],
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

function project(
  slug: string,
  overrides: Partial<ProjectWithLinkStatus> = {},
): ProjectWithLinkStatus {
  return {
    id: slug,
    slug,
    sourceId: slug,
    name: slug,
    url: `https://${slug}.example.com/`,
    author: "Alice",
    authorUrl: null,
    rawDescription: "Original description.",
    rawSection: "Section",
    sourceOrder: 0,
    sourceUrl: "https://github.com/example/source#L1",
    inSource: true,
    firstSeenAt: now,
    lastSeenAt: now,
    rawUpdatedAt: now,
    aiAnalysis: analysis(),
    linkStatus: {
      projectSlug: slug,
      url: `https://${slug}.example.com/`,
      status: "ok",
      httpStatus: 200,
      finalUrl: `https://${slug}.example.com/`,
      checkedAt: now,
      errorMessage: null,
    },
    ...overrides,
  };
}

describe("project filtering and sorting", () => {
  it("uses OR inside a filter dimension", () => {
    const projects = [
      project("first", { aiAnalysis: analysis({ productTypes: ["内容工具"] }) }),
      project("second", { aiAnalysis: analysis({ productTypes: ["开发工具"] }) }),
      project("third", { aiAnalysis: analysis({ productTypes: ["教育工具"] }) }),
    ];

    const result = filterProjects(projects, {
      ...emptyFilters,
      productTypes: ["内容工具", "开发工具"],
    });

    expect(result.map((item) => item.slug)).toEqual(["first", "second"]);
  });

  it("uses AND across different filter dimensions", () => {
    const projects = [
      project("first", {
        aiAnalysis: analysis({ targetUsers: ["写作者"], productTypes: ["内容工具"] }),
      }),
      project("second", {
        aiAnalysis: analysis({ targetUsers: ["开发者"], productTypes: ["内容工具"] }),
      }),
    ];

    const result = filterProjects(projects, {
      ...emptyFilters,
      targetUsers: ["写作者"],
      productTypes: ["内容工具"],
    });

    expect(result.map((item) => item.slug)).toEqual(["first"]);
  });

  it("applies filters after Fuse search results", () => {
    const projects = [
      project("writer-tool", {
        name: "Writer Tool",
        rawDescription: "Plan essays",
        aiAnalysis: analysis({ productTypes: ["内容工具"] }),
      }),
      project("writer-dev", {
        name: "Writer Dev",
        rawDescription: "Plan essays",
        aiAnalysis: analysis({ productTypes: ["开发工具"] }),
      }),
    ];

    const searched = searchProjects(projects, "writer");
    const result = filterProjects(searched, {
      ...emptyFilters,
      productTypes: ["开发工具"],
    });

    expect(result.map((item) => item.slug)).toEqual(["writer-dev"]);
  });

  it("sorts by name, last checked, and source order", () => {
    const projects = [
      project("b", { name: "Beta", sourceOrder: 2, linkStatus: { ...project("b").linkStatus!, checkedAt: "2026-08-28T00:00:00.000Z" } }),
      project("a", { name: "Alpha", sourceOrder: 1, linkStatus: { ...project("a").linkStatus!, checkedAt: "2026-08-29T00:00:00.000Z" } }),
    ];

    expect(sortProjects(projects, "name").map((item) => item.slug)).toEqual(["a", "b"]);
    expect(sortProjects(projects, "lastChecked").map((item) => item.slug)).toEqual(["a", "b"]);
    expect(sortProjects(projects, "sourceOrder").map((item) => item.slug)).toEqual(["a", "b"]);
  });
});
