import "./load-env";

import { classifyProjectPattern } from "../src/lib/ai/classify-pattern";
import { createAiClientFromEnv, MissingAiConfigError } from "../src/lib/ai/client";
import type { Project, UnclusteredProject } from "../src/lib/types";
import {
  getLimitArg,
  readPatterns,
  readProjects,
  readUnclusteredProjects,
  updateLatestAiCount,
  updateLatestPatternCount,
  writePatterns,
  writeProjects,
  writeUnclusteredProjects,
} from "./ai-script-utils";

async function main() {
  const projects = await readProjects();
  const patterns = await readPatterns();
  const unclusteredProjects = await readUnclusteredProjects();
  const candidates = selectClusterCandidates(projects, unclusteredProjects, getLimitArg());

  if (candidates.length === 0) {
    console.log("No analyzed projects need pattern classification.");
    return;
  }

  const client = createAiClientFromEnv();
  const unclusteredBySlug = new Map(
    unclusteredProjects.map((item) => [item.projectSlug, item]),
  );
  const now = new Date().toISOString();
  let matchedCount = 0;
  let unclusteredCount = 0;

  for (const candidate of candidates) {
    const classification = await classifyProjectPattern({
      client,
      project: candidate.project,
      patterns,
    });

    if (classification.matchedPatternSlug && classification.reason === "matched") {
      const patternIndex = patterns.findIndex(
        (pattern) => pattern.slug === classification.matchedPatternSlug,
      );
      const patternName = patternIndex === -1 ? null : patterns[patternIndex].name;
      projects[candidate.index] = assignPattern(
        candidate.project,
        classification.matchedPatternSlug,
        patternName,
      );
      if (patternIndex !== -1) {
        patterns[patternIndex] = {
          ...patterns[patternIndex],
          projectSlugs: [
            ...new Set([...patterns[patternIndex].projectSlugs, candidate.project.slug]),
          ],
          updatedAt: now,
        };
      }
      unclusteredBySlug.delete(candidate.project.slug);
      matchedCount += 1;
      continue;
    }

    unclusteredBySlug.set(candidate.project.slug, {
      projectSlug: candidate.project.slug,
      reason:
        classification.reason === "insufficient_information"
          ? "insufficient_information"
          : "no_matching_pattern",
      addedAt: unclusteredBySlug.get(candidate.project.slug)?.addedAt ?? now,
      lastTriedAt: now,
    });
    unclusteredCount += 1;
  }

  await writeProjects(projects);
  await writePatterns(patterns);
  await writeUnclusteredProjects([...unclusteredBySlug.values()]);
  await updateLatestAiCount(projects);
  await updateLatestPatternCount(patterns);
  console.log(
    `Classified ${candidates.length} analyzed projects. Matched ${matchedCount}. Unclustered ${unclusteredCount}.`,
  );
}

function selectClusterCandidates(
  projects: Project[],
  unclusteredProjects: UnclusteredProject[],
  limit: number | null,
) {
  const unclusteredSlugs = new Set(unclusteredProjects.map((item) => item.projectSlug));
  const candidates = projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => {
      if (project.aiAnalysis?.status !== "available") {
        return false;
      }

      return !project.aiAnalysis.productPatternSlug && !unclusteredSlugs.has(project.slug);
    });

  return limit === null ? candidates : candidates.slice(0, limit);
}

function assignPattern(project: Project, patternSlug: string, patternName: string | null): Project {
  if (!project.aiAnalysis) {
    return project;
  }

  return {
    ...project,
    aiAnalysis: {
      ...project.aiAnalysis,
      productPatternSlug: patternSlug,
      productPatternName: patternName,
      stale: false,
    },
  };
}

main().catch((error: unknown) => {
  if (error instanceof MissingAiConfigError) {
    console.error(
      `${error.message} Set AI_BASE_URL, AI_API_KEY, and AI_MODEL before running clustering.`,
    );
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
