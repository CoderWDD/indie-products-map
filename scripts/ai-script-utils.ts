import { readFile, writeFile } from "node:fs/promises";

import {
  homepageSummariesDataSchema,
  latestUpdateSchema,
  linkStatusesDataSchema,
  projectsDataSchema,
} from "../src/lib/schemas";
import type { HomepageSummary, LatestUpdate, LinkStatus, Project } from "../src/lib/types";

export async function readProjects() {
  return projectsDataSchema.parse(await readJson("data/projects.json"));
}

export async function writeProjects(projects: Project[]) {
  await writeJson("data/projects.json", projectsDataSchema.parse(projects));
}

export async function readHomepageSummaries() {
  return homepageSummariesDataSchema.parse(
    await readJson("data/homepage-summaries.json"),
  );
}

export async function readLinkStatuses() {
  return linkStatusesDataSchema.parse(await readJson("data/link-status.json"));
}

export async function updateLatestAiCount(projects: Project[]) {
  const latestUpdate = latestUpdateSchema.parse(await readJson("data/latest-update.json"));
  const updated: LatestUpdate = {
    ...latestUpdate,
    counts: {
      ...latestUpdate.counts,
      aiAnalyzedProjects: projects.filter(
        (project) => project.aiAnalysis?.status === "available",
      ).length,
    },
    updatedAt: new Date().toISOString(),
  };

  await writeJson("data/latest-update.json", latestUpdateSchema.parse(updated));
}

export function getByProjectSlug<T extends HomepageSummary | LinkStatus>(items: T[]) {
  return new Map(items.map((item) => [item.projectSlug, item]));
}

export function getSlugArg() {
  const slugFlagIndex = process.argv.indexOf("--slug");
  if (slugFlagIndex !== -1) {
    return process.argv[slugFlagIndex + 1] ?? null;
  }

  const inlineSlug = process.argv.find((arg) => arg.startsWith("--slug="));
  return inlineSlug ? inlineSlug.slice("--slug=".length) : null;
}

export function getLimitArg() {
  const inlineLimit = process.argv.find((arg) => arg.startsWith("--limit="));
  if (!inlineLimit) {
    return null;
  }

  const limit = Number(inlineLimit.slice("--limit=".length));
  return Number.isInteger(limit) && limit > 0 ? limit : null;
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
