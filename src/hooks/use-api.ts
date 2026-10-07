"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { apiResource } from "@/services/api-cache";
export { invalidateRecords } from "@/services/api-cache";
export function useApi<T>(key: string) {
  const resource = useMemo(() => apiResource(key), [key]);
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  useEffect(() => {
    resource.load();
  }, [resource]);
  return { ...state, data: state.data as T | undefined, retry: resource.retry };
}
