import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { authApi, type User } from "@/lib/api/auth";
import type { Role } from "@/lib/api/client";

export type { User };

interface AuthValue {
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export const ROLE_HOME: Record<Role, string> = {
  tenant: "/tenant/dashboard",
  landlord: "/landlord/dashboard",
  admin: "/admin/dashboard",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef<User | null>(null);
  const queryClient = useContext(QueryClientContext);

  // Session is read after hydration (localStorage is browser-only).
  useEffect(() => {
    authApi.session().then((u) => {
      userRef.current = u;
      setUser(u);
      setReady(true);
    });
  }, []);

  const handleSetUser = useCallback(
    (nextUser: User | null) => {
      const prevUser = userRef.current;
      // If transitioning from one authenticated user to a different user identity or clearing user, clear query cache
      if (prevUser && (!nextUser || prevUser.id !== nextUser.id)) {
        queryClient?.clear();
      }
      userRef.current = nextUser;
      setUser(nextUser);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient?.clear();
      userRef.current = null;
      setUser(null);
    }
  }, [queryClient]);
  const value = useMemo(
    () => ({ user, ready, setUser: handleSetUser, logout }),
    [user, ready, handleSetUser, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
