import { statusLabels } from "@/lib/labels";
import type { RequestStatus } from "@/lib/types";

const colors: Record<RequestStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-200",
  RESOLVED: "bg-green-50 text-green-700 ring-green-200",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
