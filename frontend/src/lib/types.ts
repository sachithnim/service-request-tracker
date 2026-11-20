// Types that match the JSON returned by the Laravel API.

export type RequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type RequestPriority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  version: number;
  allowed_transitions: RequestStatus[];
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: number;
  from_status: RequestStatus;
  to_status: RequestStatus;
  remark: string | null;
  actor: User;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// Field name → list of messages, as returned by a 422 response.
export type ValidationErrors = Record<string, string[]>;
