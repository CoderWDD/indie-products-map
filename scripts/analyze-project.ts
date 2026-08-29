import { analyzeProject } from "../src/lib/ai/analyze-project";
import { createAiClientFromEnv, MissingAiConfigError } from "../src/lib/ai/client";
import {
  getByProjectSlug,
  getSlugArg,
  readHomepageSummaries,
  readLinkStatuses,
  readProjects,
  updateLatestAiCount,
  writeProjects,
} from "./ai-script-utils";

async function main() {
  const slug = getSlugArg();
  if (!slug) {
    throw new Error("Missing required --slug argument.");
  }

  const client = createAiClientFromEnv();
  const projects = await readProjects();
  const projectIndex = projects.findIndex((project) => project.slug === slug);
  if (projectIndex === -1) {
    throw new Error(`Project not found: ${slug}.`);
  }

  const homepageBySlug = getByProjectSlug(await readHomepageSummaries());
  const linkStatusBySlug = getByProjectSlug(await readLinkStatuses());
  const project = projects[projectIndex];
  projects[projectIndex] = {
    ...project,
    aiAnalysis: await analyzeProject({
      client,
      project,
      homepageSummary: homepageBySlug.get(project.slug) ?? null,
      linkStatus: linkStatusBySlug.get(project.slug) ?? null,
    }),
  };

  await writeProjects(projects);
  await updateLatestAiCount(projects);
  console.log(`Analyzed project: ${slug}.`);
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
