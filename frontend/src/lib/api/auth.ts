import { USE_MOCK, type Role } from "./client";
import { http, setAuthToken, getAuthToken } from "./http";
import { mockAuth, type User } from "./mock/auth";

export type { User };

export interface AuthApi {
  session(): Promise<User | null>;
  login(identifier: string, password: string): Promise<User>;
  register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
  }): Promise<User>;
  logout(): Promise<void>;
  updateProfile(input: { name: string; phone?: string }): Promise<User>;
  forgotPassword(email: string): Promise<{ message?: string } | void>;
  resetPassword(
    emailOrCode: string,
    codeOrPassword: string,
    maybePassword?: string,
  ): Promise<{ message?: string } | void>;
  /**
   * @deprecated Verification uses cryptographically signed email links via GET /api/v1/auth/verify-email/{id}/{hash}
   */
  verifyEmail?(code: string): Promise<User>;
  resendCode(): Promise<{ message?: string } | void>;
}

export const realAuth: AuthApi = {
  async session(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await http.get<{ data: { user: User } | User }>("/auth/me");
      if (!res || !res.data) return null;

      const user = "user" in res.data ? res.data.user : res.data;
      if (!user || typeof user !== "object" || !("id" in user) || !("role" in user)) {
        return null;
      }

      return user as User;
    } catch {
      setAuthToken(null);
      return null;
    }
  },

  async login(identifier: string, password: string): Promise<User> {
    const res = await http.post<{
      data: {
        user: User;
        token: string;
      };
    }>("/auth/login", { identifier, password });

    setAuthToken(res.data.token);
    return res.data.user;
  },

  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
  }): Promise<User> {
    const res = await http.post<{
      data: {
        user: User;
        token: string;
      };
    }>("/auth/register", input);

    setAuthToken(res.data.token);
    return res.data.user;
  },

  async logout(): Promise<void> {
    try {
      await http.post("/auth/logout");
    } finally {
      setAuthToken(null);
    }
  },

  async updateProfile(input: { name: string; phone?: string }): Promise<User> {
    const res = await http.put<{
      data: {
        user: User;
      };
    }>("/auth/me", input);

    return res.data.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return http.post<{ message: string }>("/auth/forgot-password", { email });
  },

  async resetPassword(
    emailOrCode: string,
    codeOrPassword: string,
    maybePassword?: string,
  ): Promise<{ message: string }> {
    let email = "";
    let code = "";
    let password = "";

    if (maybePassword !== undefined) {
      email = emailOrCode;
      code = codeOrPassword;
      password = maybePassword;
    } else {
      code = emailOrCode;
      password = codeOrPassword;
    }

    return http.post<{ message: string }>("/auth/reset-password", {
      email,
      code,
      password,
    });
  },

  /**
   * @deprecated Verification uses cryptographically signed email links via GET /api/v1/auth/verify-email/{id}/{hash}
   */
  async verifyEmail(): Promise<User> {
    const sessionUser = await this.session();
    if (!sessionUser) {
      throw new Error("Verification requires clicking the link sent to your email address.");
    }
    return sessionUser;
  },

  async resendCode(): Promise<{ message: string }> {
    return http.post<{ message: string }>("/auth/resend-code");
  },
};

const adaptedMockAuth: AuthApi = {
  ...mockAuth,
  async updateProfile(input: { name: string; phone?: string }): Promise<User> {
    const sessionUser = await mockAuth.session();
    if (!sessionUser) {
      throw { status: 401, message: "auth.errors.unauthenticated" };
    }
    const rawUsers = localStorage.getItem("thikana.mock.users");
    const all = rawUsers ? JSON.parse(rawUsers) : [];
    const idx = all.findIndex((x: { id: string }) => x.id === sessionUser.id);
    if (idx >= 0) {
      all[idx].name = input.name;
      if (input.phone !== undefined) {
        all[idx].phone = input.phone;
      }
      localStorage.setItem("thikana.mock.users", JSON.stringify(all));
    }
    return {
      ...sessionUser,
      name: input.name,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    };
  },
  async resetPassword(
    emailOrCode: string,
    codeOrPassword: string,
    maybePassword?: string,
  ): Promise<{ message?: string } | void> {
    if (maybePassword !== undefined) {
      localStorage.setItem("thikana.mock.reset", emailOrCode.toLowerCase());
      return mockAuth.resetPassword(codeOrPassword, maybePassword);
    }
    return mockAuth.resetPassword(emailOrCode, codeOrPassword);
  },
};

export const authApi: AuthApi = USE_MOCK ? adaptedMockAuth : realAuth;
