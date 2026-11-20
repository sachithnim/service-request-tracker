"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setError(false);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError(true);
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
              Signed in as <span className="font-medium text-gray-900">{user.name}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
            {error && (
              <span role="alert" className="text-red-600">
                Couldn&apos;t sign out. Try again.
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
