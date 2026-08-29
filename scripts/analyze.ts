import { analyzeProject } from "../src/lib/ai/analyze-project";
import { createAiClientFromEnv, MissingAiConfigError } from "../src/lib/ai/client";
import {
  getByProjectSlug,
  getLimitArg,
  readHomepageSummaries,
  readLinkStatuses,
  readProjects,
  updateLatestAiCount,
  writeProjects,
} from "./ai-script-utils";

async function main() {
  const client = createAiClientFromEnv();
  const projects = await readProjects();
  const homepageBySlug = getByProjectSlug(await readHomepageSummaries());
  const linkStatusBySlug = getByProjectSlug(await readLinkStatuses());
  const limit = getLimitArg();
  let analyzedCount = 0;

  for (const [index, project] of projects.entries()) {
    if (project.aiAnalysis !== null) {
      continue;
    }
    if (limit !== null && analyzedCount >= limit) {
      break;
    }

    projects[index] = {
      ...project,
      aiAnalysis: await analyzeProject({
        client,
        project,
        homepageSummary: homepageBySlug.get(project.slug) ?? null,
        linkStatus: linkStatusBySlug.get(project.slug) ?? null,
      }),
    };
    analyzedCount += 1;
    console.log(`Analyzed ${analyzedCount}: ${project.slug}.`);
  }

  await writeProjects(projects);
  await updateLatestAiCount(projects);
  console.log(`Analyzed ${analyzedCount} projects without existing AI analysis.`);
}

main().catch((error: unknown) => {
  if (error instanceof MissingAiConfigError) {
    console.error(
      `${error.message} Set AI_BASE_URL, AI_API_KEY, and AI_MODEL before running analysis.`,
    );
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
