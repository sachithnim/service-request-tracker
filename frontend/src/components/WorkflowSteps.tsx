// Open → In progress → Resolved, with the current step highlighted.

import { STATUSES, statusLabels } from "@/lib/labels";
import type { RequestStatus } from "@/lib/types";

export function WorkflowSteps({ status }: { status: RequestStatus }) {
  const currentIndex = STATUSES.indexOf(status);
  const isFinished = status === "RESOLVED";

  return (
    <ol aria-label="Workflow progress" className="flex items-center gap-2 pb-3 text-sm">
      {STATUSES.map((step, index) => {
        const done = index < currentIndex || (isFinished && index === currentIndex);
        const current = index === currentIndex;

        return (
          <li key={step} aria-current={current ? "step" : undefined} className="flex flex-1 items-center gap-2">
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done ? "bg-green-600 text-white" : current ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={`whitespace-nowrap ${current ? "font-semibold text-gray-900" : "text-gray-500"}`}>
              {statusLabels[step]}
              {current && <span className="sr-only"> (current step)</span>}
            </span>
            {index < STATUSES.length - 1 && <span aria-hidden="true" className={`h-0.5 min-w-2 flex-1 ${index < currentIndex ? "bg-green-600" : "bg-gray-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
