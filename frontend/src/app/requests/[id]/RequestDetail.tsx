"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { HistoryList } from "@/components/HistoryList";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusActions } from "@/components/StatusActions";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowSteps } from "@/components/WorkflowSteps";
import { Alert } from "@/components/ui/Alert";
import { secondaryButtonClass } from "@/components/ui/FormField";
import { LoadingState } from "@/components/ui/LoadingState";
import { api, GENERIC_ERROR } from "@/lib/api";
import { formatDate } from "@/lib/labels";
import { useApiData } from "@/lib/useApiData";

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();

  // Load both together so version and history match.
  const load = useCallback(async () => {
    const [request, history] = await Promise.all([api.getRequest(id), api.getHistory(id)]);
    return { request, history };
  }, [id]);

  const { data, error, loading, reload } = useApiData(load);

  const backLink = (
    <Link href="/requests" className="text-sm text-blue-700 hover:underline">
      ← Back to my requests
    </Link>
  );

  if (!data && loading) {
    return <LoadingState message="Loading request…" />;
  }

  if (!data && error?.status === 404) {
    return (
      <div className="space-y-4">
        {backLink}
        <Alert>Request not found. It may not exist, or it belongs to another user.</Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {backLink}
        <Alert>{error?.message ?? GENERIC_ERROR}</Alert>
        <button type="button" onClick={reload} className={secondaryButtonClass}>
          Try again
        </button>
      </div>
    );
  }

  const { request, history } = data;

  return (
    <div className="space-y-6">
      {/* Sets the browser tab title. */}
      <title>{`${request.title} · Service Request Tracker`}</title>
      {backLink}

      {error &&<Alert>Couldn&apos;t refresh the request: {error.message}</Alert>}

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm" aria-busy={loading}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold break-words">{request.title}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>

        <p className="whitespace-pre-wrap break-words text-gray-700">{request.description}</p>

        <dl className="grid gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd>{formatDate(request.created_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last updated</dt>
            <dd>{formatDate(request.updated_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Current version</dt>
            <dd className="font-medium">{request.version}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Change status</h2>
        <WorkflowSteps status={request.status} />
        <StatusActions request={request} busy={loading} onReload={reload} />
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Status history</h2>
        <HistoryList history={history} />
      </section>
    </div>
  );
}
