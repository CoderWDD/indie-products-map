import { Map } from "lucide-react";

type StatusBadgeProps = {
  label: string;
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <Map aria-hidden="true" className="h-4 w-4 text-emerald-600" />
      {label}
    </span>
  );
}
