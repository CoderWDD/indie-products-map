import type { APIContext } from "astro";

import { createAbsoluteUrl } from "../lib/site";

export function GET({ site }: APIContext) {
  const sitemapUrl = createAbsoluteUrl("/sitemap.xml", site ?? undefined);

  return new Response(`User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
