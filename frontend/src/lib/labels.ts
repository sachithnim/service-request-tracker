// Text shown for API values.

import type { RequestPriority, RequestStatus } from "./types";

export const STATUSES: RequestStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];
export const PRIORITIES: RequestPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const statusLabels: Record<RequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export const priorityLabels: Record<RequestPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// Button text for moving to each status.
export const actionLabels: Record<RequestStatus, string> = {
  OPEN: "Reopen",
  IN_PROGRESS: "Start progress",
  RESOLVED: "Mark as resolved",
};

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
