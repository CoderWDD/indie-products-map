import Fuse from "fuse.js";

import type { ProjectListItem } from "./filter-projects";

export function searchProjects(projects: ProjectListItem[], query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return projects;
  }

  const fuse = new Fuse(projects, {
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      "name",
      "author",
      "rawDescription",
      "aiAnalysis.summary",
      "aiAnalysis.targetUsers",
      "aiAnalysis.productTypes",
      "aiAnalysis.monetization.methods",
    ],
  });

  return fuse.search(normalizedQuery).map((result) => result.item);
}
