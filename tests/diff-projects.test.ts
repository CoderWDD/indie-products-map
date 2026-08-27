import { describe, expect, it } from "vitest";

import { updateProjectsFromSource } from "../src/lib/diff-projects";
import type { AiAnalysis, Project, SourceProject } from "../src/lib/types";

const now = "2026-08-27T14:00:00.000Z";
const later = "2026-08-28T14:00:00.000Z";
const sourceUrl = "https://github.com/1c7/chinese-independent-developer/blob/master/README.md";

function sourceProject(overrides: Partial<SourceProject> = {}): SourceProject {
  return {
    sourceId: "source-1",
    name: "Example App",
    url: "https://example.com/",
    author: "Alice",
    authorUrl: "https://github.com/alice",
    rawDescription: "Original description.",
    rawSection: "Section",
    sourceOrder: 0,
    sourceLine: 10,
    sourceUrl: `${sourceUrl}#L10`,
    parseFailed: false,
    parseError: null,
    rawText: "* [Example App](https://example.com/)：Original description.",
    ...overrides,
  };
}

function analysis(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    status: "available",
    summary: "Summary.",
    targetUsers: ["Developers"],
    productTypes: ["Tool"],
    productPatternSlug: "developer-tool",
    productPatternName: "Developer Tool",
    interpretation: "Interpretation.",
    inspirationPoints: ["Point"],
    inspirationQuestions: ["Question"],
    monetization: {
      methods: ["Subscription"],
      note: "Possible monetization.",
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
    slug: "example-app",
    sourceId: "source-1",
    name: "Example App",
    url: "https://example.com/",
    author: "Alice",
    authorUrl: "https://github.com/alice",
    rawDescription: "Original description.",
    rawSection: "Section",
    sourceOrder: 0,
    sourceUrl: `${sourceUrl}#L10`,
    inSource: true,
    firstSeenAt: now,
    lastSeenAt: now,
    rawUpdatedAt: now,
    aiAnalysis: null,
    ...overrides,
  };
}

describe("updateProjectsFromSource", () => {
  it("creates projects and stable slugs for new source entries", () => {
    const result = updateProjectsFromSource([sourceProject()], [], {
      now,
      sourceUrl,
    });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      slug: "example-app",
      inSource: true,
      firstSeenAt: now,
      lastSeenAt: now,
    });
    expect(result.latestUpdate.changes.added).toHaveLength(1);
    expect(result.latestUpdate.counts.projects).toBe(1);
  });

  it("preserves the slug when a project name changes but URL stays the same", () => {
    const result = updateProjectsFromSource(
      [
        sourceProject({
          sourceId: "source-renamed",
          name: "Renamed App",
          rawText: "* [Renamed App](https://example.com/)：Original description.",
        }),
      ],
      [project({ slug: "example-app" })],
      { now: later, sourceUrl },
    );

    expect(result.projects[0]).toMatchObject({
      slug: "example-app",
      sourceId: "source-renamed",
      name: "Renamed App",
      inSource: true,
    });
    expect(result.latestUpdate.changes.changed).toHaveLength(1);
  });

  it("keeps removed projects and marks them as outside the source list", () => {
    const result = updateProjectsFromSource([], [project()], { now: later, sourceUrl });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      slug: "example-app",
      inSource: false,
    });
    expect(result.latestUpdate.changes.removed).toEqual([
      { sourceId: "source-1", projectSlug: "example-app", name: "Example App" },
    ]);
  });

  it("marks existing AI analysis stale when raw source information changes", () => {
    const result = updateProjectsFromSource(
      [sourceProject({ rawDescription: "Updated description." })],
      [project({ aiAnalysis: analysis() })],
      { now: later, sourceUrl },
    );

    expect(result.projects[0].rawDescription).toBe("Updated description.");
    expect(result.projects[0].rawUpdatedAt).toBe(later);
    expect(result.projects[0].aiAnalysis?.stale).toBe(true);
    expect(result.latestUpdate.changes.changed).toHaveLength(1);
  });

  it("leaves unchanged projects out of the changed list", () => {
    const result = updateProjectsFromSource([sourceProject()], [project()], {
      now: later,
      sourceUrl,
    });

    expect(result.projects[0].rawUpdatedAt).toBe(now);
    expect(result.latestUpdate.changes.changed).toHaveLength(0);
    expect(result.latestUpdate.changes.unchanged).toHaveLength(1);
  });
});
