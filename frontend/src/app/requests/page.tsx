import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { LoadingState } from "@/components/ui/LoadingState";
import { RequestsList } from "./RequestsList";

export const metadata: Metadata = {
  title: "My requests · Service Request Tracker",
};

export default function RequestsPage() {
  return (
    <RequireAuth>
      {/* RequestsList reads the URL (useSearchParams), which Next.js requires inside Suspense. */}
      <Suspense fallback={<LoadingState />}>
        <RequestsList />
      </Suspense>
    </RequireAuth>
  );
}
