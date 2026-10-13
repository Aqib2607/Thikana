import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@/lib/i18n";
import type { User } from "@/lib/api/client";
import { mockNotificationApi, SEED_NOTIFICATIONS } from "@/lib/api/mock/notifications";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";

const mockTenantUser: User = {
  id: "u-tenant",
  name: "রাফি আহমেদ",
  email: "tenant@demo.test",
  phone: "01711111111",
  role: "tenant",
  verified: true,
};

// Mock TanStack Router
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
  createFileRoute: () => () => ({ component: vi.fn() }),
}));

// Mock useAuth
vi.mock("@/lib/auth", () => ({
  ROLE_HOME: {
    tenant: "/tenant/dashboard",
    landlord: "/landlord/dashboard",
    admin: "/admin/dashboard",
  },
  useAuth: () => ({
    user: mockTenantUser,
    ready: true,
    logout: vi.fn(),
  }),
}));

describe("Phase 7: Integration, Quality & Notifications Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("thikana_notifications_v1", JSON.stringify(SEED_NOTIFICATIONS));
  });

  describe("Notification API & Persistence", () => {
    it("fetches user notifications and sorts chronologically", async () => {
      const items = await mockNotificationApi.getNotifications(mockTenantUser.id);
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.every((n) => n.userId === mockTenantUser.id)).toBe(true);

      // Verify date descending
      for (let i = 0; i < items.length - 1; i++) {
        expect(new Date(items[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(items[i + 1].createdAt).getTime(),
        );
      }
    });

    it("correctly counts unread notifications", async () => {
      const count = await mockNotificationApi.getUnreadCount(mockTenantUser.id);
      expect(count).toBe(2);
    });

    it("marks a specific notification as read", async () => {
      await mockNotificationApi.markAsRead("notif-01");
      const items = await mockNotificationApi.getNotifications(mockTenantUser.id);
      const target = items.find((n) => n.id === "notif-01");
      expect(target?.read).toBe(true);

      const unreadCount = await mockNotificationApi.getUnreadCount(mockTenantUser.id);
      expect(unreadCount).toBe(1);
    });

    it("marks all notifications as read for a user", async () => {
      await mockNotificationApi.markAllAsRead(mockTenantUser.id);
      const count = await mockNotificationApi.getUnreadCount(mockTenantUser.id);
      expect(count).toBe(0);
    });
  });

  describe("NotificationBell Component", () => {
    it("renders bell trigger button and unread count badge", async () => {
      render(<NotificationBell />);
      const badge = await screen.findByTestId("unread-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("2");
    });

    it("toggles popover dialog open and closed on click", async () => {
      render(<NotificationBell />);
      const button = screen.getByRole("button", { name: /বিজ্ঞপ্তি|Notifications/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByText(/পরিদর্শন অনুরোধ নিশ্চিত করা হয়েছে|Visit Request Confirmed/i),
      ).toBeInTheDocument();
    });

    it("allows marking all notifications as read from popover", async () => {
      render(<NotificationBell />);
      const button = screen.getByRole("button", { name: /বিজ্ঞপ্তি|Notifications/i });
      fireEvent.click(button);

      const markAllBtn = await screen.findByRole("button", { name: /সব পঠিত করুন|Mark all read/i });
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument();
      });
    });
  });

  describe("Reusable EmptyState & ErrorState Components", () => {
    it("renders EmptyState with accessible role and custom action", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No properties found"
          description="Try broadening your filter criteria."
          actionLabel="Clear Filters"
          onAction={handleAction}
        />,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("No properties found")).toBeInTheDocument();
      expect(screen.getByText("Try broadening your filter criteria.")).toBeInTheDocument();

      const actionBtn = screen.getByRole("button", { name: "Clear Filters" });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("renders ErrorState with alert role and retry callback", () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Connection Error"
          message="Could not reach the server."
          onRetry={handleRetry}
        />,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Connection Error")).toBeInTheDocument();
      expect(screen.getByText("Could not reach the server.")).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /পুনরায় চেষ্টা করুন|Try Again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("TenantReviewsPage Component", () => {
    it("renders TenantReviewsPage with submitted review and visited badge", async () => {
      const { TenantReviewsPage } = await import("@/routes/tenant/reviews");
      render(<TenantReviewsPage />);

      // Should display heading level 1
      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading.textContent).toMatch(/My Reviews|প্রদত্ত রিভিউ/i);

      // Should display visited verification badge
      expect(await screen.findByText(/Visited \/ পরিদর্শিত/i)).toBeInTheDocument();
    });
  });
});
