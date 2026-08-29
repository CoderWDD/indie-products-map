# Indie Products Map

An unofficial independent product inspiration browser based on [`1c7/chinese-independent-developer`](https://github.com/1c7/chinese-independent-developer).

The site turns the source README into structured project data, checks project links, stores lightweight homepage summaries, adds Zod-validated AI analysis, clusters product patterns, and builds a static Astro site for browsing product inspiration.

## Scope

This is a non-official companion project. The upstream README remains the authoritative source for project inclusion and edits.

The site does not include accounts, admin panels, comments, favorites, exports, analytics, dark mode, or E2E tests.

## Local Development

```bash
npm install
npm run dev
```

Useful local commands:

```bash
npm run build
npm run preview
npm test
npm run validate-data
```

## Environment Variables

AI analysis uses an OpenAI-compatible chat completions API. Copy `.env.example` to a local `.env` file and fill these values when running AI-related scripts.

```txt
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
AI_API_FORMAT=
```

`AI_API_FORMAT` is optional. Use `chat_completions` for `/chat/completions` providers, or `responses` for providers that only support `/responses`. The default is `chat_completions`.

`SITE_URL` may be set for production canonical URLs and sitemap output. If omitted, the project uses `https://indie-products-map.vercel.app`.

Do not commit real `.env` files, API keys, private configuration, or raw homepage content.

## Data Source

Original project data is fetched from:

- Repository: <https://github.com/1c7/chinese-independent-developer>
- Raw README: <https://raw.githubusercontent.com/1c7/chinese-independent-developer/master/README.md>

Project additions or source corrections should go to the upstream repository first. Corrections or removal requests specific to this site should be filed in this repository's GitHub Issues after the repository is published.

## Data Updates

Individual update steps:

```bash
npm run fetch
npm run update-projects
npm run check-links
npm run analyze
npm run analyze:project -- --slug example-slug
npm run analyze:stale
npm run cluster
npm run cluster:new
```

Full monthly pipeline:

```bash
npm run update-data
```

The full pipeline runs:

```txt
fetch README
-> merge incremental project data
-> analyze new projects
-> classify analyzed projects into existing patterns
-> cluster new patterns
-> check all links
-> validate data
-> run Vitest
-> build Astro
```

If validation, tests, or build fail, generated data should not be committed.

## NPM Scripts

- `npm run dev`: start the Astro dev server.
- `npm run build`: build the static site into `dist/`.
- `npm run preview`: preview the built site locally.
- `npm test`: run Vitest.
- `npm run validate-data`: validate all JSON data files with Zod.
- `npm run fetch`: fetch and parse the upstream README into `data/source-projects.json`.
- `npm run update-projects`: merge parsed source data into stable project records and update `data/latest-update.json`.
- `npm run check-links`: check project URLs and write link status plus extracted homepage summaries.
- `npm run analyze`: analyze projects without AI analysis.
- `npm run analyze:project -- --slug <slug>`: analyze one project.
- `npm run analyze:stale`: reanalyze projects whose source data changed.
- `npm run cluster`: match analyzed projects to existing product patterns or mark them as unclustered.
- `npm run cluster:new`: cluster unclustered projects into new fixed product patterns when enough signal exists.
- `npm run update-data`: run the complete automated update pipeline.

## AI Boundaries

AI output is stored only after Zod validation. Invalid output is retried and then recorded as unavailable if it still cannot be validated.

AI content is treated as inference, not fact. Pages must keep original README/homepage information separate from AI analysis. The AI prompts and UI must not generate or display:

- success or failure judgments
- revenue estimates
- user-scale guesses
- risk warnings
- offensive evaluations
- author motivation claims

When a project has too little evidence or no reachable homepage summary, analysis may be marked as low confidence.

## GitHub Actions

The monthly update workflow lives at `.github/workflows/update-data.yml`.

Triggers:

- `schedule`: `20 3 15 * *`
- `workflow_dispatch`

Required repository secrets:

```txt
AI_BASE_URL
AI_API_KEY
AI_MODEL
AI_API_FORMAT
```

The workflow installs dependencies with `npm ci`, runs `npm run update-data`, and commits generated `data/` changes only after the full pipeline succeeds.

## Vercel Deployment

Deploy the repository as a static Astro project on Vercel.

Recommended settings:

- Framework preset: Astro
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Optional environment variable: `SITE_URL`

Vercel can listen to the main branch. The monthly GitHub Actions data commit then triggers a normal production deployment.

## Project Structure

```txt
data/                  Generated JSON data committed to the repository
docs/                  Requirements and delivery plan
scripts/               Data update, validation, AI, and automation scripts
src/components/        Astro and React UI components
src/layouts/           Shared Astro layouts
src/lib/               Schemas, data loaders, parsing, AI, and UI helpers
src/pages/             Static pages and API-style static endpoints
tests/                 Vitest coverage for schemas and core logic
```

## License

MIT. See [LICENSE](./LICENSE).
