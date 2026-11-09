import { describe, it, expect } from "vitest";
import { resolveMockMode } from "@/lib/api/client";

describe("Frontend Environment & Mock-Mode Safeguards", () => {
  it("enables mock mode when VITE_USE_MOCK is explicitly true", () => {
    expect(resolveMockMode("true", "https://api.thikana.com", true)).toBe(true);
    expect(resolveMockMode("true", undefined, false)).toBe(true);
    expect(resolveMockMode("true", undefined, true)).toBe(true);
  });

  it("enforces real API mode when VITE_USE_MOCK is explicitly false and API_BASE_URL is set", () => {
    expect(resolveMockMode("false", "https://api.thikana.com", true)).toBe(false);
    expect(resolveMockMode("false", "http://localhost:8000/api/v1", false)).toBe(false);
  });

  it("throws when VITE_USE_MOCK is explicitly false but API_BASE_URL is missing", () => {
    expect(() => resolveMockMode("false", undefined, true)).toThrow(
      "[Security Safeguard]"
    );
    expect(() => resolveMockMode("false", undefined, false)).toThrow(
      "[Security Safeguard]"
    );
  });

  it("defaults to mock mode in development when API_BASE_URL is omitted and VITE_USE_MOCK is unset", () => {
    expect(resolveMockMode(undefined, undefined, false)).toBe(true);
  });

  it("uses real API mode when API_BASE_URL is provided and VITE_USE_MOCK is unset", () => {
    expect(resolveMockMode(undefined, "https://api.thikana.com", true)).toBe(false);
    expect(resolveMockMode(undefined, "https://api.thikana.com", false)).toBe(false);
  });

  it("throws a fatal security safeguard error in production if API_BASE_URL is missing and mock is not explicit", () => {
    expect(() => resolveMockMode(undefined, undefined, true)).toThrow(
      "[Security Safeguard]"
    );
  });
});
