import type { ApiError } from "@flytying/shared";

const TOKEN_KEY = "flytying.admin.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper: injects the bearer token and unwraps JSON / errors. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as ApiError).error ?? `Request failed (${res.status})`;
    throw new ApiRequestError(res.status, message);
  }
  return data as T;
}
