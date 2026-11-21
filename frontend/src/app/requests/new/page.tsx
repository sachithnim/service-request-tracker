import type { Metadata } from "next";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { NewRequestForm } from "./NewRequestForm";

export const metadata: Metadata = {
  title: "New request · Service Request Tracker",
};

export default function NewRequestPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/requests" className="text-sm text-blue-700 hover:underline">
          ← Back to my requests
        </Link>
        <h1 className="text-2xl font-semibold">New request</h1>
        <NewRequestForm />
      </div>
    </RequireAuth>
  );
}
