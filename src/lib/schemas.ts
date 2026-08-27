import { z } from "zod";

export const urlSchema = z.string().url();
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const sourceProjectSchema = z.object({
  sourceId: z.string().min(1),
  name: z.string().min(1),
  url: urlSchema.nullable(),
  author: z.string().min(1).nullable(),
  authorUrl: urlSchema.nullable(),
  rawDescription: z.string(),
  rawSection: z.string().min(1).nullable(),
  sourceOrder: z.number().int().nonnegative(),
  sourceLine: z.number().int().positive().nullable(),
  sourceUrl: urlSchema,
  parseFailed: z.boolean(),
  parseError: z.string().min(1).nullable(),
  rawText: z.string().min(1),
});

export const analysisEvidenceTypeSchema = z.enum([
  "readme_only",
  "readme_and_homepage",
  "homepage_only",
]);

export const aiAnalysisSchema = z.object({
  status: z.enum(["available", "unavailable"]),
  summary: z.string().min(1).nullable(),
  targetUsers: z.array(z.string().min(1)),
  productTypes: z.array(z.string().min(1)),
  productPatternSlug: slugSchema.nullable(),
  productPatternName: z.string().min(1).nullable(),
  interpretation: z.string().min(1).nullable(),
  inspirationPoints: z.array(z.string().min(1)).min(0).max(3),
  inspirationQuestions: z.array(z.string().min(1)).min(0).max(3),
  monetization: z
    .object({
      methods: z.array(z.string().min(1)),
      note: z.string().min(1).nullable(),
    })
    .nullable(),
  relatedProjectSlugs: z.array(slugSchema),
  evidenceTypes: z.array(analysisEvidenceTypeSchema),
  lowConfidence: z.boolean(),
  unavailableReason: z.string().min(1).nullable(),
  stale: z.boolean(),
  analyzedAt: isoDateTimeSchema.nullable(),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  sourceId: z.string().min(1),
  name: z.string().min(1),
  url: urlSchema.nullable(),
  author: z.string().min(1).nullable(),
  authorUrl: urlSchema.nullable(),
  rawDescription: z.string(),
  rawSection: z.string().min(1).nullable(),
  sourceOrder: z.number().int().nonnegative(),
  sourceUrl: urlSchema,
  inSource: z.boolean(),
  firstSeenAt: isoDateTimeSchema,
  lastSeenAt: isoDateTimeSchema,
  rawUpdatedAt: isoDateTimeSchema,
  aiAnalysis: aiAnalysisSchema.nullable(),
});

export const patternSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  representativeProjectSlugs: z.array(slugSchema).min(0).max(6),
  projectSlugs: z.array(slugSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const linkStatusCodeSchema = z.enum([
  "ok",
  "timeout",
  "dns_error",
  "non_html",
  "blocked",
  "http_404",
  "http_error",
  "empty_content",
  "invalid_url",
  "unknown_error",
]);

export const linkStatusSchema = z.object({
  projectSlug: slugSchema,
  url: z.string().min(1),
  status: linkStatusCodeSchema,
  httpStatus: z.number().int().min(100).max(599).nullable(),
  finalUrl: urlSchema.nullable(),
  checkedAt: isoDateTimeSchema,
  errorMessage: z.string().min(1).nullable(),
});

export const homepageSummarySchema = z.object({
  projectSlug: slugSchema,
  url: urlSchema,
  title: z.string().min(1).nullable(),
  description: z.string().min(1).nullable(),
  headings: z.array(z.string().min(1)).max(12),
  extractedText: z.string().max(4000),
  extractedAt: isoDateTimeSchema,
});

export const unclusteredProjectSchema = z.object({
  projectSlug: slugSchema,
  reason: z.enum(["new", "insufficient_information", "no_matching_pattern"]),
  addedAt: isoDateTimeSchema,
  lastTriedAt: isoDateTimeSchema.nullable(),
});

export const updateChangeSchema = z.object({
  sourceId: z.string().min(1),
  projectSlug: slugSchema.nullable(),
  name: z.string().min(1),
});

export const latestUpdateSchema = z.object({
  schemaVersion: z.literal(1),
  sourceUrl: urlSchema,
  fetchedAt: isoDateTimeSchema.nullable(),
  updatedAt: isoDateTimeSchema.nullable(),
  counts: z.object({
    sourceProjects: z.number().int().nonnegative(),
    projects: z.number().int().nonnegative(),
    patterns: z.number().int().nonnegative(),
    aiAnalyzedProjects: z.number().int().nonnegative(),
  }),
  changes: z.object({
    added: z.array(updateChangeSchema),
    removed: z.array(updateChangeSchema),
    changed: z.array(updateChangeSchema),
    unchanged: z.array(updateChangeSchema),
  }),
});

export const sourceProjectsDataSchema = z.array(sourceProjectSchema);
export const projectsDataSchema = z.array(projectSchema);
export const patternsDataSchema = z.array(patternSchema);
export const linkStatusesDataSchema = z.array(linkStatusSchema);
export const homepageSummariesDataSchema = z.array(homepageSummarySchema);
export const unclusteredProjectsDataSchema = z.array(unclusteredProjectSchema);
