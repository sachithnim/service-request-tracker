"use client";

// Confirmation popup. Uses the browser's <dialog>: keeps focus inside, Esc closes it.

import { useEffect, useRef } from "react";
import { buttonClass, secondaryButtonClass } from "./FormField";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(event) => {
        // Esc key
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // Click on the dark background
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg p-0 shadow-xl backdrop:bg-gray-900/50"
    >
      <div className="space-y-4 p-6">
        <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p id="confirm-message" className="text-sm text-gray-600">
          {message}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={buttonClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
