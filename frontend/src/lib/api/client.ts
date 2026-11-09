/**
 * Typed API boundary. No Laravel contract exists yet, so only shared shapes live here.
 * Real endpoints must replace `mock/` — never invent endpoint names. See CONTRACT-GAPS.md.
 */
export type Role = "tenant" | "landlord" | "admin";
export type PropertyType = "apartment" | "house" | "room" | "sublet" | "hostel" | "mess";
export type Availability = "available" | "reserved" | "rented" | "temporarily_unavailable";
export type VisitStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ??
  (typeof window !== "undefined" && import.meta.env.MODE !== "test" ? "/api/v1" : undefined);

export function resolveMockMode(
  envMock?: string,
  apiBaseUrl?: string,
  isProd: boolean = import.meta.env.PROD,
): boolean {
  if (envMock === "true") {
    return true;
  }
  if (envMock === "false") {
    if (!apiBaseUrl) {
      throw new Error(
        "[Security Safeguard] VITE_USE_MOCK is set to 'false' but VITE_API_BASE_URL is not configured.",
      );
    }
    return false;
  }
  if (!apiBaseUrl) {
    if (isProd) {
      throw new Error(
        "[Security Safeguard] Production environment missing VITE_API_BASE_URL without explicit VITE_USE_MOCK=true. Real API communication cannot be established.",
      );
    }
    return true;
  }
  return false;
}

export const USE_MOCK = resolveMockMode(
  import.meta.env["VITE_USE_MOCK"] as string | undefined,
  API_BASE_URL,
);
