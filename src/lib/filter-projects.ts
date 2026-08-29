import type { LinkStatus, Project } from "./types";

export type ProjectSortKey = "default" | "name" | "lastChecked" | "sourceOrder";

export type ProjectFilters = {
  patternSlugs: string[];
  targetUsers: string[];
  productTypes: string[];
  monetizationMethods: string[];
  linkStatuses: string[];
};

export type ProjectWithLinkStatus = Project & {
  linkStatus?: LinkStatus | null;
};

export const emptyProjectFilters: ProjectFilters = {
  patternSlugs: [],
  targetUsers: [],
  productTypes: [],
  monetizationMethods: [],
  linkStatuses: [],
};

export function filterProjects(
  projects: ProjectWithLinkStatus[],
  filters: ProjectFilters,
) {
  return projects.filter((project) => {
    const analysis = project.aiAnalysis;

    return (
      matchesOne(filters.patternSlugs, analysis?.productPatternSlug ? [analysis.productPatternSlug] : []) &&
      matchesOne(filters.targetUsers, analysis?.targetUsers ?? []) &&
      matchesOne(filters.productTypes, analysis?.productTypes ?? []) &&
      matchesOne(filters.monetizationMethods, analysis?.monetization?.methods ?? []) &&
      matchesOne(filters.linkStatuses, project.linkStatus?.status ? [project.linkStatus.status] : [])
    );
  });
}

export function sortProjects(projects: ProjectWithLinkStatus[], sortKey: ProjectSortKey) {
  return [...projects].sort((a, b) => {
    if (sortKey === "name") {
      return a.name.localeCompare(b.name, "zh-CN");
    }

    if (sortKey === "lastChecked") {
      return getTime(b.linkStatus?.checkedAt) - getTime(a.linkStatus?.checkedAt);
    }

    return a.sourceOrder - b.sourceOrder;
  });
}

export function createFilterOptions(projects: ProjectWithLinkStatus[]) {
  const patternOptions: Array<{ value: string; label: string }> = [];
  for (const project of projects) {
    const analysis = project.aiAnalysis;
    if (analysis?.productPatternSlug && analysis.productPatternName) {
      patternOptions.push({
        value: analysis.productPatternSlug,
        label: analysis.productPatternName,
      });
    }
  }

  return {
    patterns: uniqueOptions(patternOptions),
    targetUsers: uniqueStringOptions(projects.flatMap((project) => project.aiAnalysis?.targetUsers ?? [])),
    productTypes: uniqueStringOptions(projects.flatMap((project) => project.aiAnalysis?.productTypes ?? [])),
    monetizationMethods: uniqueStringOptions(
      projects.flatMap((project) => project.aiAnalysis?.monetization?.methods ?? []),
    ),
    linkStatuses: uniqueStringOptions(
      projects.flatMap((project) => (project.linkStatus?.status ? [project.linkStatus.status] : [])),
    ),
  };
}

function matchesOne(selectedValues: string[], projectValues: string[]) {
  if (selectedValues.length === 0) {
    return true;
  }

  return selectedValues.some((selectedValue) => projectValues.includes(selectedValue));
}

function uniqueStringOptions(values: string[]) {
  return uniqueOptions(values.map((value) => ({ value, label: value })));
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }
    seen.add(option.value);
    return true;
  });
}

function getTime(value: string | undefined) {
  return value ? new Date(value).getTime() : 0;
}
