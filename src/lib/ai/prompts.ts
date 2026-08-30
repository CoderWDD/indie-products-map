import type { HomepageSummary, LinkStatus, Project } from "../types";

export type AnalyzeProjectPromptInput = {
  project: Project;
  homepageSummary: HomepageSummary | null;
  linkStatus: LinkStatus | null;
};

export function buildAnalyzeProjectMessages({
  project,
  homepageSummary,
  linkStatus,
}: AnalyzeProjectPromptInput) {
  return [
    {
      role: "system" as const,
      content: [
        "你是中性、克制的产品分析助手。",
        "你只能输出严格 JSON，不要使用 Markdown。",
        "AI 内容是推测，只用于产品灵感参考，不代表事实判断。",
        "禁止输出风险提示、成功/失败判断、收入估算、用户规模推断、攻击性评价、作者动机断言。",
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          task: "分析一个独立产品，输出符合 schema 的 JSON。",
          outputSchema: {
            status: "available",
            summary: "string",
            targetUsers: ["string"],
            productTypes: ["string"],
            productPatternSlug: null,
            productPatternName: null,
            interpretation: "100-150 Chinese characters, neutral and tentative",
            inspirationPoints: ["2-3 concise strings"],
            inspirationQuestions: ["2-3 concise strings"],
            monetization: {
              methods: ["possible monetization methods"],
              note: "tentative note, no revenue estimate",
            },
            relatedProjectSlugs: [],
            evidenceTypes: ["readme_only or readme_and_homepage"],
            lowConfidence: "boolean",
            unavailableReason: null,
            stale: false,
            analyzedAt: "ISO datetime, leave null if unknown",
          },
          sourceRules: {
            originalInfo: "project fields and homepage summary are source facts",
            aiInfo: "all analysis fields are conjecture",
            lowConfidenceWhen:
              "homepage is unavailable, source text is too short, or analysis is based only on README",
          },
          project: {
            slug: project.slug,
            name: project.name,
            url: project.url,
            author: project.author,
            rawDescription: project.rawDescription,
            rawSection: project.rawSection,
          },
          linkStatus,
          homepageSummary: homepageSummary
            ? {
                title: homepageSummary.title,
                description: homepageSummary.description,
                headings: homepageSummary.headings,
                extractedText: homepageSummary.extractedText.slice(0, 1800),
              }
            : null,
        },
        null,
        2,
      ),
    },
  ];
}
