// Every call to the Laravel API goes through this file.
// Auth uses Sanctum SPA cookies: the browser sends the session cookie automatically
// (credentials: "include"), and write requests send the CSRF token in X-XSRF-TOKEN.

import type { User, ValidationErrors } from "./types";

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

// Called on any 401 so the app can send the user back to the login page.
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

  // 419 = CSRF token expired. Get a fresh one and retry once.
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

export const api = {
  login: (email: string, password: string) =>
    request<{ data: User }>("POST", "/api/auth/login", { email, password }).then((res) => res.data),

  me: () => request<{ data: User }>("GET", "/api/auth/me").then((res) => res.data),

  logout: () => request<void>("POST", "/api/auth/logout"),
};
