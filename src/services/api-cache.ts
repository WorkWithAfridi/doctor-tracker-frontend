import { apiRequest } from "../lib/api";
import { doctorDirectory } from "./records";

export interface ApiState {
  data: unknown;
  error: string;
  loading: boolean;
}
interface Entry {
  state: ApiState;
  listeners: Set<() => void>;
  controller?: AbortController;
}
const initial: ApiState = { data: undefined, error: "", loading: true };
const cache = new Map<string, Entry>();
function entry(key: string) {
  if (!cache.has(key)) cache.set(key, { state: initial, listeners: new Set() });
  return cache.get(key)!;
}
function emit(item: Entry) {
  item.listeners.forEach((listener) => listener());
}
function load(key: string, item: Entry) {
  if (item.controller) return;
  const controller = new AbortController();
  item.controller = controller;
  const promise =
    key === "doctor-directory"
      ? doctorDirectory(controller.signal)
      : apiRequest(key, { signal: controller.signal });
  promise
    .then(
      (data) => {
        if (item.controller !== controller) return;
        item.state = { data, error: "", loading: false };
      },
      (error) => {
        if (item.controller !== controller) return;
        item.state = {
          data: undefined,
          error:
            error instanceof Error ? error.message : "Unable to load records.",
          loading: false,
        };
      },
    )
    .finally(() => {
      if (item.controller !== controller) return;
      item.controller = undefined;
      emit(item);
    });
}
function reset(key: string, item: Entry, reload: boolean) {
  item.controller?.abort();
  item.controller = undefined;
  item.state = initial;
  emit(item);
  if (reload && item.listeners.size) load(key, item);
}
export function invalidateRecords(reload = true) {
  cache.forEach((item, key) => reset(key, item, reload));
}
export function apiResource(key: string) {
  const item = entry(key);
  return {
    subscribe(listener: () => void) {
      item.listeners.add(listener);
      return () => {
        item.listeners.delete(listener);
      };
    },
    getSnapshot: () => item.state,
    getServerSnapshot: () => initial,
    load: () => load(key, item),
    retry: () => reset(key, item, true),
  };
}
