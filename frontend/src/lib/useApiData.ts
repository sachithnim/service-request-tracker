"use client";

// Loads data from the API and tracks loading / error state.
// `load` must be wrapped in useCallback: when it changes (e.g. new filters), data is fetched again.
// `reload()` fetches again but keeps showing the current data until the new data arrives.
// With `keepPreviousData`, the old results also stay visible while a new query loads
// (used by the list, so changing a filter doesn't blank the page).

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

interface LoadState<T> {
  source?: () => Promise<T>;
  attempt?: number;
  data?: T;
  error?: ApiError;
}

export function useApiData<T>(load: () => Promise<T>, { keepPreviousData = false } = {}) {
  const [state, setState] = useState<LoadState<T>>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    load()
      .then((data) => {
        if (!ignore) setState({ source: load, attempt, data });
      })
      .catch((error) => {
        if (ignore) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, "Something went wrong. Please try again.");
        setState((previous) => ({
          source: load,
          attempt,
          data: previous.source === load ? previous.data : undefined,
          error: apiError,
        }));
      });

    // Ignore late responses from an older request (e.g. the user changed filters quickly).
    return () => {
      ignore = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const sameQuery = state.source === load;
  const loading = !sameQuery || state.attempt !== attempt;

  return {
    data: sameQuery || keepPreviousData ? state.data : undefined,
    error: sameQuery && !loading ? state.error : undefined,
    loading,
    reload,
  };
}
