import { describe, expect, it } from "vitest";

import { extractHomepageSummary } from "../src/lib/extract-homepage-summary";

const extractedAt = "2026-08-28T01:00:00.000Z";

describe("extractHomepageSummary", () => {
  it("extracts title, description, headings, and readable text", () => {
    const summary = extractHomepageSummary({
      projectSlug: "example-product",
      url: "https://example.com/",
      extractedAt,
      html: `
        <!doctype html>
        <html>
          <head>
            <title>Example &amp; Product</title>
            <meta name="description" content="A focused tool for makers." />
            <style>.hidden { display: none; }</style>
          </head>
          <body>
            <h1>Build<br/><span>faster</span></h1>
            <h2>Plan clearly</h2>
            <script>window.secret = "not content";</script>
            <p>Readable homepage copy with&nbsp;entities.</p>
          </body>
        </html>
      `,
    });

    expect(summary).toEqual({
      projectSlug: "example-product",
      url: "https://example.com/",
      title: "Example & Product",
      description: "A focused tool for makers.",
      headings: ["Build faster", "Plan clearly"],
      extractedText: "Example & Product Build faster Plan clearly Readable homepage copy with entities.",
      extractedAt,
    });
  });

  it("limits extracted text and does not keep full HTML", () => {
    const longText = "word ".repeat(1200);
    const summary = extractHomepageSummary({
      projectSlug: "long-product",
      url: "https://example.com/",
      extractedAt,
      html: `<html><body><p>${longText}</p></body></html>`,
    });

    expect(summary.extractedText.length).toBeLessThanOrEqual(4000);
    expect(summary.extractedText).not.toContain("<p>");
  });
});
