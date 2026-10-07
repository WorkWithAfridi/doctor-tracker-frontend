const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");
const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> | null = null,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Unable to reach the API. Check your connection and try again.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && path !== "/auth/login")
      unauthorizedListeners.forEach((listener) => listener());
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      body?.errors ?? null,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
