"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Pagination } from "@/components/Pagination";
import { PriorityBadge } from "@/components/PriorityBadge";
import { type FilterValues, RequestFilters } from "@/components/RequestFilters";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, secondaryButtonClass } from "@/components/ui/FormField";
import { LoadingState } from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/labels";
import { useApiData } from "@/lib/useApiData";

export function RequestsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters live in the URL, so refresh and Back keep them.
  const queryString = searchParams.toString();
  // Row to highlight after a create or status change.
  const highlightId = Number(searchParams.get("highlight"));
  const filters: FilterValues = {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
    priority: searchParams.get("priority") ?? "",
  };
  const hasFilters = Boolean(filters.search || filters.status || filters.priority);

  const load = useCallback(() => {
    const params = new URLSearchParams(queryString);
    return api.listRequests({
      search: params.get("search") ?? "",
      status: params.get("status") ?? "",
      priority: params.get("priority") ?? "",
      page: Number(params.get("page") ?? 1) || 1,
    });
  }, [queryString]);

  const { data, error, loading, reload } = useApiData(load, { keepPreviousData: true });

  // Last URL we asked for (the real URL updates a moment later).
  const pendingQuery = useRef<string | null>(null);

  useEffect(() => {
    if (pendingQuery.current === queryString) {
      pendingQuery.current = null;
    }
  }, [queryString]);

  function updateUrl(changes: Partial<FilterValues>, page = 1) {
    const current = new URLSearchParams(pendingQuery.current ?? queryString);
    const values: FilterValues = {
      search: current.get("search") ?? "",
      status: current.get("status") ?? "",
      priority: current.get("priority") ?? "",
      ...changes,
    };

    const params = new URLSearchParams();
    if (values.search) params.set("search", values.search);
    if (values.status) params.set("status", values.status);
    if (values.priority) params.set("priority", values.priority);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();

    // Same filters: no need to reload.
    if (qs === current.toString()) return;

    pendingQuery.current = qs;
    const url = qs ? `/requests?${qs}` : "/requests";
    // Page changes go into history (Back works); filter changes don't.
    if (page > 1 || current.get("page")) {
      router.push(url);
    } else {
      router.replace(url);
    }
  }

  const clearFilters = () => updateUrl({ search: "", status: "", priority: "" });

  return (
    <div className="flex flex-col gap-5 sm:h-[calc(100dvh-7.75rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My requests</h1>
        <Link href="/requests/new" className={buttonClass}>
          New request
        </Link>
      </div>

      <RequestFilters values={filters} onChange={(changes) => updateUrl(changes)} />

      {loading && !data && <LoadingState message="Loading requests…" />}

      {!loading && error && (
        <div className="space-y-3">
          <Alert>{error.status === 422 ? "Some filters are not valid. Please clear them and try again." : error.message}</Alert>
          <div className="flex gap-2">
            <button type="button" onClick={reload} className={secondaryButtonClass}>
              Try again
            </button>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className={secondaryButtonClass}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {!error && data && data.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          {hasFilters ? (
            <>
              <p className="text-gray-700">No requests match your filters.</p>
              <button type="button" onClick={clearFilters} className={`${secondaryButtonClass} mt-4`}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-700">You haven&apos;t raised any requests yet.</p>
              <Link href="/requests/new" className={`${buttonClass} mt-4`}>
                Create your first request
              </Link>
            </>
          )}
        </div>
      )}

      {!error && data && data.data.length > 0 && (
        // On larger screens the page fits the window: the list scrolls inside its card,
        // so the count and pagination always stay visible. Phones use normal page scrolling.
        <div
          aria-busy={loading}
          className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-opacity sm:min-h-0 ${loading ? "opacity-50" : ""}`}
        >
          <ul tabIndex={0} aria-label="Requests" className="divide-y divide-gray-200 focus:outline-none sm:min-h-0 sm:overflow-y-auto">
            {data.data.map((request) => (
              <li key={request.id} className={request.id === highlightId ? "row-highlight" : undefined}>
                <Link href={`/requests/${request.id}`} className="block px-4 py-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-medium text-gray-900">
                      {request.title}
                      {request.id === highlightId && <span className="sr-only"> (just updated)</span>}
                    </p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <StatusBadge status={request.status} />
                      <PriorityBadge priority={request.priority} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Created {formatDate(request.created_at)} · Version {request.version}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer: result count and pagination, always visible under the list. */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
            <p className="text-sm text-gray-600">
              {data.meta.total} {data.meta.total === 1 ? "request" : "requests"}
              {hasFilters && " match your filters"}
              {data.meta.last_page > 1 && ` · showing ${data.meta.from}–${data.meta.to}`}
            </p>
            <Pagination meta={data.meta} onPageChange={(page) => updateUrl({}, page)} />
          </div>
        </div>
      )}
    </div>
  );
}
