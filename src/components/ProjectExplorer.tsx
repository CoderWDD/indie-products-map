import { ExternalLink } from "lucide-react";
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

export function ProjectExplorer({ initialQuery = "" }: ProjectExplorerProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<ProjectFilters>(emptyProjectFilters);
  const [sortKey, setSortKey] = useState<ProjectSortKey>("default");
  const [visibleLimit, setVisibleLimit] = useState(pageSize);
  const [loadError, setLoadError] = useState<string | null>(null);
  const filterOptions = useMemo(() => createFilterOptions(projects), [projects]);
  const visibleProjects = useMemo(() => {
    const searchedProjects = searchProjects(projects, query);
    return sortProjects(filterProjects(searchedProjects, filters), sortKey);
  }, [filters, projects, query, sortKey]);
  const displayedProjects = visibleProjects.slice(0, visibleLimit);

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

  return (
    <section className="mt-8">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <ProjectSearch value={query} onChange={setQuery} />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="grid gap-4 md:grid-cols-2">
            <FilterGroup
              label="目标用户"
              filterKey="targetUsers"
              options={filterOptions.targetUsers}
              filters={filters}
              onChange={setFilters}
            />
            <FilterGroup
              label="产品类型"
              filterKey="productTypes"
              options={filterOptions.productTypes}
              filters={filters}
              onChange={setFilters}
            />
            <FilterGroup
              label="商业化方式"
              filterKey="monetizationMethods"
              options={filterOptions.monetizationMethods}
              filters={filters}
              onChange={setFilters}
            />
            <FilterGroup
              label="链接状态"
              filterKey="linkStatuses"
              options={filterOptions.linkStatuses}
              filters={filters}
              onChange={setFilters}
            />
          </div>
          <label className="text-sm font-medium text-slate-700">
            排序
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
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
        </div>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        显示 {visibleProjects.length} / {projects.length} 个项目
      </div>

      {loadError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          项目数据加载失败，请稍后重试。
        </div>
      ) : null}

      {!loadError && projects.length === 0 ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          正在加载项目数据...
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="项目卡片">
        {displayedProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {visibleLimit < visibleProjects.length ? (
        <div className="mt-6 flex justify-center">
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-500"
            type="button"
            onClick={() => setVisibleLimit((value) => value + pageSize)}
          >
            加载更多
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FilterGroup({
  label,
  filterKey,
  options,
  filters,
  onChange,
}: {
  label: string;
  filterKey: FilterKey;
  options: Array<{ value: string; label: string }>;
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
}) {
  if (options.length === 0) {
    return (
      <div className="text-sm">
        <div className="font-medium text-slate-700">{label}</div>
        <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-slate-500">暂无可筛选项</div>
      </div>
    );
  }

  return (
    <fieldset className="text-sm">
      <legend className="font-medium text-slate-700">{label}</legend>
      <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-auto">
        {options.map((option) => (
          <label
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
            key={option.value}
          >
            <input
              checked={filters[filterKey].includes(option.value)}
              className="h-4 w-4 accent-emerald-600"
              type="checkbox"
              onChange={() => onChange(toggleFilter(filters, filterKey, option.value))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  const analysis = project.aiAnalysis;
  const interpretation = analysis?.interpretation
    ? truncateText(analysis.interpretation, 80)
    : null;

  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-normal text-slate-950">
          <a className="hover:text-emerald-700" href={`/projects/${project.slug}`}>
            {project.name}
          </a>
        </h2>
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
      <p className="mt-2 text-sm text-slate-500">
        {project.author ? `作者：${project.author}` : "作者：原始数据未提供"}
      </p>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">
        {project.rawDescription || "原始简介暂缺。"}
      </p>
      {interpretation ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{interpretation}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {analysis?.productTypes.map((type) => (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600" key={type}>
            {type}
          </span>
        ))}
        {analysis?.targetUsers.map((targetUser) => (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600" key={targetUser}>
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

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
