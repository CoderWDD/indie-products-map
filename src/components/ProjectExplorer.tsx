import {
  ChevronDown,
  ExternalLink,
  ListFilter,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createFilterOptions,
  emptyProjectFilters,
  filterProjects,
  sortProjects,
  type ProjectFilters,
  type ProjectListItem,
  type ProjectSortKey,
} from "../lib/filter-projects";
import { searchProjects } from "../lib/search";
import { ProjectSearch } from "./ProjectSearch";

type ProjectExplorerProps = {
  initialQuery?: string;
};

type FilterKey = keyof ProjectFilters;

const sortOptions: Array<{ value: ProjectSortKey; label: string }> = [
  { value: "default", label: "默认" },
  { value: "name", label: "项目名" },
  { value: "lastChecked", label: "最近检测" },
  { value: "sourceOrder", label: "来源顺序" },
];

const pageSize = 60;
const filterLabels: Record<FilterKey, string> = {
  productTypes: "类型",
  targetUsers: "用户",
  monetizationMethods: "商业化",
  linkStatuses: "链接",
};

export function ProjectExplorer({ initialQuery = "" }: ProjectExplorerProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<ProjectFilters>(emptyProjectFilters);
  const [sortKey, setSortKey] = useState<ProjectSortKey>("default");
  const [visibleLimit, setVisibleLimit] = useState(pageSize);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openFilterGroups, setOpenFilterGroups] = useState<Record<FilterKey, boolean>>({
    productTypes: true,
    targetUsers: false,
    monetizationMethods: false,
    linkStatuses: false,
  });
  const filterOptions = useMemo(() => createFilterOptions(projects), [projects]);
  const visibleProjects = useMemo(() => {
    const searchedProjects = searchProjects(projects, query);
    return sortProjects(filterProjects(searchedProjects, filters), sortKey);
  }, [filters, projects, query, sortKey]);
  const displayedProjects = visibleProjects.slice(0, visibleLimit);
  const activeFilterCount = countActiveFilters(filters);
  const activeFilterEntries = Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => ({ key: key as FilterKey, value })),
  );
  const sortLabel = sortOptions.find((option) => option.value === sortKey)?.label ?? "默认";
  const hasActiveControls = query.trim().length > 0 || activeFilterCount > 0 || sortKey !== "default";
  const analyzedCount = projects.filter((project) => project.aiAnalysis?.status === "available").length;
  const lowConfidenceCount = projects.filter((project) => project.aiAnalysis?.lowConfidence).length;
  const isLoading = !loadError && projects.length === 0;
  const displayStart = visibleProjects.length > 0 ? 1 : 0;
  const displayEnd = Math.min(displayedProjects.length, visibleProjects.length);

  useEffect(() => {
    let active = true;
    fetch("/projects-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load projects: ${response.status}`);
        }
        return response.json() as Promise<ProjectListItem[]>;
      })
      .then((items) => {
        if (active) {
          setProjects(items);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Failed to load projects.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const runtimeQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    if (runtimeQuery.trim().length > 0) {
      setQuery(runtimeQuery);
    }
  }, []);

  useEffect(() => {
    setVisibleLimit(pageSize);
  }, [filters, query, sortKey]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function resetControls() {
    setQuery("");
    setFilters(emptyProjectFilters);
    setSortKey("default");
  }

  function setFilterGroupOpen(filterKey: FilterKey, open: boolean) {
    setOpenFilterGroups((current) => ({
      ...current,
      [filterKey]: open,
    }));
  }

  function removeFilter(filterKey: FilterKey, value: string) {
    setFilters((current) => ({
      ...current,
      [filterKey]: current[filterKey].filter((item) => item !== value),
    }));
  }

  return (
    <section>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                筛选面板
              </div>
              <p className="mt-1 text-xs text-slate-500">{activeFilterCount} 个条件已选</p>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!hasActiveControls}
              onClick={resetControls}
              title="清除条件"
              type="button"
            >
              <span className="sr-only">清除条件</span>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4">
            <ProjectSearch value={query} onChange={setQuery} />
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            排序
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as ProjectSortKey)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {activeFilterCount > 0 ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-950">已选条件</span>
                <span className="font-data text-slate-500">{activeFilterCount}</span>
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs">
                {activeFilterEntries.map(({ key, value }) => (
                  <button
                    className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-left text-slate-600 hover:text-slate-950"
                    key={`${key}-${value}`}
                    onClick={() => removeFilter(key, value)}
                    title={`移除 ${value}`}
                    type="button"
                  >
                    <span className="min-w-0 break-words">{value}</span>
                    <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <FilterGroup
              label="产品类型"
              filterKey="productTypes"
              options={filterOptions.productTypes}
              filters={filters}
              onChange={setFilters}
              isOpen={openFilterGroups.productTypes}
              onOpenChange={(open) => setFilterGroupOpen("productTypes", open)}
              optionLimit={12}
            />
            <FilterGroup
              label="目标用户"
              filterKey="targetUsers"
              options={filterOptions.targetUsers}
              filters={filters}
              onChange={setFilters}
              isOpen={openFilterGroups.targetUsers}
              onOpenChange={(open) => setFilterGroupOpen("targetUsers", open)}
              optionLimit={8}
            />
            <FilterGroup
              label="商业化方式"
              filterKey="monetizationMethods"
              options={filterOptions.monetizationMethods}
              filters={filters}
              onChange={setFilters}
              isOpen={openFilterGroups.monetizationMethods}
              onOpenChange={(open) => setFilterGroupOpen("monetizationMethods", open)}
              optionLimit={8}
            />
            <FilterGroup
              label="链接状态"
              filterKey="linkStatuses"
              options={filterOptions.linkStatuses}
              filters={filters}
              onChange={setFilters}
              isOpen={openFilterGroups.linkStatuses}
              onOpenChange={(open) => setFilterGroupOpen("linkStatuses", open)}
              optionLimit={6}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ListFilter aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                  当前结果
                </div>
                <p className="font-data mt-1 text-3xl font-semibold text-slate-950">
                  {isLoading ? "..." : visibleProjects.length}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {isLoading ? "正在加载" : `/ ${projects.length}`}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500">可用 AI 分析</div>
                  <div className="font-data mt-1 text-lg font-semibold text-slate-950">{isLoading ? "..." : analyzedCount}</div>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500">低置信度</div>
                  <div className="font-data mt-1 text-lg font-semibold text-slate-950">{isLoading ? "..." : lowConfidenceCount}</div>
                </div>
              </div>
            </div>
            {hasActiveControls ? (
              <div className="mt-4 flex min-w-0 flex-wrap gap-2 border-t border-slate-200 pt-4 text-xs">
                {query.trim() ? (
                  <button
                    className="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-left text-slate-600 hover:text-slate-950"
                    onClick={() => setQuery("")}
                    title="清除搜索"
                    type="button"
                  >
                    <span className="min-w-0 break-words">搜索：{query}</span>
                    <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </button>
                ) : null}
                {activeFilterEntries.map(({ key, value }) => (
                  <button
                    className="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-left text-slate-600 hover:text-slate-950"
                    key={`${key}-${value}`}
                    onClick={() => removeFilter(key, value)}
                    title={`移除 ${value}`}
                    type="button"
                  >
                    <span className="min-w-0 break-words">{filterLabels[key]}：{value}</span>
                    <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </button>
                ))}
                {sortKey !== "default" ? (
                  <button
                    className="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-left text-slate-600 hover:text-slate-950"
                    onClick={() => setSortKey("default")}
                    title="恢复默认排序"
                    type="button"
                  >
                    <span>排序：{sortLabel}</span>
                    <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {loadError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              项目数据加载失败，请稍后重试。
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-emerald-700" />
                <span>正在载入项目数据</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-36 animate-pulse rounded-md bg-slate-50" />
                <div className="h-36 animate-pulse rounded-md bg-slate-50" />
              </div>
            </div>
          ) : null}

          {!loadError && projects.length > 0 && visibleProjects.length === 0 ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">没有匹配的项目</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                减少关键词或清除部分筛选条件后再试。
              </p>
              <button
                className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-500"
                onClick={resetControls}
                type="button"
              >
                清除条件
              </button>
            </div>
          ) : null}

          <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2" aria-label="项目卡片">
            {displayedProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>

          {!isLoading && visibleProjects.length > 0 ? (
            <p className="mt-5 text-center text-sm text-slate-500">
              当前显示 {displayStart}-{displayEnd}，共 {visibleProjects.length} 个匹配项目。
            </p>
          ) : null}

          {visibleLimit < visibleProjects.length ? (
            <div className="mt-4 flex justify-center">
              <button
                className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-500 hover:text-slate-950"
                type="button"
                onClick={() => setVisibleLimit((value) => value + pageSize)}
              >
                加载更多，剩余 {visibleProjects.length - visibleLimit} 个
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  filterKey,
  options,
  filters,
  onChange,
  isOpen,
  onOpenChange,
  optionLimit = 8,
}: {
  label: string;
  filterKey: FilterKey;
  options: Array<{ value: string; label: string }>;
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  optionLimit?: number;
}) {
  if (options.length === 0) {
    return (
      <details
        className="group min-w-0 rounded-md border border-slate-200 bg-white text-sm"
        open={isOpen}
        onToggle={(event) => onOpenChange(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 font-medium text-slate-700">
          <span>{label}</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-200 px-3 py-3 text-slate-500">暂无可筛选项</div>
      </details>
    );
  }

  const selectedCount = filters[filterKey].length;
  const visibleOptions = options.slice(0, optionLimit);

  return (
    <details
      className="group min-w-0 rounded-md border border-slate-200 bg-white text-sm"
      open={isOpen}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 font-medium text-slate-700">
        <span>{label}</span>
        <span className="inline-flex items-center gap-2">
          {selectedCount > 0 ? (
            <span className="font-data rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500">{selectedCount}</span>
          ) : null}
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 group-open:rotate-180" />
        </span>
      </summary>
      <div className="grid min-w-0 gap-2 border-t border-slate-200 p-3">
        {visibleOptions.map((option) => {
          const checked = filters[filterKey].includes(option.value);
          return (
            <label
              className={[
                "flex min-w-0 max-w-full items-start gap-2 rounded-md border px-3 py-2 text-slate-700",
                checked ? "border-slate-300 bg-white text-slate-950 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300",
              ].join(" ")}
              key={option.value}
            >
              <input
                checked={checked}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                type="checkbox"
                onChange={() => onChange(toggleFilter(filters, filterKey, option.value))}
              />
              <span className="min-w-0 break-words leading-5">{option.label}</span>
            </label>
          );
        })}
        {options.length > visibleOptions.length ? (
          <p className="text-xs leading-5 text-slate-500">显示前 {visibleOptions.length} 项，搜索可缩小范围。</p>
        ) : null}
      </div>
    </details>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  const analysis = project.aiAnalysis;
  const interpretation = analysis?.interpretation
    ? truncateText(analysis.interpretation, 80)
    : null;

  return (
    <article className="flex min-h-72 min-w-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="font-data text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Project record</p>
          <h2 className="mt-2 min-w-0 break-words text-lg font-semibold leading-7 tracking-normal text-slate-950">
            <a className="break-words hover:text-emerald-700" href={`/projects/${project.slug}`}>
              {project.name}
            </a>
          </h2>
          <p className="mt-1 min-w-0 break-words text-sm text-slate-500">
            {project.author ? `作者：${project.author}` : "作者：原始数据未提供"}
          </p>
        </div>
        {project.url ? (
          <a
            aria-label={`访问 ${project.name} 官网`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-950"
            href={project.url}
            rel="noreferrer"
            target="_blank"
            title="访问官网"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      <div className="grid min-w-0 flex-1 content-start gap-4 px-5 py-4">
        <section className="min-w-0">
          <p className="text-xs font-medium text-slate-500">原始简介</p>
          <p className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-700 sm:line-clamp-3">
            {project.rawDescription || "原始简介暂缺。"}
          </p>
        </section>

        {interpretation ? (
          <section className="min-w-0 rounded-md bg-slate-50 px-3 py-3">
            <p className="text-xs font-medium text-emerald-700">AI 推测</p>
            <p className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-600">{interpretation}</p>
          </section>
        ) : null}
      </div>

      <div className="mt-auto flex min-w-0 flex-wrap gap-2 border-t border-slate-200 px-5 py-4 text-xs">
        {analysis?.productTypes.slice(0, 3).map((type) => (
          <span className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-slate-600" key={type}>
            {type}
          </span>
        ))}
        {analysis?.targetUsers.slice(0, 2).map((targetUser) => (
          <span className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-slate-600" key={targetUser}>
            {targetUser}
          </span>
        ))}
        {analysis?.lowConfidence ? (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">低置信度 AI 推测</span>
        ) : null}
        {!analysis ? (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">暂无 AI 分析</span>
        ) : null}
      </div>
    </article>
  );
}

function toggleFilter(filters: ProjectFilters, key: FilterKey, value: string): ProjectFilters {
  const values = filters[key];
  const nextValues = values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

  return {
    ...filters,
    [key]: nextValues,
  };
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function countActiveFilters(filters: ProjectFilters) {
  return Object.values(filters).reduce((count, values) => count + values.length, 0);
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
