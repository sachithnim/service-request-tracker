"use client";

// Loads API data with loading / error / reload. Wrap `load` in useCallback.

import { useCallback, useEffect, useState } from "react";
import { ApiError, GENERIC_ERROR } from "./api";

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
        const apiError = error instanceof ApiError ? error : new ApiError(0, GENERIC_ERROR);
        setState((previous) => ({
          source: load,
          attempt,
          data: previous.source === load ? previous.data : undefined,
          error: apiError,
        }));
      });

    // Ignore answers to an older request.
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
