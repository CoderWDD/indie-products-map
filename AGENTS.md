# AI Agent 执行指南

本项目是 `indie-products-map`，一个基于 `1c7/chinese-independent-developer` 的非官方独立产品灵感浏览器。

当前范围：由于全量产品模式聚类成本过高，当前版本取消产品模式地图、产品模式页、产品模式筛选和自动聚类流程。站点保留项目浏览、搜索筛选、详情页、链接检测、官网摘要和项目级 AI 推测分析。

AI agent 进入本仓库后，必须先阅读：

- `docs/requirements.md`
- `docs/delivery-plan.md`
- `AGENTS.md`

## 工作原则

- 按 `docs/delivery-plan.md` 的任务卡顺序推进。
- 每次只执行一个明确任务卡，除非用户明确要求合并多个任务。
- 不擅自扩展需求，不添加账户、后台、评论、收藏、导出、访问统计、深色模式、E2E 测试等非需求功能。
- 优先保持项目可运行、可测试、可构建。
- 数据结构和脚本优先于 UI。
- AI 生成内容必须经过 Zod 校验。
- 页面必须区分原始信息和 AI 推测信息。
- 不生成或展示成功/失败判断、收入估算、用户量推断、风险提示、攻击性评价或作者动机断言。
- 不提交 API key、私密配置或原始官网全文。

## 推荐执行顺序

按以下任务卡推进：

1. T1 初始化 Astro 项目
2. T2 建立数据 schema 和空数据文件
3. T3 实现 README 抓取和解析
4. T4 实现增量对比和 slug 固化
5. T5 实现链接检测和官网摘要
6. T6 实现 AI 分析
7. T7 产品模式聚类已取消
8. T8 实现页面骨架和静态路由
9. T9 实现搜索筛选排序
10. T10 实现 SEO 和 sitemap
11. T11 实现 GitHub Actions 自动更新
12. T12 最终验收和文档补齐

## 每轮任务要求

每轮执行前：

- 阅读相关需求和交付计划。
- 明确当前任务卡编号。
- 检查工作区状态。

执行中：

- 只修改当前任务相关文件。
- 遵循既有技术选型：Astro、TypeScript、Tailwind CSS、React Islands、Fuse.js、Zod、Vitest、Lucide Icons、OpenAI-compatible API。
- 使用结构化数据和 schema，不使用临时字符串拼接替代数据模型。
- 对关键逻辑添加 Vitest 单元测试。

执行后：

- 运行当前任务要求的验收命令。
- 至少在可行时运行：
  - `npm test`
  - `npm run build`
- 涉及数据 schema 时运行：
  - `npm run validate-data`
- 汇报修改内容、验证结果和未完成项。

## Git 规则

- 每个任务卡完成后建议单独提交。
- 每次完成代码或文档修改并创建本地提交后，必须继续执行 `git push` 推送到远端 GitHub，除非用户明确要求暂不推送或远端认证不可用。
- 提交信息使用简短英文 conventional commit，例如：
  - `chore: initialize astro project`
  - `feat: add data schemas`
  - `feat: parse source readme`
  - `feat: add project explorer`
- 不要使用破坏性 Git 命令。
- 不要回滚用户未明确要求回滚的修改。

## 环境变量

AI provider 使用 OpenAI-compatible API。

需要支持：

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

仓库中只能提交 `.env.example`，不得提交真实 `.env` 或 API key。

## 自动更新规则

GitHub Actions 月度更新流程必须符合：

```txt
抓取 README
→ 增量对比
→ 新增项目 AI 分析
→ 全量链接检测
→ schema 校验
→ Vitest
→ Astro build
→ commit 到主分支
```

如果 schema 校验、测试或构建失败，不得提交数据变更。

## 最终交付标准

最终交付前必须满足：

- `npm run validate-data` 成功。
- `npm test` 成功。
- `npm run build` 成功。
- 首页、项目列表页、项目详情页、关于页存在。
- GitHub Actions 支持每月定时和手动触发。
- README 说明本地开发、环境变量、数据更新、GitHub Actions Secrets、Vercel 部署、数据来源、AI 边界和许可证。
