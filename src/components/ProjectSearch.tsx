import { Search } from "lucide-react";

type ProjectSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProjectSearch({ value, onChange }: ProjectSearchProps) {
  return (
    <label className="relative block">
      <span className="sr-only">搜索项目</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      />
      <input
        className="w-full rounded-md border border-slate-300 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-emerald-600"
        placeholder="搜索项目、作者、简介、AI 摘要或产品模式"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
