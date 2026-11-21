"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClass, secondaryButtonClass } from "@/components/ui/FormField";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-gray-600">An unexpected error happened while showing this page.</p>
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => retry()} className={buttonClass}>
          Try again
        </button>
        <Link href="/requests" className={secondaryButtonClass}>
          Back to my requests
        </Link>
      </div>
    </div>
  );
}
