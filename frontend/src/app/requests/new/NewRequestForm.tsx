"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass, secondaryButtonClass } from "@/components/ui/FormField";
import { api, ApiError } from "@/lib/api";
import { PRIORITIES, priorityLabels } from "@/lib/labels";
import type { RequestPriority, ValidationErrors } from "@/lib/types";

export function NewRequestForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      const created = await api.createRequest({ title, description, priority });
      router.push(`/requests/${created.id}?created=1`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.errors);
      } else {
        setMessage(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  // The server is the real validator. These limits only guide the user while typing.
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {message && <Alert>{message}</Alert>}

      <FormField id="request-title" label="Title" error={errors.title} hint="3–100 characters">
        <input
          id="request-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "request-title-error" : undefined}
          className={inputClass}
        />
      </FormField>

      <FormField id="request-description" label="Description" error={errors.description} hint="10–500 characters">
        <textarea
          id="request-description"
          rows={5}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "request-description-error" : undefined}
          className={inputClass}
        />
        <p className="text-right text-xs text-gray-500">{description.length}/500</p>
      </FormField>

      <FormField id="request-priority" label="Priority" error={errors.priority}>
        <select
          id="request-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as RequestPriority)}
          aria-invalid={Boolean(errors.priority)}
          aria-describedby={errors.priority ? "request-priority-error" : undefined}
          className={inputClass}
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {priorityLabels[value]}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Creating…" : "Create request"}
        </button>
        <Link href="/requests" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
