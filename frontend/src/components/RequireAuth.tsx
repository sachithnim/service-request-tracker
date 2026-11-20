"use client";

// Wrap any page that needs a logged-in user. Guests are sent to /login.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LoadingState } from "./ui/LoadingState";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <LoadingState message="Checking your session…" />;
  }

  return children;
}
