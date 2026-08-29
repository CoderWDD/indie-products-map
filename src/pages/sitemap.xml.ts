import type { APIContext } from "astro";

import { patterns, projects } from "../lib/data";
import { createAbsoluteUrl } from "../lib/site";

const staticPaths = ["/", "/projects/", "/patterns/", "/about/"];

export function GET({ site }: APIContext) {
  const urls = [
    ...staticPaths,
    ...projects.map((project) => `/projects/${project.slug}/`),
    ...patterns.map((pattern) => `/patterns/${pattern.slug}/`),
  ];

  return new Response(renderSitemap(urls, site ?? undefined), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

export function renderSitemap(pathnames: string[], site?: URL) {
  const uniquePathnames = [...new Set(pathnames)];
  const entries = uniquePathnames
    .map((pathname) => `  <url><loc>${escapeXml(createAbsoluteUrl(pathname, site))}</loc></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
