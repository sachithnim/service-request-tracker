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
    <div className="space-y-5">
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
        // Old results stay visible (faded) while new ones load.
        <div aria-busy={loading} className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
          <p className="text-sm text-gray-600">
            {data.meta.total} {data.meta.total === 1 ? "request" : "requests"}
            {hasFilters && " match your filters"}
          </p>
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {data.data.map((request) => (
              <li key={request.id}>
                <Link href={`/requests/${request.id}`} className="block px-4 py-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{request.title}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={request.status} />
                      <PriorityBadge priority={request.priority} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    #{request.id} · Created {formatDate(request.created_at)} · Version {request.version}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} onPageChange={(page) => updateUrl({}, page)} />
        </div>
      )}
    </div>
  );
}
