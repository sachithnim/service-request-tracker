import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/FormField";

export const metadata: Metadata = {
  title: "Page not found · Service Request Tracker",
};

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md space-y-4 text-center">
      <p className="text-sm font-semibold text-blue-700">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/requests" className={buttonClass}>
        Back to my requests
      </Link>
    </div>
  );
}
