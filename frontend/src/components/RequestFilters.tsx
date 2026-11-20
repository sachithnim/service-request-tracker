"use client";

import { buttonClass, inputClass, secondaryButtonClass } from "@/components/ui/FormField";
import { PRIORITIES, priorityLabels, STATUSES, statusLabels } from "@/lib/labels";

export interface FilterValues {
  search: string;
  status: string;
  priority: string;
}

interface RequestFiltersProps {
  values: FilterValues;
  onApply: (values: FilterValues) => void;
}

// Inputs start from the values in the URL. The parent gives this component a new `key`
// whenever the URL changes, so the form resets to match (e.g. after "Clear").
export function RequestFilters({ values, onApply }: RequestFiltersProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onApply({
      search: String(form.get("search") ?? "").trim(),
      status: String(form.get("status") ?? ""),
      priority: String(form.get("priority") ?? ""),
    });
  }

  const hasFilters = Boolean(values.search || values.status || values.priority);

  return (
    <form
      role="search"
      aria-label="Filter requests"
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="space-y-1">
        <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700">
          Search by title
        </label>
        <input id="filter-search" name="search" type="search" maxLength={100} defaultValue={values.search} className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select id="filter-status" name="status" defaultValue={values.status} className={inputClass}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select id="filter-priority" name="priority" defaultValue={values.priority} className={inputClass}>
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={buttonClass}>
          Apply
        </button>
        {hasFilters && (
          <button type="button" onClick={() => onApply({ search: "", status: "", priority: "" })} className={secondaryButtonClass}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
