"use client";
import { useEffect, useSyncExternalStore } from "react";
import { apiRequest, ApiError, onUnauthorized } from "@/lib/api";
import { invalidateRecords } from "./api-cache";
import type { Admin } from "@/types/domain";
const initial = { ready: false, user: null as Admin | null, error: "" };
let state = initial;
let pending: Promise<void> | undefined;
let generation = 0;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function signedOut() {
  generation++;
  pending = undefined;
  state = { ready: true, user: null, error: "" };
  invalidateRecords(false);
  emit();
}
onUnauthorized(signedOut);
async function checkSession() {
  if (pending) return pending;
  const current = generation;
  pending = apiRequest<{ data: Admin }>("/auth/me")
    .then(
      ({ data }) => {
        if (current !== generation) return;
        state = { ready: true, user: data, error: "" };
        emit();
      },
      (error) => {
        if (current !== generation) return;
        state = {
          ready: true,
          user: null,
          error:
            error instanceof ApiError && error.status === 401
              ? ""
              : error.message,
        };
        emit();
      },
    )
    .finally(() => {
      if (current === generation) pending = undefined;
    });
  return pending;
}
export function useAuth() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => initial,
  );
  useEffect(() => {
    if (!state.ready) void checkSession();
    const focus = () => {
      if (state.user) void checkSession();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, []);
  return { ...snapshot, authenticated: !!snapshot.user, retry: checkSession };
}
export const authActions = {
  async changePassword(currentPassword: string, newPassword: string) {
    await apiRequest<void>("/auth/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    signedOut();
  },
  async login(email: string, password: string) {
    const { data } = await apiRequest<{ data: Admin }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    generation++;
    pending = undefined;
    invalidateRecords(false);
    state = { ready: true, user: data, error: "" };
    emit();
  },
  async logout() {
    await apiRequest<void>("/auth/logout", { method: "POST" });
    signedOut();
  },
};
