import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "My requests · Service Request Tracker",
};

// Placeholder until the request list is built.
export default function RequestsPage() {
  return (
    <RequireAuth>
      <h1 className="text-2xl font-semibold">My requests</h1>
      <p className="mt-2 text-sm text-gray-600">You are signed in.</p>
    </RequireAuth>
  );
}
