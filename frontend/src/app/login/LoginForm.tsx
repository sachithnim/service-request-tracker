"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ValidationErrors } from "@/lib/types";

// Only allow our own pages (blocks redirects to other sites).
function safeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/requests";
}

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const sessionExpired = searchParams.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  // Already signed in: skip the login page.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath);
    }
  }, [status, router, nextPath]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      await login(email, password);
      // Next.js keeps this page in memory, so clear the password.
      setEmail("");
      setPassword("");
      setSubmitting(false);
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.errors);
        document.getElementById(error.errors.email ? "login-email" : "login-password")?.focus();
      } else if (error instanceof ApiError && error.status === 429) {
        setMessage("Too many sign-in attempts. Please wait a minute and try again.");
      } else {
        setMessage(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {sessionExpired && !message && <Alert type="warning">Your session has expired. Please sign in again.</Alert>}
      {message && <Alert>{message}</Alert>}

      <FormField id="login-email" label="Email" error={errors.email}>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={inputClass}
        />
      </FormField>

      <FormField id="login-password" label="Password" error={errors.password}>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className={inputClass}
        />
      </FormField>

      <button type="submit" disabled={submitting} className={`${buttonClass} w-full`}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
