import { http } from "./http";
import { USE_MOCK } from "./client";
import { mockAdminApi } from "./mock/admin";
import type { PropertyItem, ApprovalStatus, VerificationState, CommunityInfo } from "./properties";
import type { ListingReportItem, PropertyReviewItem } from "./tenant";

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: "property" | "user" | "report" | "review" | "community";
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "tenant" | "landlord" | "admin";
  verified: boolean;
  status: "active" | "suspended";
  createdAt: string;
}

export interface AdminStats {
  pendingProperties: number;
  approvedProperties: number;
  totalProperties: number;
  totalUsers: number;
  tenantUsers: number;
  landlordUsers: number;
  pendingReports: number;
  totalReviews: number;
  auditLogsCount: number;
}

export interface AreaDemandStat {
  area: string;
  listingCount: number;
  avgRent: number;
  inquiryCount: number;
}

export interface AdminApi {
  getDashboardStats(): Promise<AdminStats>;
  getProperties(statusFilter?: ApprovalStatus | "ALL"): Promise<PropertyItem[]>;
  approveProperty(propertyId: string, adminId?: string, adminName?: string): Promise<PropertyItem>;
  rejectProperty(
    propertyId: string,
    reason: string,
    adminId?: string,
    adminName?: string,
  ): Promise<PropertyItem>;

  getUsers(): Promise<AdminUserItem[]>;
  toggleUserStatus(
    userId: string,
    newStatus: "active" | "suspended",
    adminId?: string,
    adminName?: string,
  ): Promise<AdminUserItem>;

  updatePropertyVerifications(
    propertyId: string,
    verifications: VerificationState[],
    adminId?: string,
    adminName?: string,
  ): Promise<PropertyItem>;

  getReports(): Promise<ListingReportItem[]>;
  resolveReport(
    reportId: string,
    status: "Resolved" | "Dismissed",
    resolutionNote: string,
    adminId?: string,
    adminName?: string,
  ): Promise<ListingReportItem>;

  getReviews(): Promise<PropertyReviewItem[]>;
  deleteReview(reviewId: string, adminId?: string, adminName?: string): Promise<void>;

  getCommunityData(): Promise<Record<string, CommunityInfo>>;
  updateCommunityData(
    area: string,
    info: CommunityInfo,
    adminId?: string,
    adminName?: string,
  ): Promise<void>;

  getAnalytics(): Promise<{
    areaDemand: AreaDemandStat[];
    propertyTypeDistribution: Record<string, number>;
    studentPreferenceRatio: { studentsOnly: number; any: number; familyOnly: number };
    totalVisitsCompleted: number;
  }>;

  getAuditLogs(): Promise<AuditLogItem[]>;
}

export const realAdminApi: AdminApi = {
  async getDashboardStats(): Promise<AdminStats> {
    const res = await http.get<{ data: AdminStats }>("/admin/dashboard/stats");
    return res.data;
  },

  async getProperties(statusFilter?: ApprovalStatus | "ALL"): Promise<PropertyItem[]> {
    const query =
      statusFilter && statusFilter !== "ALL"
        ? `?statusFilter=${encodeURIComponent(statusFilter)}&per_page=100`
        : "?per_page=100";
    const res = await http.get<{ data: PropertyItem[] }>(`/admin/properties${query}`);
    return res.data;
  },

  async approveProperty(
    propertyId: string,
    _adminId?: string,
    _adminName?: string,
  ): Promise<PropertyItem> {
    const res = await http.post<{ data: PropertyItem }>(
      `/admin/properties/${encodeURIComponent(propertyId)}/approve`,
    );
    return res.data;
  },

  async rejectProperty(
    propertyId: string,
    reason: string,
    _adminId?: string,
    _adminName?: string,
  ): Promise<PropertyItem> {
    const res = await http.post<{ data: PropertyItem }>(
      `/admin/properties/${encodeURIComponent(propertyId)}/reject`,
      { reason },
    );
    return res.data;
  },

  async updatePropertyVerifications(
    propertyId: string,
    verifications: VerificationState[],
    _adminId?: string,
    _adminName?: string,
  ): Promise<PropertyItem> {
    const res = await http.put<{ data: PropertyItem }>(
      `/admin/properties/${encodeURIComponent(propertyId)}/verifications`,
      { verifications },
    );
    return res.data;
  },

  async getCommunityData(): Promise<Record<string, CommunityInfo>> {
    const res = await http.get<{ data: Record<string, CommunityInfo> }>("/admin/community");
    return res.data;
  },

  async updateCommunityData(
    area: string,
    info: CommunityInfo,
    _adminId?: string,
    _adminName?: string,
  ): Promise<void> {
    await http.put<{ message: string; data: unknown }>(
      `/admin/community/${encodeURIComponent(area)}`,
      {
        transport: info.transport || "",
        waterlogging: info.waterlogging || "",
        internet: info.internet || "",
        noise: info.noise || "",
        safety: info.safety || "",
        general: info.general || "",
      },
    );
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await http.get<{ data: AuditLogItem[] }>("/admin/audit-logs?per_page=100");
    return res.data;
  },

  // Queues & analytics deferred to Phase 6 / later cycles — gracefully delegate to mock
  getUsers: () => mockAdminApi.getUsers(),
  toggleUserStatus: (userId, newStatus, adminId, adminName) =>
    mockAdminApi.toggleUserStatus(userId, newStatus, adminId || "", adminName || ""),
  getReports: () => mockAdminApi.getReports(),
  resolveReport: (reportId, status, resolutionNote, adminId, adminName) =>
    mockAdminApi.resolveReport(reportId, status, resolutionNote, adminId || "", adminName || ""),
  getReviews: () => mockAdminApi.getReviews(),
  deleteReview: (reviewId, adminId, adminName) =>
    mockAdminApi.deleteReview(reviewId, adminId || "", adminName || ""),
  getAnalytics: () => mockAdminApi.getAnalytics(),
};

export const adminApi: AdminApi = USE_MOCK ? mockAdminApi : realAdminApi;
