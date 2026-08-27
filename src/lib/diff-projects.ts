import {
  latestUpdateSchema,
  projectsDataSchema,
  sourceProjectsDataSchema,
} from "./schemas";
import { SOURCE_README_PAGE_URL } from "./source-parser";
import type { AiAnalysis, LatestUpdate, Project, SourceProject } from "./types";
import { createUniqueSlug } from "./slug";

type UpdateProjectsOptions = {
  now?: string;
  sourceUrl?: string;
};

type UpdateProjectsResult = {
  projects: Project[];
  latestUpdate: LatestUpdate;
};

const sourceFields = [
  "sourceId",
  "name",
  "url",
  "author",
  "authorUrl",
  "rawDescription",
  "rawSection",
  "sourceOrder",
  "sourceUrl",
] as const;

export function updateProjectsFromSource(
  sourceProjectsInput: SourceProject[],
  existingProjectsInput: Project[],
  options: UpdateProjectsOptions = {},
): UpdateProjectsResult {
  const sourceProjects = sourceProjectsDataSchema.parse(sourceProjectsInput);
  const existingProjects = projectsDataSchema.parse(existingProjectsInput);
  const now = options.now ?? new Date().toISOString();
  const sourceUrl = options.sourceUrl ?? SOURCE_README_PAGE_URL;
  const takenSlugs = new Set(existingProjects.map((project) => project.slug));
  const matchedProjectIds = new Set<string>();
  const projectsBySourceId = new Map(
    existingProjects.map((project) => [project.sourceId, project]),
  );
  const projectsByUrl = new Map(
    existingProjects
      .filter((project) => project.url !== null)
      .map((project) => [project.url as string, project]),
  );
  const updatedProjects: Project[] = [];
  const latestUpdate: LatestUpdate = {
    schemaVersion: 1,
    sourceUrl,
    fetchedAt: now,
    updatedAt: now,
    counts: {
      sourceProjects: sourceProjects.length,
      projects: 0,
      patterns: 0,
      aiAnalyzedProjects: 0,
    },
    changes: {
      added: [],
      removed: [],
      changed: [],
      unchanged: [],
    },
  };

  for (const sourceProject of sourceProjects) {
    const existingProject =
      projectsBySourceId.get(sourceProject.sourceId) ??
      (sourceProject.url ? projectsByUrl.get(sourceProject.url) : undefined);

    if (!existingProject) {
      const slug = createUniqueSlug(
        sourceProject.name,
        takenSlugs,
        `${sourceProject.name}|${sourceProject.url ?? sourceProject.sourceId}`,
      );
      takenSlugs.add(slug);

      const project = createProjectFromSource(sourceProject, slug, now);
      updatedProjects.push(project);
      latestUpdate.changes.added.push(toUpdateChange(sourceProject, project.slug));
      continue;
    }

    matchedProjectIds.add(existingProject.id);
    const changed = hasSourceChanges(existingProject, sourceProject);
    const project = mergeProjectWithSource(existingProject, sourceProject, now, changed);
    updatedProjects.push(project);

    if (changed) {
      latestUpdate.changes.changed.push(toUpdateChange(sourceProject, project.slug));
    } else {
      latestUpdate.changes.unchanged.push(toUpdateChange(sourceProject, project.slug));
    }
  }

  for (const existingProject of existingProjects) {
    if (matchedProjectIds.has(existingProject.id)) {
      continue;
    }

    updatedProjects.push({
      ...existingProject,
      inSource: false,
    });
    latestUpdate.changes.removed.push({
      sourceId: existingProject.sourceId,
      projectSlug: existingProject.slug,
      name: existingProject.name,
    });
  }

  const sortedProjects = updatedProjects.sort((a, b) => {
    if (a.inSource !== b.inSource) {
      return a.inSource ? -1 : 1;
    }
    return a.sourceOrder - b.sourceOrder;
  });

  latestUpdate.counts.projects = sortedProjects.length;
  latestUpdate.counts.aiAnalyzedProjects = sortedProjects.filter(
    (project) => project.aiAnalysis?.status === "available",
  ).length;

  return {
    projects: projectsDataSchema.parse(sortedProjects),
    latestUpdate: latestUpdateSchema.parse(latestUpdate),
  };
}

function createProjectFromSource(
  sourceProject: SourceProject,
  slug: string,
  now: string,
): Project {
  return {
    id: sourceProject.sourceId,
    slug,
    sourceId: sourceProject.sourceId,
    name: sourceProject.name,
    url: sourceProject.url,
    author: sourceProject.author,
    authorUrl: sourceProject.authorUrl,
    rawDescription: sourceProject.rawDescription,
    rawSection: sourceProject.rawSection,
    sourceOrder: sourceProject.sourceOrder,
    sourceUrl: sourceProject.sourceUrl,
    inSource: true,
    firstSeenAt: now,
    lastSeenAt: now,
    rawUpdatedAt: now,
    aiAnalysis: null,
  };
}

function mergeProjectWithSource(
  project: Project,
  sourceProject: SourceProject,
  now: string,
  changed: boolean,
): Project {
  return {
    ...project,
    sourceId: sourceProject.sourceId,
    name: sourceProject.name,
    url: sourceProject.url,
    author: sourceProject.author,
    authorUrl: sourceProject.authorUrl,
    rawDescription: sourceProject.rawDescription,
    rawSection: sourceProject.rawSection,
    sourceOrder: sourceProject.sourceOrder,
    sourceUrl: sourceProject.sourceUrl,
    inSource: true,
    lastSeenAt: now,
    rawUpdatedAt: changed ? now : project.rawUpdatedAt,
    aiAnalysis:
      changed && project.aiAnalysis
        ? markAnalysisStale(project.aiAnalysis)
        : project.aiAnalysis,
  };
}

function hasSourceChanges(project: Project, sourceProject: SourceProject) {
  return sourceFields.some((field) => project[field] !== sourceProject[field]);
}

function markAnalysisStale(aiAnalysis: AiAnalysis): AiAnalysis {
  return {
    ...aiAnalysis,
    stale: true,
  };
}

function toUpdateChange(sourceProject: SourceProject, projectSlug: string) {
  return {
    sourceId: sourceProject.sourceId,
    projectSlug,
    name: sourceProject.name,
  };
}
