/**
 * Typed API boundary. No Laravel contract exists yet, so only shared shapes live here.
 * Real endpoints must replace `mock/` — never invent endpoint names. See CONTRACT-GAPS.md.
 */
export type Role = "tenant" | "landlord" | "admin";
export type PropertyType = "apartment" | "house" | "room" | "sublet" | "hostel" | "mess";
export type Availability = "available" | "reserved" | "rented" | "temporarily_unavailable";
export type VisitStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface ApiError { status: number; message: string; fieldErrors?: Record<string, string[]> }

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const USE_MOCK = !API_BASE_URL;
