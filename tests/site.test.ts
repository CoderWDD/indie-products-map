import { describe, expect, it } from "vitest";

import { createAbsoluteUrl, normalizePathname } from "../src/lib/site";
import { renderSitemap } from "../src/pages/sitemap.xml";

describe("site urls", () => {
  it("normalizes relative paths before canonical rendering", () => {
    expect(normalizePathname("projects/example/")).toBe("/projects/example/");
    expect(createAbsoluteUrl("/projects/example/", "https://example.com")).toBe(
      "https://example.com/projects/example/",
    );
  });

  it("renders unique sitemap locations", () => {
    const sitemap = renderSitemap(["/", "/projects/example/", "/projects/example/"], new URL("https://example.com"));

    expect(sitemap.match(/<loc>/g)).toHaveLength(2);
    expect(sitemap).toContain("<loc>https://example.com/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/projects/example/</loc>");
  });
});
