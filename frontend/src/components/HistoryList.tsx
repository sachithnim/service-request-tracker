import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/labels";
import type { StatusHistory } from "@/lib/types";

export function HistoryList({ history }: { history: StatusHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500">No status changes yet.</p>;
  }

  // The API returns history oldest first, so this reads top to bottom in time order.
  return (
    <ol className="space-y-4 border-l-2 border-gray-200 pl-5">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span aria-hidden="true" className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={entry.from_status} />
            <span aria-hidden="true">→</span>
            <span className="sr-only">changed to</span>
            <StatusBadge status={entry.to_status} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            by {entry.actor.name} · {formatDate(entry.created_at)}
          </p>
          {entry.remark && <p className="mt-1 text-sm text-gray-700">&ldquo;{entry.remark}&rdquo;</p>}
        </li>
      ))}
    </ol>
  );
}
