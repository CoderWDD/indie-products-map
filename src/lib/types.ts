import type { z } from "zod";

import type {
  aiAnalysisSchema,
  homepageSummarySchema,
  latestUpdateSchema,
  linkStatusSchema,
  patternSchema,
  patternClassificationSchema,
  generatedPatternSchema,
  projectSchema,
  sourceProjectSchema,
  unclusteredProjectSchema,
} from "./schemas";

export type SourceProject = z.infer<typeof sourceProjectSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type PatternClassification = z.infer<typeof patternClassificationSchema>;
export type GeneratedPattern = z.infer<typeof generatedPatternSchema>;
export type LinkStatus = z.infer<typeof linkStatusSchema>;
export type HomepageSummary = z.infer<typeof homepageSummarySchema>;
export type UnclusteredProject = z.infer<typeof unclusteredProjectSchema>;
export type LatestUpdate = z.infer<typeof latestUpdateSchema>;
