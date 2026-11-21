"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "./ui/Toast";
import { NavLinks } from "./NavLinks";

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
      showToast("Couldn't sign out. Please try again.", "error");
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/requests" className="text-base font-semibold text-gray-900">
            Service Request Tracker
          </Link>
          {/* Next.js needs Suspense around components that read the URL. */}
          {user && (
            <Suspense>
              <NavLinks />
            </Suspense>
          )}
        </div>

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
          </div>
        )}
      </div>
    </header>
  );
}
