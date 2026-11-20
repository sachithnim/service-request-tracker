export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <p role="status" aria-live="polite" className="py-10 text-center text-sm text-gray-500">
      {message}
    </p>
  );
}
