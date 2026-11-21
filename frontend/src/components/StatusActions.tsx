"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass, secondaryButtonClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { actionLabels, statusLabels } from "@/lib/labels";
import type { RequestStatus, ServiceRequest } from "@/lib/types";

interface Notice {
  type: "warning" | "error";
  message: string;
}

interface StatusActionsProps {
  request: ServiceRequest;
  // True while the latest version is loading.
  busy: boolean;
  onReload: () => void;
}

export function StatusActions({ request, busy, onReload }: StatusActionsProps) {
  const showToast = useToast();
  const router = useRouter();
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState<string | null>(null);
  const [savingTo, setSavingTo] = useState<RequestStatus | null>(null);
  // Shown inline (not a toast) because the user must act on it.
  const [notice, setNotice] = useState<Notice | null>(null);
  // RESOLVED is final, so ask first.
  const [confirmingResolve, setConfirmingResolve] = useState(false);

  function handleClick(status: RequestStatus) {
    if (status === "RESOLVED" && !confirmingResolve) {
      setConfirmingResolve(true);
      return;
    }
    changeStatus(status);
  }

  async function changeStatus(status: RequestStatus) {
    setConfirmingResolve(false);
    setSavingTo(status);
    setRemarkError(null);
    setNotice(null);

    try {
      await api.updateStatus(request.id, {
        status,
        // If someone changed it since we loaded it, the API returns 409.
        expected_version: request.version,
        remark: remark.trim() || undefined,
      });
      setRemark("");
      showToast(`Moved to ${statusLabels[status]}`, { description: request.title });
      // Refresh this page too, in case the user comes back to it.
      onReload();
      router.push("/requests");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const message =
          error.body.reason === "stale_version"
            ? "Someone else changed this request while you were viewing it. The latest version is now shown. Please review it and try again."
            : `${error.message} The latest version is now shown.`;
        // Remark is kept, so the user can just retry.
        setNotice({ type: "warning", message });
        onReload();
      } else if (error instanceof ApiError && error.status === 422) {
        setRemarkError(error.errors.remark?.[0] ?? error.message);
        document.getElementById("status-remark")?.focus();
      } else {
        setNotice({ type: "error", message: error instanceof ApiError ? error.message : "Something went wrong." });
      }
    } finally {
      setSavingTo(null);
    }
  }

  const isFinal = request.allowed_transitions.length === 0;

  return (
    <div className="space-y-3">
      {notice && <Alert type={notice.type}>{notice.message}</Alert>}

      {isFinal ? (
        <p className="text-sm text-gray-600">This request is resolved. No further status changes are possible.</p>
      ) : (
        <>
          <FormField id="status-remark" label="Remark (optional)" error={remarkError ? [remarkError] : undefined} hint="Up to 255 characters">
            <textarea
              id="status-remark"
              rows={2}
              maxLength={255}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              aria-invalid={Boolean(remarkError)}
              aria-describedby={remarkError ? "status-remark-error" : undefined}
              className={inputClass}
            />
          </FormField>

          {confirmingResolve ? (
            <div role="alertdialog" aria-labelledby="confirm-resolve-text" className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p id="confirm-resolve-text" className="text-sm text-amber-900">
                Resolving is final. The status can&apos;t be changed after this. Continue?
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => changeStatus("RESOLVED")} disabled={busy || savingTo !== null} className={buttonClass}>
                  {savingTo === "RESOLVED" ? "Saving…" : "Yes, mark as resolved"}
                </button>
                <button type="button" onClick={() => setConfirmingResolve(false)} disabled={savingTo !== null} className={secondaryButtonClass}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {request.allowed_transitions.map((status) => (
                <button key={status} type="button" onClick={() => handleClick(status)} disabled={busy || savingTo !== null} className={buttonClass}>
                  {savingTo === status ? "Saving…" : actionLabels[status]}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {busy && (
        <p role="status" className="text-sm text-gray-500">
          Loading the latest version…
        </p>
      )}
    </div>
  );
}
