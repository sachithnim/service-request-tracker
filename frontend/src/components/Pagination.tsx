import { secondaryButtonClass } from "@/components/ui/FormField";
import type { PaginatedResponse } from "@/lib/types";

interface PaginationProps {
  meta: PaginatedResponse<unknown>["meta"];
  onPageChange: (page: number) => void;
}

const smallButton = `${secondaryButtonClass} px-3 py-1.5`;

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page } = meta;

  if (last_page <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2 text-sm text-gray-600">
      <button type="button" onClick={() => onPageChange(current_page - 1)} disabled={current_page <= 1} className={smallButton}>
        ‹ Previous
      </button>
      <span aria-current="page" className="whitespace-nowrap">
        Page {current_page} of {last_page}
      </span>
      <button type="button" onClick={() => onPageChange(current_page + 1)} disabled={current_page >= last_page} className={smallButton}>
        Next ›
      </button>
    </nav>
  );
}
