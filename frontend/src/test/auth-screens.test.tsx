import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getSafeRedirectUrl } from "@/routes/login";
import { mockAuth, MOCK_CODE } from "@/lib/api/mock/auth";
import { authApi, realAuth } from "@/lib/api/auth";
import { http, setAuthToken } from "@/lib/api/http";
import { realPropertyApi } from "@/lib/api/properties";
import { AuthCard, Field, FormAlert } from "@/components/auth/AuthCard";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { SiteHeader } from "@/components/layout/AppShell";
import { AuthProvider, useAuth, type User } from "@/lib/auth";
import "@/lib/i18n";
import { ProfilePage } from "@/routes/profile";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({
    children,
    to,
    className,
    ...rest
  }: {
    children?: React.ReactNode;
    to?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "#"} className={className} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
}));

describe("Phase 2 Authentication: Mock Adapter & Logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("authenticates seeded tenant using email identifier", async () => {
    const user = await mockAuth.login("tenant@demo.test", "Password1");
    expect(user.role).toBe("tenant");
    expect(user.email).toBe("tenant@demo.test");
  });

  it("authenticates seeded tenant using phone identifier", async () => {
    const user = await mockAuth.login("01711111111", "Password1");
    expect(user.role).toBe("tenant");
  });

  it("authenticates seeded landlord using email identifier", async () => {
    const user = await mockAuth.login("landlord@demo.test", "Password1");
    expect(user.role).toBe("landlord");
  });

  it("authenticates seeded admin using email identifier", async () => {
    const user = await mockAuth.login("admin@demo.test", "Password1");
    expect(user.role).toBe("admin");
  });

  it("rejects invalid password with 401 error", async () => {
    await expect(mockAuth.login("tenant@demo.test", "WrongPass")).rejects.toMatchObject({
      status: 401,
      message: "auth.errors.invalid",
    });
  });

  it("registers new tenant and preserves role and unverified state", async () => {
    const newEmail = `user-${Date.now()}@test.test`;
    const user = await mockAuth.register({
      name: "New Tenant",
      email: newEmail,
      phone: "01799999999",
      password: "Password1",
      role: "tenant",
    });

    expect(user.email).toBe(newEmail);
    expect(user.role).toBe("tenant");
    expect(user.verified).toBe(false);

    // Verify email
    const verified = await mockAuth.verifyEmail(MOCK_CODE);
    expect(verified.verified).toBe(true);
  });

  it("rejects duplicate email during registration", async () => {
    await expect(
      mockAuth.register({
        name: "Duplicate",
        email: "tenant@demo.test",
        phone: "01788888888",
        password: "Password1",
        role: "tenant",
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: "auth.errors.emailTaken",
    });
  });

  it("rejects incorrect email verification code", async () => {
    localStorage.setItem("thikana.mock.session", "u-tenant");
    await expect(mockAuth.verifyEmail("999999")).rejects.toMatchObject({
      status: 422,
      message: "auth.errors.code",
    });
  });

  it("successfully resets password with valid code", async () => {
    await mockAuth.forgotPassword("tenant@demo.test");
    await mockAuth.resetPassword(MOCK_CODE, "NewPassword123");

    // Login with new password
    const user = await mockAuth.login("tenant@demo.test", "NewPassword123");
    expect(user.id).toBe("u-tenant");
  });

  it("logs out and clears active session", async () => {
    await mockAuth.login("tenant@demo.test", "Password1");
    expect(await mockAuth.session()).not.toBeNull();

    await mockAuth.logout();
    expect(await mockAuth.session()).toBeNull();
  });
});

describe("Phase 2 Accessible Components", () => {
  it("renders AuthCard with title and accessible container", () => {
    render(
      <AuthProvider>
        <AuthCard title="Test Login" subtitle="Sub test">
          <div>Child form</div>
        </AuthCard>
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: /Test Login/i })).toBeInTheDocument();
    expect(screen.getByText("Child form")).toBeInTheDocument();
  });

  it("renders Field with accessible aria-invalid and error alert", () => {
    render(<Field label="Email" error="Field error message" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Field error message");
  });

  it("renders FormAlert with alert role", () => {
    render(<FormAlert>Server validation error</FormAlert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Server validation error");
  });

  it("RoleLayout guards unauthenticated users", async () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <RoleLayout requiredRole="tenant" title="Protected Tenant">
          <div>Protected Content</div>
        </RoleLayout>
      </AuthProvider>,
    );

    // Initial state or unauthenticated state
    const content = screen.queryByText("Protected Content");
    expect(content).not.toBeInTheDocument();
  });
});

describe("Phase 5 Remediation Cycle 5C-R1 Contracts", () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthToken(null);
    vi.restoreAllMocks();
  });

  it("realAuth.session normalizes live Laravel nested envelope { data: { user } }", async () => {
    setAuthToken("test-token-123");
    const mockUser = {
      id: "42",
      name: "লাইভ ইউজার",
      email: "live@thikana.test",
      phone: "01700000000",
      role: "landlord" as const,
      verified: true,
    };

    vi.spyOn(http, "get").mockResolvedValueOnce({
      status: 200,
      data: {
        user: mockUser,
      },
    });

    const session = await realAuth.session();
    expect(session).not.toBeNull();
    expect(session?.id).toBe("42");
    expect(session?.role).toBe("landlord");
    expect(session?.name).toBe("লাইভ ইউজার");
  });

  it("realAuth.session normalizes mock/flat envelope { data: User }", async () => {
    setAuthToken("test-token-123");
    const mockUser = {
      id: "99",
      name: "মক ইউজার",
      email: "mock@thikana.test",
      phone: "01800000000",
      role: "tenant" as const,
      verified: true,
    };

    vi.spyOn(http, "get").mockResolvedValueOnce({
      status: 200,
      data: mockUser,
    });

    const session = await realAuth.session();
    expect(session).not.toBeNull();
    expect(session?.id).toBe("99");
    expect(session?.role).toBe("tenant");
  });

  it("realAuth.session returns null when token is missing or data is malformed", async () => {
    // Missing token
    setAuthToken(null);
    expect(await realAuth.session()).toBeNull();

    // Malformed data
    setAuthToken("test-token");
    vi.spyOn(http, "get").mockResolvedValueOnce({ status: 200, data: null });
    expect(await realAuth.session()).toBeNull();

    // Network error
    vi.spyOn(http, "get").mockRejectedValueOnce(new Error("Network failed"));
    expect(await realAuth.session()).toBeNull();
  });

  it("realAuth.resetPassword sends exact backend fields { email, code, password }", async () => {
    const postSpy = vi.spyOn(http, "post").mockResolvedValueOnce({
      status: 200,
      message: "auth.feedback.passwordReset",
    });

    await realAuth.resetPassword("tenant@demo.test", "123456", "NewPassword123");

    expect(postSpy).toHaveBeenCalledWith("/auth/reset-password", {
      email: "tenant@demo.test",
      code: "123456",
      password: "NewPassword123",
    });
  });

  it("authApi in mock mode accepts (email, code, password) and successfully resets password", async () => {
    await authApi.forgotPassword("tenant@demo.test");
    await authApi.resetPassword("tenant@demo.test", MOCK_CODE, "NewPassword123");

    const user = await authApi.login("tenant@demo.test", "NewPassword123");
    expect(user.id).toBe("u-tenant");
  });

  it("realPropertyApi.getAmenities normalizes structured Amenity[] objects into string[]", async () => {
    vi.spyOn(http, "get").mockResolvedValueOnce({
      data: [
        { name: "WiFi", bangla_name: "ওয়াইফাই", icon: "wifi" },
        { name: "Generator", bangla_name: "জেনারেটর", icon: "zap" },
        { name: "Lift / Elevator", bangla_name: "লিফট", icon: "arrow-up" },
      ],
    });

    const amenities = await realPropertyApi.getAmenities();
    expect(amenities).toEqual(["WiFi", "Generator", "Lift / Elevator"]);
  });

  it("realPropertyApi.getAmenities defensively handles strings and empty data", async () => {
    vi.spyOn(http, "get").mockResolvedValueOnce({
      data: ["WiFi", "Gas"],
    });
    expect(await realPropertyApi.getAmenities()).toEqual(["WiFi", "Gas"]);

    vi.spyOn(http, "get").mockResolvedValueOnce({
      data: null,
    });
    expect(await realPropertyApi.getAmenities()).toEqual([]);
  });
});

describe("Phase 3 Cycle 1: Login Redirect Security & Cache Purging", () => {
  it("getSafeRedirectUrl accepts valid internal paths", () => {
    expect(getSafeRedirectUrl("/properties")).toBe("/properties");
    expect(getSafeRedirectUrl("/properties/flat-123")).toBe("/properties/flat-123");
    expect(getSafeRedirectUrl("/properties?area=Sonadanga&minRent=5000")).toBe(
      "/properties?area=Sonadanga&minRent=5000",
    );
  });

  it("getSafeRedirectUrl strictly rejects open-redirect vectors and protocol attacks", () => {
    expect(getSafeRedirectUrl("https://evil.com")).toBeNull();
    expect(getSafeRedirectUrl("http://evil.com/path")).toBeNull();
    expect(getSafeRedirectUrl("//evil.com")).toBeNull();
    expect(getSafeRedirectUrl("/\\evil.com")).toBeNull();
    expect(getSafeRedirectUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeRedirectUrl("data:text/html,evil")).toBeNull();
    expect(getSafeRedirectUrl("")).toBeNull();
    expect(getSafeRedirectUrl(undefined)).toBeNull();
  });

  it("getSafeRedirectUrl avoids redirect loops to auth routes", () => {
    expect(getSafeRedirectUrl("/login")).toBeNull();
    expect(getSafeRedirectUrl("/register")).toBeNull();
  });

  it("AuthProvider logout purges in-memory QueryClient cache", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["testQuery"], { sensitive: "data" });
    expect(queryClient.getQueryData(["testQuery"])).toEqual({ sensitive: "data" });

    function TestLogoutComponent() {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => logout()}>
          Log Out
        </button>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    const btn = screen.getByRole("button", { name: /Log Out/i });
    await act(async () => {
      btn.click();
    });

    expect(queryClient.getQueryData(["testQuery"])).toBeUndefined();
  });

  it("same-account login/setUser does not unnecessarily clear query cache", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["tenantData"], { profile: "tenant-1" });

    const tenantUser: User = {
      id: "u-tenant",
      name: "Tenant Demo",
      email: "tenant@demo.test",
      phone: "01700000001",
      role: "tenant",
      verified: true,
    };

    function TestUserComponent() {
      const { setUser } = useAuth();
      return (
        <button type="button" onClick={() => setUser(tenantUser)}>
          Set Same User
        </button>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestUserComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    const btn = screen.getByRole("button", { name: /Set Same User/i });
    await act(async () => {
      btn.click();
    });

    // Query data must remain intact because the identity did not change
    expect(queryClient.getQueryData(["tenantData"])).toEqual({ profile: "tenant-1" });
  });

  it("different-account transition clears the previous account query cache", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["privateTenantData"], { secret: "tenant-doc" });

    const tenantUser: User = {
      id: "u-tenant",
      name: "Tenant Demo",
      email: "tenant@demo.test",
      phone: "01700000001",
      role: "tenant",
      verified: true,
    };

    const landlordUser: User = {
      id: "u-landlord",
      name: "Landlord Demo",
      email: "landlord@demo.test",
      phone: "01700000002",
      role: "landlord",
      verified: true,
    };

    function TestAccountSwitchComponent() {
      const { ready, setUser } = useAuth();
      if (!ready) return <div>Loading...</div>;
      return (
        <div>
          <button type="button" onClick={() => setUser(tenantUser)}>
            Log in Tenant
          </button>
          <button type="button" onClick={() => setUser(landlordUser)}>
            Switch to Landlord
          </button>
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestAccountSwitchComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Wait for hydration
    const tenantBtn = await screen.findByRole("button", { name: /Log in Tenant/i });

    // Initial login as Tenant
    await act(async () => {
      tenantBtn.click();
    });
    // Cache was seeded before tenant switch, but let's re-seed for tenant session
    queryClient.setQueryData(["privateTenantData"], { secret: "tenant-doc" });
    expect(queryClient.getQueryData(["privateTenantData"])).toEqual({ secret: "tenant-doc" });

    // Transition directly to Landlord
    await act(async () => {
      screen.getByRole("button", { name: /Switch to Landlord/i }).click();
    });

    // Query cache must be wiped clean upon account transition
    expect(queryClient.getQueryData(["privateTenantData"])).toBeUndefined();
  });

  it("initial authentication hydration preserves existing cache without unnecessary clearing", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["publicProperties"], [{ id: "prop-1", title: "Flat" }]);

    function TestHydrationComponent() {
      const { ready } = useAuth();
      if (!ready) return <div>Hydrating...</div>;
      return <div>Ready!</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestHydrationComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await screen.findByText("Ready!");

    // Cache must remain untouched across hydration
    expect(queryClient.getQueryData(["publicProperties"])).toEqual([{ id: "prop-1", title: "Flat" }]);
  });

  it("failed authentication does not alter user session or purge cache", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["activeSessionData"], { valid: true });

    const tenantUser: User = {
      id: "u-tenant",
      name: "Tenant Demo",
      email: "tenant@demo.test",
      phone: "01700000001",
      role: "tenant",
      verified: true,
    };

    function TestActiveSessionComponent() {
      const { ready, user, setUser } = useAuth();
      if (!ready) return <div>Hydrating...</div>;
      return (
        <div>
          <span data-testid="user-display">{user ? user.email : "guest"}</span>
          <button type="button" onClick={() => setUser(tenantUser)}>Set Tenant</button>
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestActiveSessionComponent />
        </AuthProvider>
      </QueryClientProvider>,
    );

    const setTenantBtn = await screen.findByRole("button", { name: /Set Tenant/i });
    await act(async () => {
      setTenantBtn.click();
    });
    expect(screen.getByTestId("user-display").textContent).toBe("tenant@demo.test");

    // Failed login attempt throws without reaching setUser
    await expect(authApi.login("tenant@demo.test", "InvalidPass!")).rejects.toBeDefined();

    // Cache and user session remain untouched
    expect(queryClient.getQueryData(["activeSessionData"])).toEqual({ valid: true });
    expect(screen.getByTestId("user-display").textContent).toBe("tenant@demo.test");
  });

  it("renders generic person icon and omits all personal identifiers in authenticated header", async () => {
    const queryClient = new QueryClient();
    const authenticatedUser: User = {
      id: "u-tenant-01",
      name: "Tariqul Islam",
      email: "tariqul@example.com",
      phone: "01712345678",
      role: "tenant",
      verified: true,
    };

    function HeaderWrapper() {
      const { ready, setUser } = useAuth();
      if (!ready) return <div>Loading...</div>;
      return (
        <div>
          <button type="button" onClick={() => setUser(authenticatedUser)}>Log In</button>
          <SiteHeader />
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HeaderWrapper />
        </AuthProvider>
      </QueryClientProvider>,
    );

    const loginBtn = await screen.findByRole("button", { name: "Log In" });
    await act(async () => {
      loginBtn.click();
    });

    // 1. Account / Dashboard navigation is present
    const dashboardLink = screen.getByRole("link", { name: /account|অ্যাকাউন্ট|dashboard|ড্যাশবোর্ড/i });
    expect(dashboardLink).toBeInTheDocument();

    // 2. Profile link is present, links to /profile, and has accessible title/label
    const profileLink = screen.getByRole("link", { name: /profile|প্রোফাইল/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.getAttribute("href")).toBe("/profile");

    // 3. No user personal identifiers (name, username, email, phone) exist in the header
    expect(screen.queryByText("Tariqul Islam")).toBeNull();
    expect(screen.queryByText("tariqul@example.com")).toBeNull();
    expect(screen.queryByText("01712345678")).toBeNull();

    // 4. Notification control remains present and functional
    const bellBtn = screen.getByRole("button", { name: /notification|বিজ্ঞপ্তি/i });
    expect(bellBtn).toBeInTheDocument();

    // 5. Logout control is present
    const logoutBtn = screen.getByRole("button", { name: /logout|লগআউট/i });
    expect(logoutBtn).toBeInTheDocument();

    // 6. Verify DOM child order inside the action island:
    // [Dashboard Link, Language Selector, Notification Bell, Person Icon (Profile Link), Logout Button]
    const actionIsland = logoutBtn.parentElement;
    expect(actionIsland).not.toBeNull();
    const children = Array.from(actionIsland!.children);
    const dashboardIndex = children.findIndex((el) => el.contains(dashboardLink));
    const bellIndex = children.findIndex((el) => el.contains(bellBtn));
    const profileIndex = children.findIndex((el) => el.contains(profileLink));
    const logoutIndex = children.findIndex((el) => el.contains(logoutBtn));

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(bellIndex).toBeGreaterThan(dashboardIndex);
    expect(profileIndex).toBeGreaterThan(bellIndex);
    expect(logoutIndex).toBeGreaterThan(profileIndex);
  });

  describe("Universal Profile Page", () => {
    it("renders tenant profile with role-specific shortcuts and read-only email/role", async () => {
      const queryClient = new QueryClient();
      const tenantUser: User = {
        id: "u-tenant-test",
        name: "Rahim Tenant",
        email: "rahim@example.com",
        phone: "01711223344",
        role: "tenant",
        verified: true,
      };

      function ProfileWrapper() {
        const { ready, setUser } = useAuth();
        if (!ready) return <div>Loading...</div>;
        return (
          <div>
            <button type="button" onClick={() => setUser(tenantUser)}>Set User</button>
            <ProfilePage />
          </div>
        );
      }

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileWrapper />
          </AuthProvider>
        </QueryClientProvider>,
      );

      const setBtn = await screen.findByRole("button", { name: "Set User" });
      await act(async () => {
        setBtn.click();
      });

      // Role and user information rendered
      expect(screen.getByText("Rahim Tenant")).toBeInTheDocument();
      expect(screen.getByText("rahim@example.com")).toBeInTheDocument();

      // Tenant-specific shortcuts rendered
      expect(screen.getByRole("link", { name: /rental preferences|ভাড়ার পছন্দসমূহ/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /saved homes|সংরক্ষিত বাড়ি/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /scheduled visits|নির্ধারিত পরিদর্শন/i })).toBeInTheDocument();

      // Email and role inputs are read-only
      const emailInput = screen.getByLabelText(/email address|ইমেইল ঠিকানা/i);
      expect(emailInput).toHaveAttribute("readonly");
      expect(emailInput).toBeDisabled();

      const roleInput = screen.getByLabelText(/account role|অ্যাকাউন্টের ভূমিকা/i);
      expect(roleInput).toHaveAttribute("readonly");
      expect(roleInput).toBeDisabled();
    });

    it("renders landlord profile with landlord-specific shortcuts", async () => {
      const queryClient = new QueryClient();
      const landlordUser: User = {
        id: "u-landlord-test",
        name: "Karim Landlord",
        email: "karim@example.com",
        phone: "01811223344",
        role: "landlord",
        verified: true,
      };

      function ProfileWrapper() {
        const { ready, setUser } = useAuth();
        if (!ready) return <div>Loading...</div>;
        return (
          <div>
            <button type="button" onClick={() => setUser(landlordUser)}>Set User</button>
            <ProfilePage />
          </div>
        );
      }

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileWrapper />
          </AuthProvider>
        </QueryClientProvider>,
      );

      const setBtn = await screen.findByRole("button", { name: "Set User" });
      await act(async () => {
        setBtn.click();
      });

      // Landlord shortcuts rendered
      expect(screen.getByRole("link", { name: /my listed properties|আমার তালিকাভুক্ত সম্পত্তি/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /contact requests|যোগাযোগের অনুরোধ/i })).toBeInTheDocument();
    });

    it("renders admin profile with administration shortcuts", async () => {
      const queryClient = new QueryClient();
      const adminUser: User = {
        id: "u-admin-test",
        name: "Super Admin",
        email: "admin@example.com",
        phone: "01911223344",
        role: "admin",
        verified: true,
      };

      function ProfileWrapper() {
        const { ready, setUser } = useAuth();
        if (!ready) return <div>Loading...</div>;
        return (
          <div>
            <button type="button" onClick={() => setUser(adminUser)}>Set User</button>
            <ProfilePage />
          </div>
        );
      }

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileWrapper />
          </AuthProvider>
        </QueryClientProvider>,
      );

      const setBtn = await screen.findByRole("button", { name: "Set User" });
      await act(async () => {
        setBtn.click();
      });

      // Admin shortcuts rendered
      expect(screen.getByRole("link", { name: /admin dashboard|অ্যাডমিন ড্যাশবোর্ড/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /audit logs|সিস্টেম অডিট লগ/i })).toBeInTheDocument();
    });

    it("validates required name field and supports editing and resetting profile fields", async () => {
      const queryClient = new QueryClient();
      const testUser: User = {
        id: "u-edit-test",
        name: "Initial Name",
        email: "edit@example.com",
        phone: "01700000099",
        role: "tenant",
        verified: true,
      };

      function ProfileWrapper() {
        const { ready, setUser } = useAuth();
        if (!ready) return <div>Loading...</div>;
        return (
          <div>
            <button type="button" onClick={() => setUser(testUser)}>Set User</button>
            <ProfilePage />
          </div>
        );
      }

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileWrapper />
          </AuthProvider>
        </QueryClientProvider>,
      );

      const setBtn = await screen.findByRole("button", { name: "Set User" });
      await act(async () => {
        setBtn.click();
      });

      const nameInput = screen.getByLabelText(/full name|পুরো নাম/i);
      const phoneInput = screen.getByLabelText(/phone number|ফোন নম্বর/i);
      const saveBtn = screen.getByRole("button", { name: /save changes|পরিবর্তন সংরক্ষণ করুন/i });
      const cancelBtn = screen.getByRole("button", { name: /cancel|বাতিল/i });

      // Populated correctly
      expect((nameInput as HTMLInputElement).value).toBe("Initial Name");
      expect((phoneInput as HTMLInputElement).value).toBe("01700000099");

      // Clear name and attempt save -> validation error displayed
      fireEvent.change(nameInput, { target: { value: "" } });
      await act(async () => {
        saveBtn.click();
      });
      expect(screen.getByText(/full name is required|পুরো নাম প্রদান করা আবশ্যক/i)).toBeInTheDocument();

      // Cancel button resets to initial persisted values
      await act(async () => {
        cancelBtn.click();
      });
      expect((nameInput as HTMLInputElement).value).toBe("Initial Name");
      expect(screen.queryByText(/full name is required|পুরো নাম প্রদান করা আবশ্যক/i)).toBeNull();

      // Mock updateProfile API call
      const updateSpy = vi.spyOn(authApi, "updateProfile").mockResolvedValue({
        ...testUser,
        name: "Successfully Renamed",
        phone: "01799887766",
      });

      fireEvent.change(nameInput, { target: { value: "Successfully Renamed" } });
      fireEvent.change(phoneInput, { target: { value: "01799887766" } });

      await act(async () => {
        saveBtn.click();
      });

      expect(updateSpy).toHaveBeenCalledWith({
        name: "Successfully Renamed",
        phone: "01799887766",
      });

      // Feedback message appears
      expect(await screen.findByRole("status")).toBeInTheDocument();
      updateSpy.mockRestore();
    });
  });
});
