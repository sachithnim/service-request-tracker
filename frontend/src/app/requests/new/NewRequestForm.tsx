"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass, FormField, inputClass, secondaryButtonClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { PRIORITIES, priorityLabels } from "@/lib/labels";
import type { RequestPriority, ValidationErrors } from "@/lib/types";

const FIELD_ORDER = ["title", "description", "priority"];

export function NewRequestForm() {
  const router = useRouter();
  const showToast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // No default, so the user picks the priority.
  const [priority, setPriority] = useState<RequestPriority | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("");
    setErrors({});
    setMessage(null);
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      const created = await api.createRequest({ title, description, priority });
      // Next.js keeps this page in memory, so clear it for next time.
      resetForm();
      showToast(`Request #${created.id} created.`);
      router.push("/requests");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.errors);
        // Move the cursor to the first field with an error.
        const firstInvalid = FIELD_ORDER.find((field) => error.errors[field]);
        if (firstInvalid) document.getElementById(`request-${firstInvalid}`)?.focus();
      } else {
        setMessage(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

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
        <p className="text-right text-xs text-gray-500">{title.length}/100</p>
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
          onChange={(e) => setPriority(e.target.value as RequestPriority | "")}
          aria-invalid={Boolean(errors.priority)}
          aria-describedby={errors.priority ? "request-priority-error" : undefined}
          className={inputClass}
        >
          <option value="" disabled>
            Select a priority…
          </option>
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
