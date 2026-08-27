import { describe, expect, it } from "vitest";

import { parseSourceReadme } from "../src/lib/source-parser";

const sourcePageUrl = "https://github.com/example/source/blob/main/README.md";

describe("parseSourceReadme", () => {
  it("parses typical project entries with section and author context", () => {
    const projects = parseSourceReadme(
      [
        "# Title",
        "### 2026 年 8 月 1 号添加",
        "#### Alice - [Github](https://github.com/alice)",
        "* :white_check_mark: [Example App](https://example.com)：帮助用户整理灵感",
      ].join("\n"),
      { sourcePageUrl },
    );

    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: "Example App",
      url: "https://example.com/",
      author: "Alice",
      authorUrl: "https://github.com/alice",
      rawDescription: "帮助用户整理灵感",
      rawSection: "2026 年 8 月 1 号添加",
      sourceOrder: 0,
      sourceLine: 4,
      sourceUrl: `${sourcePageUrl}#L4`,
      parseFailed: false,
      parseError: null,
    });
  });

  it("keeps malformed entries as parse failures without stopping later entries", () => {
    const projects = parseSourceReadme(
      [
        "### 2026 年 8 月 1 号添加",
        "#### Bob - Github",
        "* :white_check_mark: Missing link：只有文字没有链接",
        "* :white_check_mark: [Next App](https://next.example)：后续条目仍然解析",
      ].join("\n"),
      { sourcePageUrl },
    );

    expect(projects).toHaveLength(2);
    expect(projects[0]).toMatchObject({
      name: "Missing link",
      url: null,
      parseFailed: true,
      parseError: "missing_project_link",
      rawText: "* :white_check_mark: Missing link：只有文字没有链接",
    });
    expect(projects[1]).toMatchObject({
      name: "Next App",
      parseFailed: false,
    });
  });

  it("marks invalid project links while preserving available fields", () => {
    const projects = parseSourceReadme(
      [
        "### New Section",
        "#### Carol - [Github](https://github.com/carol)",
        "* ✅ [Broken Link App](not-a-url)：链接格式异常",
      ].join("\n"),
      { sourcePageUrl },
    );

    expect(projects[0]).toMatchObject({
      name: "Broken Link App",
      url: null,
      author: "Carol",
      rawDescription: "链接格式异常",
      parseFailed: true,
      parseError: "invalid_project_url",
    });
  });

  it("updates section and author context when headings change", () => {
    const projects = parseSourceReadme(
      [
        "### First Section",
        "#### Alice - [Github](https://github.com/alice)",
        "* [First App](https://first.example)：第一个",
        "### Second Section",
        "#### Bob - [Github](https://github.com/bob)",
        "- :construction: [Second App](https://second.example)：第二个",
      ].join("\n"),
      { sourcePageUrl },
    );

    expect(projects).toHaveLength(2);
    expect(projects[0]).toMatchObject({
      name: "First App",
      author: "Alice",
      rawSection: "First Section",
      sourceOrder: 0,
    });
    expect(projects[1]).toMatchObject({
      name: "Second App",
      author: "Bob",
      rawSection: "Second Section",
      sourceOrder: 1,
    });
  });
});
