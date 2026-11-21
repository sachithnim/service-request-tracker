// All calls to the Laravel API. Uses Sanctum cookies + CSRF header.

import type {
  PaginatedResponse,
  RequestPriority,
  RequestStatus,
  ServiceRequest,
  StatusHistory,
  User,
  ValidationErrors,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: Record<string, unknown> = {},
  ) {
    super(message);
  }

  get errors(): ValidationErrors {
    return (this.body.errors as ValidationErrors | undefined) ?? {};
  }
}

// Runs on any 401 (session ended).
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

async function refreshCsrfCookie() {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" });
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": readCookie("XSRF-TOKEN") ?? "",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isWrite = method !== "GET";

  if (isWrite && !readCookie("XSRF-TOKEN")) {
    await refreshCsrfCookie();
  }

  let response = await send(method, path, body);

  // 419 = CSRF token expired: get a new one and retry once.
  if (response.status === 419 && isWrite) {
    await refreshCsrfCookie();
    response = await send(method, path, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(response.status, data.message ?? "Something went wrong. Please try again.", data);
  }

  return data as T;
}

export interface RequestFilters {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
}

export interface NewRequestInput {
  title: string;
  description: string;
  priority: RequestPriority | "";
}

export interface StatusUpdateInput {
  status: RequestStatus;
  expected_version: number;
  remark?: string;
}

// Builds ?a=1&b=2, skipping empty values.
function toQueryString(filters: RequestFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ data: User }>("POST", "/api/auth/login", { email, password }).then((res) => res.data),

  me: () => request<{ data: User }>("GET", "/api/auth/me").then((res) => res.data),

  logout: () => request<void>("POST", "/api/auth/logout"),

  listRequests: (filters: RequestFilters) =>
    request<PaginatedResponse<ServiceRequest>>("GET", `/api/requests?${toQueryString(filters)}`),

  getRequest: (id: string | number) =>
    request<{ data: ServiceRequest }>("GET", `/api/requests/${id}`).then((res) => res.data),

  getHistory: (id: string | number) =>
    request<{ data: StatusHistory[] }>("GET", `/api/requests/${id}/history`).then((res) => res.data),

  createRequest: (input: NewRequestInput) =>
    request<{ data: ServiceRequest }>("POST", "/api/requests", input).then((res) => res.data),

  updateStatus: (id: string | number, input: StatusUpdateInput) =>
    request<{ data: ServiceRequest }>("PATCH", `/api/requests/${id}/status`, input).then((res) => res.data),
};
