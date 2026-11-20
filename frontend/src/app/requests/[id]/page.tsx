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
      {/* RequestDetail reads the URL (useParams / useSearchParams), so it must be inside Suspense. */}
      <Suspense fallback={<LoadingState />}>
        <RequestDetail />
      </Suspense>
    </RequireAuth>
  );
}
