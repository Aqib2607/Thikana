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
  approveProperty(propertyId: string, adminId: string, adminName: string): Promise<PropertyItem>;
  rejectProperty(
    propertyId: string,
    reason: string,
    adminId: string,
    adminName: string,
  ): Promise<PropertyItem>;

  getUsers(): Promise<AdminUserItem[]>;
  toggleUserStatus(
    userId: string,
    newStatus: "active" | "suspended",
    adminId: string,
    adminName: string,
  ): Promise<AdminUserItem>;

  updatePropertyVerifications(
    propertyId: string,
    verifications: VerificationState[],
    adminId: string,
    adminName: string,
  ): Promise<PropertyItem>;

  getReports(): Promise<ListingReportItem[]>;
  resolveReport(
    reportId: string,
    status: "Resolved" | "Dismissed",
    resolutionNote: string,
    adminId: string,
    adminName: string,
  ): Promise<ListingReportItem>;

  getReviews(): Promise<PropertyReviewItem[]>;
  deleteReview(reviewId: string, adminId: string, adminName: string): Promise<void>;

  getCommunityData(): Promise<Record<string, CommunityInfo>>;
  updateCommunityData(
    area: string,
    info: CommunityInfo,
    adminId: string,
    adminName: string,
  ): Promise<void>;

  getAnalytics(): Promise<{
    areaDemand: AreaDemandStat[];
    propertyTypeDistribution: Record<string, number>;
    studentPreferenceRatio: { studentsOnly: number; any: number; familyOnly: number };
    totalVisitsCompleted: number;
  }>;

  getAuditLogs(): Promise<AuditLogItem[]>;
}
