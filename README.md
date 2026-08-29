# Indie Products Map

An unofficial independent product inspiration browser based on `1c7/chinese-independent-developer`.

This repository is initialized with Astro, TypeScript, Tailwind CSS, React Islands, and Vitest. Product data, parsing scripts, AI analysis, static routes, and automation are planned for later delivery tasks.

## Local Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run validate-data
npm test
npm run build
```

## Environment Variables

AI features will use an OpenAI-compatible provider in later tasks. Copy `.env.example` to a local `.env` file when those tasks are implemented.

```txt
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
```

Do not commit real API keys or private environment files.

## Data Updates

Data can be updated with individual steps or the full monthly pipeline.

```bash
npm run fetch
npm run update-projects
npm run analyze
npm run cluster
npm run cluster:new
npm run check-links
```

The full command runs the monthly order and verifies the result before it is committed by automation:

```bash
npm run update-data
```

The full pipeline requires `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.

## Deployment

This project is intended for static deployment on Vercel from the main branch.

GitHub Actions runs `.github/workflows/update-data.yml` monthly and supports manual `workflow_dispatch`. Configure repository secrets before enabling the workflow:

```txt
AI_BASE_URL
AI_API_KEY
AI_MODEL
```

The workflow fetches the source README, merges incremental project data, analyzes new projects, processes product patterns, checks links, validates data, runs Vitest, builds Astro, and only commits generated `data/` changes when all steps pass.

## License

MIT
