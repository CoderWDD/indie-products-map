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

Data update commands are not implemented in T1. They will be added in later tasks for source README parsing, incremental updates, link checks, AI analysis, and product pattern clustering.

## Deployment

This project is intended for static deployment. Vercel and GitHub Actions instructions will be completed in later delivery tasks.

## License

MIT
