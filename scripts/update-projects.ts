import { readFile, writeFile } from "node:fs/promises";

import {
  latestUpdateSchema,
  projectsDataSchema,
  sourceProjectsDataSchema,
} from "../src/lib/schemas";
import { SOURCE_README_PAGE_URL } from "../src/lib/source-parser";
import { updateProjectsFromSource } from "../src/lib/diff-projects";

async function readJson(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const sourceProjects = sourceProjectsDataSchema.parse(
    await readJson("data/source-projects.json"),
  );
  const existingProjects = projectsDataSchema.parse(await readJson("data/projects.json"));
  const { projects, latestUpdate } = updateProjectsFromSource(
    sourceProjects,
    existingProjects,
    { sourceUrl: SOURCE_README_PAGE_URL },
  );

  await writeJson("data/projects.json", projectsDataSchema.parse(projects));
  await writeJson("data/latest-update.json", latestUpdateSchema.parse(latestUpdate));

  console.log(
    [
      `Updated data/projects.json with ${projects.length} projects.`,
      `Added ${latestUpdate.changes.added.length}.`,
      `Removed ${latestUpdate.changes.removed.length}.`,
      `Changed ${latestUpdate.changes.changed.length}.`,
      `Unchanged ${latestUpdate.changes.unchanged.length}.`,
    ].join(" "),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
