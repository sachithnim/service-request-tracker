import { secondaryButtonClass } from "@/components/ui/FormField";
import type { PaginatedResponse } from "@/lib/types";

interface PaginationProps {
  meta: PaginatedResponse<unknown>["meta"];
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page, from, to, total } = meta;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className={secondaryButtonClass}
        >
          Previous
        </button>
        <span aria-current="page">
          Page {current_page} of {last_page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= last_page}
          className={secondaryButtonClass}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
