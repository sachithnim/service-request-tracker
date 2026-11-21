"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ValidationErrors } from "@/lib/types";

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  // Already signed in? Go straight to the requests list.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/requests");
    }
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      await login(email, password);
      // Don't leave the password in a page Next.js keeps alive in the background.
      setEmail("");
      setPassword("");
      setSubmitting(false);
      router.replace("/requests");
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
