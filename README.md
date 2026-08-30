# Indie Products Map

面向中文用户的非官方独立产品灵感浏览器，基于 [`1c7/chinese-independent-developer`](https://github.com/1c7/chinese-independent-developer) 构建。

这个项目把原始 README 中的中文独立产品列表转换为结构化数据，补充链接检测、官网首页轻量摘要和经过 Zod 校验的 AI 推测分析，并构建成一个可静态部署的 Astro 站点。

它的核心使用场景是：帮助正在寻找个人产品方向的中文用户，更快理解「别人做了什么产品、面向谁、可能解决什么问题、有哪些可借鉴的切入点」。

## Scope

这是一个非官方衍生项目。项目收录和原始信息修改仍以原始 README 为准。

本站不包含账户、后台、评论、收藏、导出、访问统计、深色模式或 E2E 测试。

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

AI 分析使用 OpenAI-compatible API。运行 AI 相关脚本前，复制 `.env.example` 为本地 `.env`，并填写以下配置。

```txt
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
AI_API_FORMAT=
```

`AI_API_FORMAT` 是可选项。支持 `/chat/completions` 的 provider 使用 `chat_completions`；只支持 `/responses` 的 provider 使用 `responses`。默认值是 `chat_completions`。

`SITE_URL` 可用于生产环境 canonical URL 和 sitemap 输出。如果不设置，默认使用 `https://indie-products-map.vercel.app`。

不要提交真实 `.env`、API key、私密配置或原始官网全文。

## Data Source

原始项目数据来自：

- Repository: <https://github.com/1c7/chinese-independent-developer>
- Raw README: <https://raw.githubusercontent.com/1c7/chinese-independent-developer/master/README.md>

新增项目或原始信息修正应优先提交到上游仓库。只针对本站的纠错或移除请求，可以在本仓库发布后通过 GitHub Issues 反馈。

## Data Updates

单步数据更新命令：

```bash
npm run fetch
npm run update-projects
npm run check-links
npm run analyze
npm run analyze:project -- --slug example-slug
npm run analyze:stale
```

完整每周更新流程：

```bash
npm run update-data
```

完整流程会执行：

```txt
fetch README
-> merge incremental project data
-> analyze new projects
-> check all links
-> validate data
-> run Vitest
-> build Astro
```

如果数据校验、测试或构建失败，不应提交生成的数据变更。

## NPM Scripts

- `npm run dev`: 启动 Astro 本地开发服务。
- `npm run build`: 构建静态站点到 `dist/`。
- `npm run preview`: 本地预览已构建站点。
- `npm test`: 运行 Vitest。
- `npm run validate-data`: 使用 Zod 校验所有 JSON 数据文件。
- `npm run fetch`: 抓取并解析上游 README，写入 `data/source-projects.json`。
- `npm run update-projects`: 合并解析后的源数据，维护稳定项目记录，并更新 `data/latest-update.json`。
- `npm run check-links`: 检测项目链接，并写入链接状态和官网首页摘要。
- `npm run analyze`: 分析尚无 AI 分析的项目。
- `npm run analyze:project -- --slug <slug>`: 分析单个项目。
- `npm run analyze:stale`: 重新分析源信息已变化的项目。
- `npm run update-data`: 执行完整自动更新流程。

## AI Boundaries

AI 输出只有通过 Zod 校验后才会写入数据。校验失败会自动重试；仍失败则记录为暂不可用。

AI 内容是推测和辅助分析，不是事实判断。页面必须把原始 README / 官网信息与 AI 分析分开展示。AI prompt 和 UI 不生成、不展示：

- 成功或失败判断
- 收入估算
- 用户规模推断
- 风险提示
- 攻击性评价
- 作者动机断言

当项目证据不足或官网摘要不可用时，AI 分析可能被标记为低置信度。

## GitHub Actions

每周更新 workflow 位于 `.github/workflows/main.yml`。

触发方式：

- `schedule`: `20 3 * * 1`
- `workflow_dispatch`

需要配置的 GitHub Secrets：

```txt
AI_BASE_URL
AI_API_KEY
AI_MODEL
AI_API_FORMAT
```

workflow 会使用 `npm ci` 安装依赖，执行 `npm run update-data`，并且只在完整流程成功后提交生成的 `data/` 变更。

## Vercel Deployment

在 Vercel 上按静态 Astro 项目部署本仓库。

推荐配置：

- Framework preset: Astro
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Optional environment variable: `SITE_URL`

Vercel 监听 `main` 分支后，每周 GitHub Actions 数据提交会自动触发生产部署。

## Project Structure

```txt
data/                  提交到仓库的生成 JSON 数据
docs/                  需求文档和交付计划
scripts/               数据更新、校验、AI 分析和自动化脚本
src/components/        Astro 和 React UI 组件
src/layouts/           共享 Astro 布局
src/lib/               schema、数据加载、解析、AI 和 UI helper
src/pages/             静态页面和静态 endpoint
tests/                 schema 和核心逻辑的 Vitest 测试
```

## License

MIT。见 [LICENSE](./LICENSE)。
