import homepageSummariesJson from "../../data/homepage-summaries.json";
import latestUpdateJson from "../../data/latest-update.json";
import linkStatusesJson from "../../data/link-status.json";
import patternsJson from "../../data/patterns.json";
import projectsJson from "../../data/projects.json";
import {
  homepageSummariesDataSchema,
  latestUpdateSchema,
  linkStatusesDataSchema,
  patternsDataSchema,
  projectsDataSchema,
} from "./schemas";

export const projects = projectsDataSchema.parse(projectsJson);
export const patterns = patternsDataSchema.parse(patternsJson);
export const linkStatuses = linkStatusesDataSchema.parse(linkStatusesJson);
export const homepageSummaries = homepageSummariesDataSchema.parse(homepageSummariesJson);
export const latestUpdate = latestUpdateSchema.parse(latestUpdateJson);

export const linkStatusByProjectSlug = new Map(
  linkStatuses.map((status) => [status.projectSlug, status]),
);
export const homepageSummaryByProjectSlug = new Map(
  homepageSummaries.map((summary) => [summary.projectSlug, summary]),
);
export const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));
