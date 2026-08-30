# 开发、交付、验收计划

> 2026-08-30 范围调整：当前版本取消产品模式地图和 AI 聚类，后续交付以项目灵感浏览器为准。`npm run update-data` 不再执行 `cluster` / `cluster:new`，站点不再生成 `/patterns` 页面。

本文档基于 [requirements.md](./requirements.md) 制定，用于指导 AI agent 或开发者按阶段实现、验证和交付项目。

## 1. 交付目标

交付一个可静态部署的 Astro 站点：

- 以 `1c7/chinese-independent-developer` 为原始数据源。
- 将原始 README 项目列表解析为结构化数据。
- 使用 AI 对新增项目做增量分析和产品模式聚类。
- 提供首页、项目列表页、项目详情页、产品模式页、关于页。
- 使用 GitHub Actions 每月自动更新数据并提交到主分支。
- Vercel 监听主分支自动部署。

项目不包含账户、后台、评论、收藏、导出、访问统计、深色模式、E2E 测试。

## 2. 开发原则

- 每个阶段必须可独立验收。
- 优先完成数据结构和脚本，再完成页面。
- 所有 AI 输出必须经过 Zod 校验。
- 任何数据更新失败不得污染已提交数据。
- 自动更新流程必须先测试和构建，成功后再提交。
- 生成数据可以提交到仓库，但不得提交 API key、原始官网全文或私密配置。
- 页面上必须区分原始信息和 AI 推测信息。

## 3. 推荐交付顺序

```txt
项目脚手架
→ 数据 Schema
→ README 解析
→ 增量对比
→ 官网摘要与链接检测
→ AI 分析
→ 产品模式聚类
→ 静态页面
→ 搜索筛选
→ SEO 与 sitemap
→ GitHub Actions
→ 文档与最终验收
```

## 4. 里程碑规划

### M1. 项目基础设施

目标：建立可运行、可测试、可构建的 Astro 项目骨架。

交付物：

- `package.json`
- Astro + TypeScript 项目结构
- Tailwind CSS 配置
- React Islands 支持
- Vitest 配置
- 基础目录结构
- `README.md`
- `LICENSE`

验收标准：

- `npm install` 成功。
- `npm run dev` 可启动本地开发服务。
- `npm run build` 成功。
- `npm test` 成功。
- `README.md` 包含本地运行、环境变量、数据更新、部署说明入口。
- `LICENSE` 使用 MIT。

### M2. 数据模型与校验

目标：定义所有核心 JSON 数据结构，并提供 Zod 校验。

交付物：

- `src/lib/schemas.ts`
- `src/lib/types.ts`
- `data/source-projects.json`
- `data/projects.json`
- `data/patterns.json`
- `data/link-status.json`
- `data/homepage-summaries.json`
- `data/unclustered-projects.json`
- `data/latest-update.json`
- `scripts/validate-data.ts`

验收标准：

- 所有数据文件即使为空也符合 schema。
- `npm run validate-data` 可校验全部数据文件。
- schema 覆盖项目、AI 分析、产品模式、链接状态、官网摘要、更新日志。
- Vitest 覆盖 schema 正常和失败场景。

### M3. 原 README 抓取与解析

目标：从原项目 README 获取并解析项目条目。

交付物：

- `scripts/fetch-source.ts`
- `src/lib/source-parser.ts`
- `tests/source-parser.test.ts`
- `npm run fetch`

验收标准：

- 可从 GitHub raw README 抓取数据。
- 可解析项目名、链接、作者、作者链接、原始简介、原始分区、来源顺序。
- 解析失败的条目不会中断整个流程。
- 解析失败条目保留原始文本并标记 `parse_failed`。
- 生成或更新 `data/source-projects.json`。
- 测试覆盖典型条目、缺字段条目、链接异常条目、分区变化。

### M4. 增量对比与数据合并

目标：识别新增、删除、变化项目，并维护稳定 slug。

交付物：

- `src/lib/diff-projects.ts`
- `src/lib/slug.ts`
- `scripts/update-projects.ts`
- `tests/diff-projects.test.ts`
- `tests/slug.test.ts`

验收标准：

- 新项目生成稳定 slug。
- slug 基于项目名，冲突时追加短 hash。
- 已有项目名变化时 URL slug 不变。
- 原 README 删除的项目不从本站删除，只标记为不在原列表中。
- 原始信息变化时更新原始字段，保留旧 AI 分析，并标记 AI 分析 stale。
- 能输出新增、删除、变化、未变化项目列表到 `data/latest-update.json`。

### M5. 官网摘要与链接检测

目标：检测链接状态，并抓取官网首页摘要。

交付物：

- `src/lib/fetch-page.ts`
- `src/lib/extract-homepage-summary.ts`
- `scripts/check-links.ts`
- `tests/extract-homepage-summary.test.ts`
- `npm run check-links`

验收标准：

- 链接检测和官网内容抓取分开记录。
- 支持记录 `timeout`、`dns_error`、`non_html`、`blocked`、`http_404`、`empty_content`。
- 单请求超时约 10 秒。
- 最多跟随 3 次跳转。
- 单页面最多读取约 500KB 文本。
- 官网摘要只保存规则提取结果，不保存原始网页全文。
- 更新 `data/link-status.json` 和 `data/homepage-summaries.json`。

### M6. AI 分析

目标：对新增项目生成结构化 AI 分析。

交付物：

- `src/lib/ai/client.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/analyze-project.ts`
- `scripts/analyze.ts`
- `scripts/analyze-project.ts`
- `scripts/analyze-stale.ts`
- `npm run analyze`
- `npm run analyze:project -- --slug xxx`
- `npm run analyze:stale`

验收标准：

- 支持 OpenAI-compatible API。
- 通过环境变量读取 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。
- AI 输出必须使用 Zod 校验。
- 校验失败自动重试 1-2 次。
- 仍失败则标记 AI 分析失败，不阻塞项目展示。
- 新增项目在月度更新时立即分析。
- 官网不可访问时可基于 README 生成低置信度分析。
- AI 分析不包含风险提示、成功失败判断、收入估算、用户量推断、攻击性评价、作者动机断言。
- 支持单个项目重新分析。
- 支持手动重新分析 stale 项目。

### M7. 产品模式聚类

目标：用 AI 维护固化的产品模式地图。

交付物：

- `src/lib/ai/classify-pattern.ts`
- `src/lib/ai/cluster-new-patterns.ts`
- `scripts/cluster.ts`
- `scripts/cluster-new.ts`
- `npm run cluster`
- `npm run cluster:new`

验收标准：

- 新项目优先匹配已有产品模式。
- 无法匹配时进入 `data/unclustered-projects.json`。
- 每月对新发现项目做批量聚类。
- 数量太少或不适合聚类时允许继续保留在新发现。
- 新产品模式写入 `data/patterns.json` 并固化。
- 每个模式包含名称、slug、说明、关键词、图标、颜色、代表项目。
- 图标来自预设 Lucide Icons 集合。
- 颜色来自预设色板。
- 代表项目选择标准是典型且信息较完整，不代表项目好坏。

### M8. 静态页面与基础布局

目标：实现主要页面和统一视觉系统。

交付物：

- `src/layouts/BaseLayout.astro`
- `src/components/*`
- `src/pages/index.astro`
- `src/pages/projects/index.astro`
- `src/pages/projects/[slug].astro`
- `src/pages/patterns/[slug].astro`
- `src/pages/about.astro`

验收标准：

- 首页展示全局搜索、基础统计、产品模式卡片矩阵。
- `/projects` 使用卡片网格。
- 项目详情页展示原始信息和 AI 推测信息，并明确区分。
- 产品模式页展示模式说明、关键词、代表项目、全部项目。
- 关于页包含非官方声明、数据来源、AI 边界、纠错移除说明、许可证说明。
- 不展示产品截图和作者头像。
- 不实现深色模式。
- 桌面端布局清晰。
- 移动端最低要求是不严重破裂和不可读。

### M9. 搜索、筛选、排序交互

目标：实现项目列表页和首页搜索体验。

交付物：

- `src/components/ProjectExplorer.tsx`
- `src/components/ProjectSearch.tsx`
- `src/lib/search.ts`
- `src/lib/filter-projects.ts`
- `tests/filter-projects.test.ts`

验收标准：

- 使用 Fuse.js 做前端本地模糊搜索。
- 搜索范围覆盖项目名、作者、原始简介、AI 摘要、标签、产品模式。
- 支持产品模式、目标用户、产品类型、商业化方式多选筛选。
- 同一维度内 OR，不同维度之间 AND。
- 搜索结果再应用筛选。
- 支持默认、项目名、最近检测、来源顺序排序。
- 支持 `/` 聚焦搜索框。
- 项目卡片展示弱化外链按钮。
- 项目卡片展示低置信度提示和暂无 AI 分析提示。

### M10. SEO 与 sitemap

目标：完成基础可索引能力。

交付物：

- 页面 title、description、canonical。
- `sitemap.xml` 生成。
- 必要时添加 `robots.txt`。

验收标准：

- 首页、项目详情页、产品模式页、关于页有基础 meta。
- 项目详情页 canonical 稳定。
- sitemap 包含首页、项目详情页、产品模式页、关于页。
- `npm run build` 后 sitemap 可在构建产物中找到。

### M11. 自动更新与部署流水线

目标：GitHub Actions 每月自动增量更新，成功后自动提交。

交付物：

- `.github/workflows/update-data.yml`
- `scripts/update-data.ts`
- `npm run update-data`

验收标准：

- workflow 支持 `schedule` 和 `workflow_dispatch`。
- cron 为 `20 3 15 * *`。
- 自动更新流程为：抓取 README、增量对比、新增项目 AI 分析、产品模式增量处理、全量链接检测、schema 校验、Vitest、Astro build、commit 到主分支。
- 测试或构建失败时不提交数据。
- 更新失败不影响现有站点。
- 不额外配置失败通知。
- README 说明 GitHub Secrets：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

### M12. 文档与最终收尾

目标：让项目可以被 AI 或人继续维护。

交付物：

- 完整 `README.md`。
- `.env.example`。
- `docs/requirements.md`。
- `docs/delivery-plan.md`。
- 必要的脚本说明。

验收标准：

- README 包含本地开发、环境变量、数据更新命令、GitHub Actions Secrets、Vercel 部署、数据来源、AI 边界、许可证说明。
- `.env.example` 不包含真实 key。
- 所有 npm scripts 可在 README 找到说明。
- 最终运行 `npm test` 和 `npm run build` 成功。

## 5. AI 可执行任务卡

下面的任务卡可逐条交给 AI agent 执行。每张任务卡应独立完成代码、测试和验收。

### T1. 初始化 Astro 项目

任务：

- 在当前仓库初始化 Astro + TypeScript 项目。
- 集成 Tailwind CSS、React、Vitest。
- 添加 MIT License、基础 README、`.env.example`。

验收：

- `npm install` 成功。
- `npm run dev` 可启动。
- `npm run build` 成功。
- `npm test` 成功。

### T2. 建立数据 schema 和空数据文件

任务：

- 用 Zod 定义所有数据文件 schema。
- 创建所有初始 JSON 数据文件。
- 实现 `npm run validate-data`。

验收：

- 所有数据文件通过校验。
- schema 测试覆盖有效和无效样例。

### T3. 实现 README 抓取和解析

任务：

- 抓取原仓库 raw README。
- 解析项目条目并生成 `data/source-projects.json`。
- 为解析器添加单元测试。

验收：

- `npm run fetch` 能生成 source 数据。
- 解析失败条目不会中断流程。

### T4. 实现增量对比和 slug 固化

任务：

- 对比新旧 source 数据和 projects 数据。
- 识别新增、删除、变化项目。
- 实现稳定 slug 生成。
- 更新 `data/projects.json` 和 `data/latest-update.json`。

验收：

- 项目名变化不改变 slug。
- 原列表删除项目被保留并标记。
- 原始信息变化项目标记 stale。

### T5. 实现链接检测和官网摘要

任务：

- 实现链接检测。
- 实现官网首页规则提取摘要。
- 更新 `link-status` 和 `homepage-summaries` 数据。

验收：

- 超时、非 HTML、404、空内容等状态可记录。
- 不保存完整网页。
- `npm run check-links` 可运行。

### T6. 实现 AI 分析

任务：

- 实现 OpenAI-compatible client。
- 设计分析 prompt。
- 生成项目 AI 分析 JSON。
- 校验失败自动重试。
- 支持全量新增分析、单项目分析、stale 分析。

验收：

- 无 API key 时给出清晰错误。
- 有 API key 时能分析指定项目。
- 输出通过 Zod 校验。
- AI 失败时项目仍可展示。

### T7. 实现产品模式聚类

任务：

- 让 AI 优先匹配已有模式。
- 无匹配时进入新发现。
- 实现新发现批量聚类。
- 固化模式图标、颜色、代表项目。

验收：

- `npm run cluster` 可处理已有分析项目。
- `npm run cluster:new` 可处理新发现项目。
- 生成的模式数据通过 Zod 校验。

### T8. 实现页面骨架和静态路由

任务：

- 实现 BaseLayout。
- 实现首页、项目列表页、详情页、模式页、关于页。
- 使用当前 JSON 数据生成静态页面。

验收：

- 所有页面能构建。
- 项目详情页和模式页能按数据生成。
- 页面包含非官方和 AI 推测提示。

### T9. 实现搜索筛选排序

任务：

- 用 React Island 实现项目探索组件。
- 集成 Fuse.js。
- 实现多选筛选、排序和 `/` 快捷键。

验收：

- 搜索和筛选逻辑符合需求。
- 筛选逻辑有单元测试。
- 卡片字段展示符合需求。

### T10. 实现 SEO 和 sitemap

任务：

- 为主要页面添加 meta。
- 生成 sitemap。

验收：

- build 产物包含 sitemap。
- 详情页 canonical 稳定。

### T11. 实现 GitHub Actions 自动更新

任务：

- 实现 `npm run update-data` 总命令。
- 添加 GitHub Actions workflow。
- 更新前后运行校验、测试、构建。
- 成功后自动 commit。

验收：

- workflow 支持定时和手动触发。
- 失败时不 commit。
- README 说明 secrets 和部署方式。

### T12. 最终验收和文档补齐

任务：

- 补齐 README。
- 检查需求覆盖。
- 运行完整测试和构建。

验收：

- `npm test` 成功。
- `npm run build` 成功。
- `npm run validate-data` 成功。
- README 足够让新 agent 接手。

## 6. 全局验收清单

功能验收：

- 首页以产品模式地图为主入口。
- `/projects` 可搜索、筛选、排序。
- 每个项目有详情页。
- 每个产品模式有详情页。
- 关于页说明非官方、数据来源、AI 边界和纠错移除方式。
- AI 分析和原始信息明确区分。
- 商业化是 AI 推测，不展示收入或成功判断。
- 不展示风险提示。
- 不展示产品截图或作者头像。

数据验收：

- 所有 JSON 数据通过 Zod 校验。
- README 解析失败不会导致整体失败。
- 新增项目可进入 AI 分析。
- 原始信息变化项目标记 stale，但不自动重分析。
- 原列表删除项目保留并标记。
- 链接状态和官网摘要分开记录。

自动化验收：

- `npm run fetch` 可运行。
- `npm run check-links` 可运行。
- `npm run analyze` 可运行。
- `npm run analyze:project -- --slug xxx` 可运行。
- `npm run analyze:stale` 可运行。
- `npm run cluster` 可运行。
- `npm run cluster:new` 可运行。
- `npm run update-data` 可运行。
- GitHub Actions 支持每月定时和手动触发。
- GitHub Actions 成功后自动 commit。
- 测试或构建失败不提交。

质量验收：

- `npm test` 成功。
- `npm run build` 成功。
- `npm run validate-data` 成功。
- 不提交 API key。
- 不提交原始官网全文。
- 移动端最低可读。
- 桌面端信息层级清晰。

## 7. 风险与处理策略

### README 格式变化

风险：原仓库 README 格式不稳定，解析器可能失效。

处理：

- 解析失败条目保留原文。
- 增加 parser 单元测试。
- `latest-update.json` 记录解析失败数量。

### AI 输出不稳定

风险：AI 输出格式错误或内容越界。

处理：

- 强制 Zod 校验。
- 自动重试。
- prompt 明确禁止成功失败判断、收入估算、用户量推断和攻击性评价。
- 失败时展示原始信息。

### 自动更新污染数据

风险：定时任务生成坏数据并提交。

处理：

- 更新后先 schema 校验、测试、构建。
- 全部通过后才 commit。
- 失败不提交。

### 链接检测过期或误判

风险：短暂网络问题导致错误状态。

处理：

- 记录检测时间。
- 状态只在详情页展示，列表页弱提示。
- 不因链接失败隐藏项目。

### AI 调用成本

风险：全量重跑成本过高。

处理：

- 月度更新只分析新增项目。
- 原始信息变化只标记 stale。
- stale 项目通过手动命令重分析。
- 新发现项目按月批量聚类。

## 8. 交付完成定义

项目达到以下条件可认为完成：

- 需求文档中的核心页面全部实现。
- 数据抓取、增量更新、AI 分析、聚类、链接检测流程可运行。
- GitHub Actions 能按月自动更新并提交。
- Vercel 可静态部署。
- 测试、schema 校验、构建全部通过。
- README 和本文档足够支持后续 AI agent 继续维护。
