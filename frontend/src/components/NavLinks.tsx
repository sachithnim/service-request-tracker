"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/requests", label: "My requests" },
  { href: "/requests/new", label: "New request" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-1 text-sm">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
