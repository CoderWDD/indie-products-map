import { describe, expect, it } from "vitest";

import { createSlugBase, createUniqueSlug } from "../src/lib/slug";

describe("slug", () => {
  it("creates readable slugs from ASCII names", () => {
    expect(createSlugBase("Hello Product 2026!")).toBe("hello-product-2026");
  });

  it("falls back to a stable hash slug for non-ASCII names", () => {
    const slug = createSlugBase("灵器AI");

    expect(slug).toMatch(/^ai|project-[a-f0-9]{6}$/);
    expect(createSlugBase("灵器AI")).toBe(slug);
  });

  it("appends a short hash when the base slug is already taken", () => {
    const slug = createUniqueSlug(
      "Example App",
      new Set(["example-app"]),
      "Example App|https://example.com",
    );

    expect(slug).toMatch(/^example-app-[a-f0-9]{6}$/);
  });
});
