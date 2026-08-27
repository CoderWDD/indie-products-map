import { readFile } from "node:fs/promises";
import path from "node:path";

import { ZodError, type ZodTypeAny } from "zod";

import {
  homepageSummariesDataSchema,
  latestUpdateSchema,
  linkStatusesDataSchema,
  patternsDataSchema,
  projectsDataSchema,
  sourceProjectsDataSchema,
  unclusteredProjectsDataSchema,
} from "../src/lib/schemas";

type DataFile = {
  filePath: string;
  schema: ZodTypeAny;
};

const dataFiles: DataFile[] = [
  { filePath: "data/source-projects.json", schema: sourceProjectsDataSchema },
  { filePath: "data/projects.json", schema: projectsDataSchema },
  { filePath: "data/patterns.json", schema: patternsDataSchema },
  { filePath: "data/link-status.json", schema: linkStatusesDataSchema },
  { filePath: "data/homepage-summaries.json", schema: homepageSummariesDataSchema },
  { filePath: "data/unclustered-projects.json", schema: unclusteredProjectsDataSchema },
  { filePath: "data/latest-update.json", schema: latestUpdateSchema },
];

async function readJson(filePath: string) {
  const absolutePath = path.resolve(filePath);
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `${location}: ${issue.message}`;
    })
    .join("\n");
}

export async function validateDataFiles(files = dataFiles) {
  const failures: string[] = [];

  for (const dataFile of files) {
    try {
      const json = await readJson(dataFile.filePath);
      dataFile.schema.parse(json);
      console.log(`ok ${dataFile.filePath}`);
    } catch (error) {
      if (error instanceof ZodError) {
        failures.push(`${dataFile.filePath}\n${formatZodError(error)}`);
        continue;
      }

      if (error instanceof Error) {
        failures.push(`${dataFile.filePath}\n${error.message}`);
        continue;
      }

      failures.push(`${dataFile.filePath}\nUnknown validation error`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Data validation failed:\n\n${failures.join("\n\n")}`);
  }
}

validateDataFiles().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
