import "./load-env";

import { clusterNewPatterns } from "../src/lib/ai/cluster-new-patterns";
import { createAiClientFromEnv, MissingAiConfigError } from "../src/lib/ai/client";
import {
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

  if (unclusteredProjects.length === 0) {
    console.log("No unclustered projects to process.");
    return;
  }

  const client = createAiClientFromEnv();
  const result = await clusterNewPatterns({
    client,
    projects,
    unclusteredProjects,
    existingPatterns: patterns,
  });

  await writeProjects(result.projects);
  await writePatterns(result.patterns);
  await writeUnclusteredProjects(result.unclusteredProjects);
  await updateLatestAiCount(result.projects);
  await updateLatestPatternCount(result.patterns);

  console.log(
    `Processed ${unclusteredProjects.length} unclustered projects. Patterns: ${patterns.length} -> ${result.patterns.length}. Remaining: ${result.unclusteredProjects.length}.`,
  );
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
