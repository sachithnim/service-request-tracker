"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass } from "@/components/ui/FormField";
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
  // True while the parent is reloading the latest version. Buttons are disabled meanwhile.
  busy: boolean;
  // Asks the parent to load the latest request and history.
  onReload: () => void;
}

export function StatusActions({ request, busy, onReload }: StatusActionsProps) {
  const showToast = useToast();
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState<string | null>(null);
  const [savingTo, setSavingTo] = useState<RequestStatus | null>(null);
  // Conflicts and errors stay on screen (not a toast) because the user needs to act on them.
  const [notice, setNotice] = useState<Notice | null>(null);

  async function changeStatus(status: RequestStatus) {
    setSavingTo(status);
    setRemarkError(null);
    setNotice(null);

    try {
      await api.updateStatus(request.id, {
        status,
        // The version we are looking at. If someone changed the request since, the API returns 409.
        expected_version: request.version,
        remark: remark.trim() || undefined,
      });
      setRemark("");
      showToast(`Status changed to ${statusLabels[status]}.`);
      onReload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const message =
          error.body.reason === "stale_version"
            ? "Someone else changed this request while you were viewing it. The latest version is now shown. Please review it and try again."
            : `${error.message} The latest version is now shown.`;
        // Keep the remark so the user can retry without typing it again.
        setNotice({ type: "warning", message });
        onReload();
      } else if (error instanceof ApiError && error.status === 422) {
        setRemarkError(error.errors.remark?.[0] ?? error.message);
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

          <div className="flex flex-wrap gap-2">
            {request.allowed_transitions.map((status) => (
              <button key={status} type="button" onClick={() => changeStatus(status)} disabled={busy || savingTo !== null} className={buttonClass}>
                {savingTo === status ? "Saving…" : actionLabels[status]}
              </button>
            ))}
          </div>
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
