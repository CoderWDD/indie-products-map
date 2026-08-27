import { createHash } from "node:crypto";

import { type SourceProject } from "./types";

export const SOURCE_RAW_README_URL =
  "https://raw.githubusercontent.com/1c7/chinese-independent-developer/master/README.md";
export const SOURCE_README_PAGE_URL =
  "https://github.com/1c7/chinese-independent-developer/blob/master/README.md";

type ParseSourceReadmeOptions = {
  sourcePageUrl?: string;
};

type AuthorInfo = {
  name: string | null;
  url: string | null;
};

type MarkdownLink = {
  text: string;
  href: string;
  start: number;
  end: number;
};

const listItemPattern = /^\s*[-*+]\s+(.+)$/;
const sectionHeadingPattern = /^###\s+(.+?)\s*$/;
const authorHeadingPattern = /^####\s+(.+?)\s*$/;
const leadingStatusPattern =
  /^(?:(?::[a-zA-Z0-9_+-]+:)|[✅❌⚠⏰⌛🟢🔴🟡🚧])\s*/u;

export function parseSourceReadme(
  markdown: string,
  options: ParseSourceReadmeOptions = {},
) {
  const sourcePageUrl = options.sourcePageUrl ?? SOURCE_README_PAGE_URL;
  const lines = markdown.split(/\r?\n/);
  const projects: SourceProject[] = [];
  let currentSection: string | null = null;
  let currentAuthor: AuthorInfo = { name: null, url: null };

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const sectionMatch = line.match(sectionHeadingPattern);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      currentAuthor = { name: null, url: null };
      continue;
    }

    const authorMatch = line.match(authorHeadingPattern);
    if (authorMatch) {
      currentAuthor = parseAuthorHeading(authorMatch[1]);
      continue;
    }

    const listItemMatch = line.match(listItemPattern);
    if (!listItemMatch || currentSection === null) {
      continue;
    }

    const rawItem = listItemMatch[1].trim();
    const hasStatus = hasLeadingStatus(rawItem);
    const item = stripLeadingStatuses(rawItem);
    const hasProjectLink = findFirstMarkdownLink(item) !== null;
    if ((!currentAuthor.name && !hasStatus) || (!hasProjectLink && !hasStatus)) {
      continue;
    }

    projects.push(
      parseProjectListItem({
        rawItem,
        rawLine: line.trim(),
        currentSection,
        currentAuthor,
        sourceOrder: projects.length,
        sourceLine: lineNumber,
        sourceUrl: `${sourcePageUrl}#L${lineNumber}`,
      }),
    );
  }

  return projects;
}

function parseAuthorHeading(rawHeading: string): AuthorInfo {
  const firstLink = findFirstMarkdownLink(rawHeading);
  const headingWithoutLinks = replaceMarkdownLinksWithText(rawHeading).trim();
  const name = headingWithoutLinks
    .replace(/\s+-\s+Github$/i, "")
    .replace(/\s+-\s+GitHub$/i, "")
    .trim();

  return {
    name: name.length > 0 ? name : null,
    url: firstLink ? normalizeUrl(firstLink.href) : null,
  };
}

function parseProjectListItem(input: {
  rawItem: string;
  rawLine: string;
  currentSection: string;
  currentAuthor: AuthorInfo;
  sourceOrder: number;
  sourceLine: number;
  sourceUrl: string;
}): SourceProject {
  const item = stripLeadingStatuses(input.rawItem);
  const firstLink = findFirstMarkdownLink(item);
  const parseErrors: string[] = [];
  const fallbackName = buildFallbackName(item, input.sourceOrder);

  if (!firstLink) {
    parseErrors.push("missing_project_link");
  }

  const name = firstLink?.text.trim() || fallbackName;
  const normalizedUrl = firstLink ? normalizeUrl(firstLink.href) : null;
  if (firstLink && normalizedUrl === null) {
    parseErrors.push("invalid_project_url");
  }

  const rawDescription = firstLink
    ? normalizeDescription(item.slice(firstLink.end))
    : normalizeDescription(item.replace(fallbackName, ""));

  if (rawDescription.length === 0) {
    parseErrors.push("missing_description");
  }

  const parseFailed = parseErrors.length > 0;

  return {
    sourceId: createSourceId(name, normalizedUrl, input.rawLine),
    name,
    url: normalizedUrl,
    author: input.currentAuthor.name,
    authorUrl: input.currentAuthor.url,
    rawDescription,
    rawSection: input.currentSection,
    sourceOrder: input.sourceOrder,
    sourceLine: input.sourceLine,
    sourceUrl: input.sourceUrl,
    parseFailed,
    parseError: parseFailed ? parseErrors.join(",") : null,
    rawText: input.rawLine,
  };
}

function stripLeadingStatuses(value: string) {
  let result = value.trim();
  while (leadingStatusPattern.test(result)) {
    result = result.replace(leadingStatusPattern, "").trim();
  }
  return result;
}

function hasLeadingStatus(value: string) {
  return leadingStatusPattern.test(value.trim());
}

function normalizeDescription(value: string) {
  return value
    .replace(/^\s*[：:：\-–—]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function findFirstMarkdownLink(value: string): MarkdownLink | null {
  const start = value.indexOf("[");
  if (start === -1) {
    return null;
  }

  const textEnd = value.indexOf("]", start + 1);
  if (textEnd === -1 || value[textEnd + 1] !== "(") {
    return null;
  }

  const hrefStart = textEnd + 2;
  const hrefEnd = value.indexOf(")", hrefStart);
  if (hrefEnd === -1) {
    return null;
  }

  return {
    text: value.slice(start + 1, textEnd),
    href: value.slice(hrefStart, hrefEnd),
    start,
    end: hrefEnd + 1,
  };
}

function replaceMarkdownLinksWithText(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function buildFallbackName(item: string, sourceOrder: number) {
  const plainText = replaceMarkdownLinksWithText(stripLeadingStatuses(item))
    .replace(/[：:：\-–—].*$/, "")
    .trim();

  return plainText.length > 0 ? plainText : `parse-failed-${sourceOrder + 1}`;
}

function createSourceId(name: string, url: string | null, rawText: string) {
  const key = `${name}|${url ?? rawText}`;
  return createHash("sha1").update(key).digest("hex").slice(0, 12);
}
