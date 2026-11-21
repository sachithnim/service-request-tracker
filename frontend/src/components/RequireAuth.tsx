"use client";

// Wrap pages that need login. Guests go to /login.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LoadingState } from "./ui/LoadingState";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      // Come back here after login.
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <LoadingState message="Checking your session…" />;
  }

  return children;
}
