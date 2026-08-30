import type { APIContext } from "astro";

import { linkStatusByProjectSlug, projects } from "../lib/data";
import type { ProjectListItem } from "../lib/filter-projects";

const projectListItems: ProjectListItem[] = projects.map((project) => ({
  slug: project.slug,
  name: project.name,
  url: project.url,
  author: project.author,
  rawDescription: project.rawDescription,
  sourceOrder: project.sourceOrder,
  aiAnalysis: project.aiAnalysis
    ? {
        status: project.aiAnalysis.status,
        summary: project.aiAnalysis.summary,
        targetUsers: project.aiAnalysis.targetUsers,
        productTypes: project.aiAnalysis.productTypes,
        interpretation: project.aiAnalysis.interpretation,
        monetization: project.aiAnalysis.monetization,
        lowConfidence: project.aiAnalysis.lowConfidence,
      }
    : null,
  linkStatus: linkStatusByProjectSlug.get(project.slug) ?? null,
}));

export function GET(_context: APIContext) {
  return new Response(JSON.stringify(projectListItems), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
