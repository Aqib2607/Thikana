import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAuth, type User } from "@/lib/api/mock/auth";
import type { Role } from "@/lib/api/client";

export type { User };

interface AuthValue {
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export const ROLE_HOME: Record<Role, "/tenant" | "/landlord" | "/admin"> = {
  tenant: "/tenant",
  landlord: "/landlord",
  admin: "/admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Session is read after hydration (localStorage is browser-only).
  useEffect(() => {
    mockAuth.session().then((u) => { setUser(u); setReady(true); });
  }, []);

  const logout = useCallback(async () => { await mockAuth.logout(); setUser(null); }, []);
  const value = useMemo(() => ({ user, ready, setUser, logout }), [user, ready, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
