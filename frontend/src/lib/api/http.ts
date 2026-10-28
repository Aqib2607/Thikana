import { API_BASE_URL, type ApiError } from "./client";

export const TOKEN_STORAGE_KEY = "thikana.auth.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function httpRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = API_BASE_URL || "/api/v1";
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl.replace(/\/+$/, "")}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type to JSON if not sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (_networkError: unknown) {
    const error: ApiError = {
      status: 0,
      message: "common.errors.networkError",
    };
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // If 401 Unauthenticated on a protected endpoint, clear invalid token
    if (response.status === 401) {
      setAuthToken(null);
    }

    const error: ApiError = {
      status: response.status,
      message: data?.message || `Error ${response.status}`,
      fieldErrors: data?.fieldErrors || data?.errors || undefined,
    };
    throw error;
  }

  return data as T;
}

export const http = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    httpRequest<T>(endpoint, { method: "GET", headers }),
  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    httpRequest<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),
  put: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    httpRequest<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),
  patch: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    httpRequest<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    httpRequest<T>(endpoint, { method: "DELETE", headers }),
};

