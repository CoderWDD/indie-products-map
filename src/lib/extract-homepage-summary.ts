import type { HomepageSummary } from "./types";

export type ExtractHomepageSummaryInput = {
  projectSlug: string;
  url: string;
  html: string;
  extractedAt: string;
};

export function extractHomepageSummary({
  projectSlug,
  url,
  html,
  extractedAt,
}: ExtractHomepageSummaryInput): HomepageSummary {
  const title = cleanText(extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = cleanText(
    extractFirst(
      html,
      /<meta\s+[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    ) ??
      extractFirst(
        html,
        /<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i,
      ),
  );
  const headings = extractHeadings(html);
  const extractedText = extractReadableText(html);

  return {
    projectSlug,
    url,
    title: title || null,
    description: description || null,
    headings,
    extractedText,
    extractedAt,
  };
}

function extractHeadings(html: string) {
  return Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((match) => cleanText(match[1]))
    .filter((heading): heading is string => Boolean(heading))
    .slice(0, 12);
}

function extractReadableText(html: string) {
  const text = cleanText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  );

  return text.slice(0, 4000);
}

function extractFirst(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1] ?? null;
}

function cleanText(value: string | null) {
  if (!value) {
    return "";
  }

  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}
