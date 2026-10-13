// Temporary mock adapter. Delete once real API contracts are wired in.
export const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
export * from "./auth";
export * from "./properties";
export * from "./tenant";
export * from "./landlord";
export * from "./admin";
export * from "./notifications";
