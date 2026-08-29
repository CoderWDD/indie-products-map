export const allowedPatternIcons = [
  "BookOpen",
  "Bot",
  "BriefcaseBusiness",
  "ChartNoAxesCombined",
  "Code2",
  "FileText",
  "GraduationCap",
  "Image",
  "Languages",
  "LayoutTemplate",
  "MessageSquareText",
  "Music",
  "PenTool",
  "Search",
  "Sparkles",
  "Wrench",
] as const;

export const allowedPatternColors = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ca8a04",
  "#4f46e5",
] as const;

export function normalizePatternIcon(icon: string) {
  return allowedPatternIcons.find((allowedIcon) => allowedIcon === icon) ?? "Sparkles";
}

export function normalizePatternColor(color: string, index = 0) {
  return allowedPatternColors.find((allowedColor) => allowedColor === color)
    ?? allowedPatternColors[index % allowedPatternColors.length];
}
