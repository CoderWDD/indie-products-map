import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { sourceProjectsDataSchema } from "../src/lib/schemas";
import {
  parseSourceReadme,
  SOURCE_RAW_README_URL,
} from "../src/lib/source-parser";

const outputPath = "data/source-projects.json";
const sourceReadmeUrl = process.env.SOURCE_README_URL ?? SOURCE_RAW_README_URL;

async function fetchSourceReadme(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/plain",
        "user-agent": "indie-products-map-fetcher",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source README: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const markdown = await fetchSourceReadme(sourceReadmeUrl);
  const projects = parseSourceReadme(markdown);
  const parsedProjects = sourceProjectsDataSchema.parse(projects);
  const parseFailedCount = parsedProjects.filter((project) => project.parseFailed).length;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(parsedProjects, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${parsedProjects.length} source projects to ${outputPath} (${parseFailedCount} parse failures).`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
