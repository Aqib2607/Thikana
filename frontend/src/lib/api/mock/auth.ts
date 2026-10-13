// Temporary mock adapter. Delete once real API contracts are wired in.
// Demo only: data lives in localStorage; never store real passwords here.
import type { ApiError, Role } from "../client";
import { delay } from "./index";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  verified: boolean;
}
interface StoredUser extends User {
  password: string;
}

const USERS_KEY = "thikana.mock.users";
const SESSION_KEY = "thikana.mock.session";
const RESET_KEY = "thikana.mock.reset";
export const MOCK_CODE = "123456";

const seed: StoredUser[] = [
  {
    id: "u-tenant",
    name: "রাফি আহমেদ",
    email: "tenant@demo.test",
    phone: "01711111111",
    role: "tenant",
    verified: true,
    password: "Password1",
  },
  {
    id: "u-landlord",
    name: "করিম হোসেন",
    email: "landlord@demo.test",
    phone: "01822222222",
    role: "landlord",
    verified: true,
    password: "Password1",
  },
  {
    id: "u-admin",
    name: "অ্যাডমিন",
    email: "admin@demo.test",
    phone: "01933333333",
    role: "admin",
    verified: true,
    password: "Password1",
  },
];

const fail = (status: number, message: string, fieldErrors?: Record<string, string[]>): never => {
  const e: ApiError = fieldErrors ? { status, message, fieldErrors } : { status, message };
  throw e;
};

function users(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seed));
    return [...seed];
  }
  return JSON.parse(raw) as StoredUser[];
}
const save = (u: StoredUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const strip = ({ password: _p, ...u }: StoredUser): User => u;

export const mockAuth = {
  async session(): Promise<User | null> {
    const id = localStorage.getItem(SESSION_KEY);
    const u = users().find((x) => x.id === id);
    return u ? strip(u) : null;
  },
  async login(identifier: string, password: string): Promise<User> {
    await delay();
    const clean = identifier.trim().toLowerCase();
    const u = users().find(
      (x) =>
        x.email.toLowerCase() === clean ||
        x.phone.replace(/[\s-]/g, "") === clean.replace(/[\s-]/g, ""),
    );
    if (!u || u.password !== password) fail(401, "auth.errors.invalid");
    localStorage.setItem(SESSION_KEY, u!.id);
    return strip(u!);
  },
  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
  }): Promise<User> {
    await delay();
    const all = users();
    if (all.some((x) => x.email.toLowerCase() === input.email.toLowerCase()))
      fail(422, "auth.errors.emailTaken", { email: ["auth.errors.emailTaken"] });
    const u: StoredUser = { id: `u-${Date.now()}`, ...input, verified: false };
    save([...all, u]);
    localStorage.setItem(SESSION_KEY, u.id);
    return strip(u);
  },
  async verifyEmail(code: string): Promise<User> {
    await delay();
    if (code !== MOCK_CODE) fail(422, "auth.errors.code");
    const all = users();
    const id = localStorage.getItem(SESSION_KEY);
    const idx = all.findIndex((x) => x.id === id);
    if (idx < 0) fail(401, "auth.errors.invalid");
    all[idx] = { ...all[idx]!, verified: true };
    save(all);
    return strip(all[idx]!);
  },
  async resendCode(): Promise<void> {
    await delay();
  },
  async forgotPassword(email: string): Promise<void> {
    await delay();
    // Always succeed so account existence is not revealed.
    if (users().some((x) => x.email.toLowerCase() === email.toLowerCase()))
      localStorage.setItem(RESET_KEY, email.toLowerCase());
  },
  async resetPassword(code: string, password: string): Promise<void> {
    await delay();
    const email = localStorage.getItem(RESET_KEY);
    if (code !== MOCK_CODE || !email) fail(422, "auth.errors.code");
    const all = users();
    const idx = all.findIndex((x) => x.email.toLowerCase() === email);
    if (idx < 0) fail(422, "auth.errors.code");
    all[idx] = { ...all[idx]!, password };
    save(all);
    localStorage.removeItem(RESET_KEY);
  },
  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },
};
