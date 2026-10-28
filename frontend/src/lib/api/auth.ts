import { USE_MOCK, type Role } from "./client";
import { http, setAuthToken, getAuthToken } from "./http";
import { mockAuth, type User, MOCK_CODE } from "./mock/auth";

export type { User };
export { MOCK_CODE };

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
  forgotPassword(email: string): Promise<{ message?: string } | void>;
  resetPassword(
    emailOrCode: string,
    codeOrPassword: string,
    maybePassword?: string,
  ): Promise<{ message?: string } | void>;
  verifyEmail(code: string): Promise<User>;
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

  async verifyEmail(code: string): Promise<User> {
    const res = await http.post<{
      message: string;
      data?: { user: User };
      user?: User;
    }>("/auth/verify-email", {
      code,
    });
    if (res.data?.user) {
      return res.data.user;
    }
    if (res.user) {
      return res.user;
    }
    // Re-sync session if user object wasn't in top level
    const sessionUser = await this.session();
    if (!sessionUser) {
      throw new Error("Failed to reload session after email verification.");
    }
    return sessionUser;
  },

  async resendCode(): Promise<{ message: string }> {
    return http.post<{ message: string }>("/auth/resend-code");
  },
};

const adaptedMockAuth: AuthApi = {
  ...mockAuth,
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
