import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockAuth, MOCK_CODE } from "@/lib/api/mock/auth";
import { AuthCard, Field, FormAlert } from "@/components/auth/AuthCard";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { AuthProvider } from "@/lib/auth";
import "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({
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
