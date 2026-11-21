"use client";

// Popups that close by themselves. Use: showToast("Saved.") or showToast("Failed.", "error")

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type ShowToast = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TOAST_DURATION_MS = 4000;

const styles: Record<ToastType, { box: string; icon: string; symbol: string }> = {
  success: { box: "border-green-200 bg-green-50 text-green-800", icon: "bg-green-600", symbol: "✓" },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: "bg-red-600", symbol: "!" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ShowToast>(
    (message, type = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => {
          const style = styles[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${style.box}`}
            >
              <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.icon}`}>
                {style.symbol}
              </span>
              <span className="min-w-0 flex-1 break-words">{toast.message}</span>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
