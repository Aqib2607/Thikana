import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { mockAdminApi } from "@/lib/api/mock/admin";
import { adminApi, realAdminApi } from "@/lib/api/admin";
import { http } from "@/lib/api/http";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPropertiesPage } from "@/components/admin/AdminPropertiesPage";
import { AdminPendingPropertiesPage } from "@/components/admin/AdminPendingPropertiesPage";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import { AdminVerificationsPage } from "@/components/admin/AdminVerificationsPage";
import { AdminReportsPage } from "@/components/admin/AdminReportsPage";
import { AdminReviewsPage } from "@/components/admin/AdminReviewsPage";
import { AdminCommunityPage } from "@/components/admin/AdminCommunityPage";
import { AdminAnalyticsPage } from "@/components/admin/AdminAnalyticsPage";
import { AdminAuditLogsPage } from "@/components/admin/AdminAuditLogsPage";

// Mock router
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

// Mock auth state
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      id: "u-admin",
      name: "System Admin",
      email: "admin@demo.test",
      role: "admin",
      verified: true,
    },
    ready: true,
  }),
  ROLE_HOME: {
    tenant: "/tenant/dashboard",
    landlord: "/landlord/dashboard",
    admin: "/admin/dashboard",
  },
}));

import "@/lib/i18n";

describe("Phase 6: Admin Features & Mock API", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates accurate dashboard stats across properties, users, reports, and audit logs", async () => {
    const stats = await mockAdminApi.getDashboardStats();
    expect(stats.totalProperties).toBeGreaterThan(0);
    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(stats.pendingProperties).toBeGreaterThanOrEqual(1);
    expect(stats.auditLogsCount).toBeGreaterThan(0);
  });

  it("approves pending property and generates immutable audit log", async () => {
    const properties = await mockAdminApi.getProperties();
    const pending = properties.find((p) => p.approvalStatus === "Pending Approval");
    expect(pending).toBeDefined();

    const approved = await mockAdminApi.approveProperty(pending!.id, "u-admin", "System Admin");
    expect(approved.approvalStatus).toBe("Approved");

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find((l) => l.targetId === pending!.id && l.action === "PROPERTY_APPROVED");
    expect(log).toBeDefined();
    expect(log?.actorName).toBe("System Admin");
  });

  it("rejects property with reason and records reason in audit log", async () => {
    const properties = await mockAdminApi.getProperties();
    const target = properties[0];

    const rejected = await mockAdminApi.rejectProperty(
      target.id,
      "Invalid room photo provided",
      "u-admin",
      "System Admin",
    );
    expect(rejected.approvalStatus).toBe("Rejected");

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find((l) => l.targetId === target.id && l.action === "PROPERTY_REJECTED");
    expect(log).toBeDefined();
    expect(log?.details).toContain("Invalid room photo provided");
  });

  it("toggles user status between active and suspended and audits action", async () => {
    const users = await mockAdminApi.getUsers();
    const tenantUser = users.find((u) => u.role === "tenant");
    expect(tenantUser).toBeDefined();

    const suspended = await mockAdminApi.toggleUserStatus(
      tenantUser!.id,
      "suspended",
      "u-admin",
      "System Admin",
    );
    expect(suspended.status).toBe("suspended");

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find((l) => l.targetId === tenantUser!.id && l.action === "USER_SUSPENDED");
    expect(log).toBeDefined();

    // Re-activate
    const activated = await mockAdminApi.toggleUserStatus(
      tenantUser!.id,
      "active",
      "u-admin",
      "System Admin",
    );
    expect(activated.status).toBe("active");
  });

  it("updates simulated property verifications and records changes in audit trail", async () => {
    const properties = await mockAdminApi.getProperties();
    const target = properties[0];

    const updated = await mockAdminApi.updatePropertyVerifications(
      target.id,
      ["Owner Identity Verified", "Phone Verified", "Availability Verified"],
      "u-admin",
      "System Admin",
    );
    expect(updated.verifications).toContain("Owner Identity Verified");
    expect(updated.verifications).toContain("Availability Verified");

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find((l) => l.targetId === target.id && l.action === "VERIFICATIONS_UPDATED");
    expect(log).toBeDefined();
  });

  it("resolves and dismisses listing reports with resolution notes", async () => {
    const reports = await mockAdminApi.getReports();
    const pendingReport = reports.find((r) => r.status === "Pending Review");
    expect(pendingReport).toBeDefined();

    const resolved = await mockAdminApi.resolveReport(
      pendingReport!.id,
      "Resolved",
      "Landlord was contacted and confirmed seat availability",
      "u-admin",
      "System Admin",
    );
    expect(resolved.status).toBe("Resolved");

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find(
      (l) => l.targetId === pendingReport!.id && l.action === "REPORT_RESOLVED",
    );
    expect(log).toBeDefined();
    expect(log?.details).toContain("confirmed seat availability");
  });

  it("moderates and deletes violating review", async () => {
    const reviews = await mockAdminApi.getReviews();
    expect(reviews.length).toBeGreaterThan(0);
    const target = reviews[0];

    await mockAdminApi.deleteReview(target.id, "u-admin", "System Admin");
    const after = await mockAdminApi.getReviews();
    expect(after.find((r) => r.id === target.id)).toBeUndefined();

    const logs = await mockAdminApi.getAuditLogs();
    const log = logs.find((l) => l.targetId === target.id && l.action === "REVIEW_DELETED");
    expect(log).toBeDefined();
  });

  it("updates Khulna area community information and provides analytics data", async () => {
    await mockAdminApi.updateCommunityData(
      "KUET Gate / Teligati",
      {
        transport: "Easy auto connectivity to Fulbarigate and Daulatpur.",
        waterlogging: "Zero waterlogging on main road.",
        internet: "AmberIT and Carnival broadband active.",
        noise: "Peaceful environment.",
        safety: "Well lit streets at night.",
        general: "KUET medical center and campus mosque nearby.",
      },
      "u-admin",
      "System Admin",
    );

    const community = await mockAdminApi.getCommunityData();
    expect(community["KUET Gate / Teligati"].transport).toContain("Fulbarigate");

    const analytics = await mockAdminApi.getAnalytics();
    expect(analytics.areaDemand.length).toBeGreaterThan(0);
    expect(analytics.studentPreferenceRatio.studentsOnly).toBeGreaterThanOrEqual(0);
    expect(analytics.totalVisitsCompleted).toBeGreaterThan(0);
  });

  describe("Admin UI Screens Rendering", () => {
    it("renders AdminDashboard with disclaimer banner and module cards", async () => {
      render(<AdminDashboard />);
      expect(
        await screen.findByText(/শুধুমাত্র প্ল্যাটফর্ম-স্তরের সিমুলেটেড যাচাইকরণ/i),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/অনুমোদন অপেক্ষমাণ লিস্টিং/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/সকল প্রপার্টি/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ব্যবহারকারী ব্যবস্থাপনা/i).length).toBeGreaterThan(0);
    });

    it("renders AdminPropertiesPage with filter tabs and search input", async () => {
      render(<AdminPropertiesPage />);
      expect(
        screen.getByPlaceholderText(/বাসার নাম, এলাকা বা বাড়িওয়ালা খুঁজুন/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /সকল লিস্টিং/i })).toBeInTheDocument();
    });

    it("renders AdminUsersPage with users and role tabs", async () => {
      render(<AdminUsersPage />);
      expect(screen.getByPlaceholderText(/নাম, ইমেইল বা ফোন নম্বর/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /সকল অ্যাকাউন্ট/i })).toBeInTheDocument();
    });

    it("renders AdminVerificationsPage with disclaimer banner and matrix table", async () => {
      render(<AdminVerificationsPage />);
      expect(
        await screen.findByText(/শুধুমাত্র প্ল্যাটফর্ম-স্তরের সিমুলেটেড যাচাইকরণ/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/লিস্টিংভিত্তিক যাচাইকরণ তালিকা/i)).toBeInTheDocument();
    });

    it("renders AdminReportsPage with reports queue", async () => {
      render(<AdminReportsPage />);
      expect(screen.getByRole("button", { name: /সকল অভিযোগ/i })).toBeInTheDocument();
    });

    it("renders AdminAuditLogsPage with immutable audit trail notice", async () => {
      render(<AdminAuditLogsPage />);
      expect(
        screen.getByText(/অপরিবর্তনীয় প্রশাসনিক রেকর্ড \(Immutable Audit Trail\)/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /সকল রেকর্ড/i })).toBeInTheDocument();
    });
  });

  describe("Cycle 5B: Live Admin API Contract Suite", () => {
    it("fetches dashboard stats via /admin/dashboard/stats", async () => {
      const getSpy = vi.spyOn(http, "get").mockResolvedValueOnce({
        data: {
          pendingProperties: 3,
          approvedProperties: 10,
          totalProperties: 13,
          totalUsers: 25,
          tenantUsers: 20,
          landlordUsers: 5,
          pendingReports: 0,
          totalReviews: 0,
          auditLogsCount: 42,
        },
      });

      const res = await realAdminApi.getDashboardStats();
      expect(getSpy).toHaveBeenCalledWith("/admin/dashboard/stats");
      expect(res.pendingProperties).toBe(3);
      expect(res.auditLogsCount).toBe(42);
    });

    it("approves property listing via POST /admin/properties/{id}/approve", async () => {
      const postSpy = vi.spyOn(http, "post").mockResolvedValueOnce({
        data: { id: "prop-201", title: "Khulna Flat", approvalStatus: "Approved" },
      });

      const res = await realAdminApi.approveProperty("prop-201");
      expect(postSpy).toHaveBeenCalledWith("/admin/properties/prop-201/approve");
      expect(res.approvalStatus).toBe("Approved");
    });

    it("rejects property listing via POST /admin/properties/{id}/reject with reason", async () => {
      const postSpy = vi.spyOn(http, "post").mockResolvedValueOnce({
        data: { id: "prop-202", title: "Khulna Flat", approvalStatus: "Rejected" },
      });

      const res = await realAdminApi.rejectProperty("prop-202", "Invalid ownership document");
      expect(postSpy).toHaveBeenCalledWith("/admin/properties/prop-202/reject", {
        reason: "Invalid ownership document",
      });
      expect(res.approvalStatus).toBe("Rejected");
    });

    it("updates verifications via PUT /admin/properties/{id}/verifications", async () => {
      const putSpy = vi.spyOn(http, "put").mockResolvedValueOnce({
        data: {
          id: "prop-203",
          verifications: ["Owner Identity Verified", "Phone Verified"],
        },
      });

      const res = await realAdminApi.updatePropertyVerifications("prop-203", [
        "Owner Identity Verified",
        "Phone Verified",
      ]);
      expect(putSpy).toHaveBeenCalledWith("/admin/properties/prop-203/verifications", {
        verifications: ["Owner Identity Verified", "Phone Verified"],
      });
      expect(res.verifications).toContain("Owner Identity Verified");
    });

    it("fetches audit logs via GET /admin/audit-logs", async () => {
      const getSpy = vi.spyOn(http, "get").mockResolvedValueOnce({
        data: [
          {
            id: "log-1",
            actorId: "1",
            actorName: "System Admin",
            action: "PROPERTY_APPROVED",
            targetType: "property",
            targetId: "prop-201",
            details: "Listing approved.",
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const res = await realAdminApi.getAuditLogs();
      expect(getSpy).toHaveBeenCalledWith("/admin/audit-logs?per_page=100");
      expect(res).toHaveLength(1);
      expect(res[0].action).toBe("PROPERTY_APPROVED");
    });

    it("adminApi delegates seamlessly under default configuration", async () => {
      const stats = await adminApi.getDashboardStats();
      expect(stats.totalProperties).toBeGreaterThan(0);
      const logs = await adminApi.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
