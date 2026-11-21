import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { LoadingState } from "@/components/ui/LoadingState";
import { RequestDetail } from "./RequestDetail";

export const metadata: Metadata = {
  title: "Request details · Service Request Tracker",
};

export default function RequestDetailPage() {
  return (
    <RequireAuth>
      {/* Next.js needs Suspense around components that read the URL. */}
      <Suspense fallback={<LoadingState />}>
        <RequestDetail />
      </Suspense>
    </RequireAuth>
  );
}
