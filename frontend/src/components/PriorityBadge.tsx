import { priorityLabels } from "@/lib/labels";
import type { RequestPriority } from "@/lib/types";

const colors: Record<RequestPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-indigo-50 text-indigo-700",
  HIGH: "bg-red-50 text-red-700",
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${colors[priority]}`}>
      {priorityLabels[priority]} priority
    </span>
  );
}
