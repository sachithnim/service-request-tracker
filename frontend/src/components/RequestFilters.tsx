"use client";

// Filters apply as you use them: dropdowns straight away, search after a short pause in typing.

import { useEffect, useState } from "react";
import { inputClass, secondaryButtonClass } from "@/components/ui/FormField";
import { PRIORITIES, priorityLabels, STATUSES, statusLabels } from "@/lib/labels";

export interface FilterValues {
  search: string;
  status: string;
  priority: string;
}

interface RequestFiltersProps {
  values: FilterValues; // current filters from the URL
  onChange: (changes: Partial<FilterValues>) => void; // only the filters that changed
}

// Wait this long after the last keystroke before searching, so we don't call the API on every key.
const SEARCH_DELAY_MS = 400;

export function RequestFilters({ values, onChange }: RequestFiltersProps) {
  const [search, setSearch] = useState(values.search);
  // The URL search value the input was last synced with.
  const [syncedSearch, setSyncedSearch] = useState(values.search);

  // The URL changed from outside (Clear, back button): show that value in the input.
  if (values.search !== syncedSearch) {
    setSyncedSearch(values.search);
    setSearch(values.search);
  }

  function applySearch(text: string) {
    const trimmed = text.trim();
    if (trimmed !== values.search) {
      setSyncedSearch(trimmed);
      onChange({ search: trimmed });
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => applySearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
    // Only re-run when the typed text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Boolean(values.search || values.status || values.priority || search);

  function clearAll() {
    setSearch("");
    setSyncedSearch("");
    onChange({ search: "", status: "", priority: "" });
  }

  return (
    <form
      role="search"
      aria-label="Filter requests"
      onSubmit={(event) => {
        // Enter in the search box searches right away.
        event.preventDefault();
        applySearch(search);
      }}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="space-y-1">
        <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700">
          Search by title
        </label>
        <input
          id="filter-search"
          type="search"
          maxLength={100}
          placeholder="e.g. printer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select id="filter-status" value={values.status} onChange={(e) => onChange({ status: e.target.value })} className={inputClass}>
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
        <select id="filter-priority" value={values.priority} onChange={(e) => onChange({ priority: e.target.value })} className={inputClass}>
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={clearAll} disabled={!hasFilters} className={secondaryButtonClass}>
        Clear
      </button>
    </form>
  );
}
