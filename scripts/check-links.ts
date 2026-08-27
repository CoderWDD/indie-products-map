import { readFile, writeFile } from "node:fs/promises";

import {
  homepageSummariesDataSchema,
  linkStatusesDataSchema,
  projectsDataSchema,
} from "../src/lib/schemas";
import { extractHomepageSummary } from "../src/lib/extract-homepage-summary";
import { fetchPage } from "../src/lib/fetch-page";
import type { HomepageSummary, LinkStatus, Project } from "../src/lib/types";

const concurrency = Number(process.env.CHECK_LINKS_CONCURRENCY ?? 12);
const limit = readLimitArg();

async function main() {
  const projects = projectsDataSchema.parse(
    JSON.parse(await readFile("data/projects.json", "utf8")),
  );
  const selectedProjects = typeof limit === "number" ? projects.slice(0, limit) : projects;
  const checkedAt = new Date().toISOString();
  const linkStatuses: LinkStatus[] = [];
  const homepageSummaries: HomepageSummary[] = [];
  let completed = 0;

  await mapConcurrent(selectedProjects, concurrency, async (project) => {
    const { linkStatus, html } = await fetchPage(project.url);
    const status: LinkStatus = {
      projectSlug: project.slug,
      checkedAt,
      ...linkStatus,
    };
    linkStatuses.push(status);

    if (html && status.status === "ok" && status.finalUrl) {
      homepageSummaries.push(
        extractHomepageSummary({
          projectSlug: project.slug,
          url: status.finalUrl,
          html,
          extractedAt: checkedAt,
        }),
      );
    }

    completed += 1;
    if (completed % 50 === 0 || completed === selectedProjects.length) {
      console.log(`Checked ${completed}/${selectedProjects.length} links.`);
    }
  });

  const sortedStatuses = linkStatuses.sort((a, b) =>
    projectOrder(selectedProjects, a.projectSlug) - projectOrder(selectedProjects, b.projectSlug),
  );
  const sortedSummaries = homepageSummaries.sort((a, b) =>
    projectOrder(selectedProjects, a.projectSlug) - projectOrder(selectedProjects, b.projectSlug),
  );

  await writeJson("data/link-status.json", linkStatusesDataSchema.parse(sortedStatuses));
  await writeJson(
    "data/homepage-summaries.json",
    homepageSummariesDataSchema.parse(sortedSummaries),
  );

  const okCount = sortedStatuses.filter((status) => status.status === "ok").length;
  console.log(
    `Wrote ${sortedStatuses.length} link statuses and ${sortedSummaries.length} homepage summaries. OK: ${okCount}.`,
  );
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function mapConcurrent<T>(
  values: T[],
  maxConcurrency: number,
  worker: (value: T) => Promise<void>,
) {
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(maxConcurrency, values.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        await worker(values[currentIndex]);
      }
    }),
  );
}

function readLimitArg() {
  const arg = process.argv.find((value) => value.startsWith("--limit="));
  if (!arg) {
    return null;
  }

  const value = Number(arg.slice("--limit=".length));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function projectOrder(projects: Project[], slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
