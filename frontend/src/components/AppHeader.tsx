"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "./ui/Toast";

export function AppHeader() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // logout() reloads the app on /login.
      await logout();
    } catch {
      showToast("Couldn't sign out", { description: "Please check your connection and try again.", type: "error" });
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/requests" className="text-base font-semibold text-gray-900">
          Service Request Tracker
        </Link>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              <span className="hidden sm:inline">Signed in as </span><span className="font-medium text-gray-900">{user.name}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
