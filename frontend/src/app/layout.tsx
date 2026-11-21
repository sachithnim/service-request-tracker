import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Service Request Tracker",
  description: "Raise and track internal service requests.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ToastProvider>
          <AuthProvider>
            <AppHeader />
            <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
