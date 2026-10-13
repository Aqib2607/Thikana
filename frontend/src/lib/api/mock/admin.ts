import type { AdminApi, AdminStats, AdminUserItem, AuditLogItem, AreaDemandStat } from "../admin";
import type { PropertyItem, ApprovalStatus, VerificationState, CommunityInfo } from "../properties";
import type { ListingReportItem, PropertyReviewItem } from "../tenant";
import { MOCK_PROPERTIES, KHULNA_AREAS } from "./properties";

const STORAGE_KEYS = {
  USERS: "thikana.mock.users",
  CUSTOM_PROPERTIES: "thikana.properties.custom",
  REPORTS: "thikana.reports",
  REVIEWS: "thikana.reviews",
  COMMUNITY: "thikana.admin.community",
  AUDIT_LOGS: "thikana.admin.audit_logs",
  VISITS: "thikana.tenant.visits",
};

// Default seed audit logs
const SEED_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-1",
    actorId: "u-admin",
    actorName: "System Admin",
    action: "PROPERTY_APPROVED",
    targetType: "property",
    targetId: "prop-kuet-01",
    details: "Listing 'Quiet 2-Bed Flat Near KUET Main Gate' approved after initial inspection.",
    timestamp: "2026-10-10T09:30:00Z",
  },
  {
    id: "log-2",
    actorId: "u-admin",
    actorName: "System Admin",
    action: "VERIFICATION_UPDATED",
    targetType: "property",
    targetId: "prop-kuet-01",
    details: "Added simulated verifications: Owner Identity Verified, Phone Verified.",
    timestamp: "2026-10-10T09:35:00Z",
  },
  {
    id: "log-3",
    actorId: "u-admin",
    actorName: "System Admin",
    action: "COMMUNITY_DATA_UPDATED",
    targetType: "community",
    targetId: "KUET Gate / Teligati",
    details: "Updated waterlogging and transport notes for monsoon season.",
    timestamp: "2026-10-11T11:15:00Z",
  },
  {
    id: "log-4",
    actorId: "u-admin",
    actorName: "System Admin",
    action: "REPORT_RESOLVED",
    targetType: "report",
    targetId: "rep-seed-01",
    details: "Resolved landlord rent dispute report with note: Landlord contacted, rent verified.",
    timestamp: "2026-10-12T14:20:00Z",
  },
];

// Default seed reports
const SEED_REPORTS: ListingReportItem[] = [
  {
    id: "rep-seed-01",
    propertyId: "prop-sonadanga-03",
    propertyTitle: "Executive 3-Bed Apartment in Sonadanga R/A",
    reporterId: "u-tenant",
    reason: "Incorrect information",
    details: "The advance deposit mentioned in person was higher than listed on the profile.",
    status: "Resolved",
    createdAt: "2026-10-11T12:00:00Z",
  },
  {
    id: "rep-seed-02",
    propertyId: "prop-pending-01",
    propertyTitle: "Modern 1-Bed Room in Choto Boyra (Under Review)",
    reporterId: "u-tenant-2",
    reason: "Already rented",
    details: "I called earlier and the caretaker mentioned this seat was booked last week.",
    status: "Pending Review",
    createdAt: "2026-10-12T16:45:00Z",
  },
  {
    id: "rep-seed-03",
    propertyId: "prop-boyra-04",
    propertyTitle: "Affordable Shared Student Mess Near Boyra Medical Mor",
    reporterId: "u-tenant",
    reason: "Suspicious behavior",
    details: "Someone claiming to be an agent asked for bKash booking money before visit.",
    status: "Pending Review",
    createdAt: "2026-10-13T09:10:00Z",
  },
];

// Helper to log actions
function appendAuditLog(entry: Omit<AuditLogItem, "id" | "timestamp">) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const list: AuditLogItem[] = raw ? JSON.parse(raw) : [...SEED_AUDIT_LOGS];
    const newLog: AuditLogItem = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
  } catch {
    // Ignore in SSR/testing
  }
}

const SEED_PENDING_PROPERTY: PropertyItem = {
  id: "prop-pending-01",
  title: "Modern 1-Bed Room in Choto Boyra (Under Review)",
  banglaTitle: "ছোট বয়রায় আধুনিক ১ রুমের বাসা (পর্যালোচনাধীন)",
  slug: "modern-1-bed-room-choto-boyra-pending",
  propertyType: "Room",
  rentalType: "Monthly Rental",
  rent: 4500,
  advance: 5000,
  additionalCharges: 500,
  billsIncluded: ["Water Supply", "WiFi"],
  availability: "Available",
  availableFrom: "2026-11-15",
  approvalStatus: "Pending Approval",
  division: "Khulna",
  district: "Khulna",
  city: "Khulna",
  area: "Choto Boyra",
  exactAddress: "House 18, Road 2, Near Choto Boyra Jame Masjid, Khulna-9000",
  lat: 22.839,
  lng: 89.534,
  size: 220,
  rooms: 1,
  bathrooms: 1,
  balconies: 1,
  floor: "2nd Floor",
  totalFloors: 4,
  furnishedStatus: "Semi-Furnished",
  preferredTenant: "Students Only",
  images: [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  ],
  featuredImage:
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
  amenities: ["High-Speed WiFi", "24/7 Deep Tube-Well Water", "Private Balcony", "Rooftop Access"],
  verifications: [],
  community: {
    transport: "5 mins to Boyra Mor. Easy auto-rickshaws available to Medical Mor and New Market.",
    waterlogging: "Slight rainwater buildup during heavy monsoons, clears in 2 hours.",
    internet: "Link3 active fiber connection available.",
    noise: "Quiet residential lane.",
    safety: "Building locked after 11 PM with CCTV at the gate.",
    general: "Grocery shop and local tea stall within 50 meters.",
  },
  landlord: {
    id: "u-landlord",
    name: "Kabir Hossain",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    memberSince: "March 2024",
    publicContactVisible: false,
    phone: "01722222222",
    email: "landlord@demo.test",
    verified: true,
  },
  rating: 0,
  reviewCount: 0,
  createdAt: "2026-10-12T08:00:00Z",
  updatedAt: "2026-10-12T08:00:00Z",
};

// Helpers for unified property retrieval
function getAllMergedProperties(): PropertyItem[] {
  let custom: PropertyItem[] = [SEED_PENDING_PROPERTY];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROPERTIES);
    if (raw) custom = JSON.parse(raw);
  } catch {
    // Ignore
  }

  const customMap = new Map(custom.map((c) => [c.id, c]));
  const merged = MOCK_PROPERTIES.map((p) => {
    const override = customMap.get(p.id);
    if (override) return override;
    return {
      ...p,
      approvalStatus: p.approvalStatus || ("Approved" as ApprovalStatus),
    };
  });

  // Also include custom ones that are not in MOCK_PROPERTIES
  for (const c of custom) {
    if (!MOCK_PROPERTIES.some((m) => m.id === c.id)) {
      merged.push(c);
    }
  }

  return merged;
}

function saveCustomProperty(prop: PropertyItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROPERTIES);
    const list: PropertyItem[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((p) => p.id === prop.id);
    if (idx >= 0) {
      list[idx] = prop;
    } else {
      list.push(prop);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROPERTIES, JSON.stringify(list));
    window.dispatchEvent(new Event("thikana.properties.updated"));
  } catch {
    // Ignore
  }
}

export const mockAdminApi: AdminApi = {
  async getDashboardStats(): Promise<AdminStats> {
    await new Promise((r) => setTimeout(r, 40));
    const properties = getAllMergedProperties();
    const users = await this.getUsers();
    const reports = await this.getReports();
    const reviews = await this.getReviews();
    const auditLogs = await this.getAuditLogs();

    const pendingProperties = properties.filter(
      (p) => p.approvalStatus === "Pending Approval",
    ).length;
    const approvedProperties = properties.filter((p) => p.approvalStatus === "Approved").length;
    const pendingReports = reports.filter((r) => r.status === "Pending Review").length;

    return {
      pendingProperties,
      approvedProperties,
      totalProperties: properties.length,
      totalUsers: users.length,
      tenantUsers: users.filter((u) => u.role === "tenant").length,
      landlordUsers: users.filter((u) => u.role === "landlord").length,
      pendingReports,
      totalReviews: reviews.length,
      auditLogsCount: auditLogs.length,
    };
  },

  async getProperties(statusFilter: ApprovalStatus | "ALL" = "ALL"): Promise<PropertyItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    const all = getAllMergedProperties();
    if (statusFilter === "ALL") return all;
    return all.filter((p) => p.approvalStatus === statusFilter);
  },

  async approveProperty(
    propertyId: string,
    adminId: string,
    adminName: string,
  ): Promise<PropertyItem> {
    await new Promise((r) => setTimeout(r, 60));
    const properties = getAllMergedProperties();
    const target = properties.find((p) => p.id === propertyId);
    if (!target) throw new Error("Property not found");

    const updated: PropertyItem = {
      ...target,
      approvalStatus: "Approved",
      updatedAt: new Date().toISOString(),
    };
    saveCustomProperty(updated);

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: "PROPERTY_APPROVED",
      targetType: "property",
      targetId: propertyId,
      details: `Approved property '${target.title}' (${target.area})`,
    });

    return updated;
  },

  async rejectProperty(
    propertyId: string,
    reason: string,
    adminId: string,
    adminName: string,
  ): Promise<PropertyItem> {
    await new Promise((r) => setTimeout(r, 60));
    const properties = getAllMergedProperties();
    const target = properties.find((p) => p.id === propertyId);
    if (!target) throw new Error("Property not found");

    const updated: PropertyItem = {
      ...target,
      approvalStatus: "Rejected",
      updatedAt: new Date().toISOString(),
    };
    saveCustomProperty(updated);

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: "PROPERTY_REJECTED",
      targetType: "property",
      targetId: propertyId,
      details: `Rejected property '${target.title}'. Reason: ${reason}`,
    });

    return updated;
  },

  async getUsers(): Promise<AdminUserItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (raw) {
        const stored = JSON.parse(raw) as Array<{
          id: string;
          name: string;
          email: string;
          phone: string;
          role: "tenant" | "landlord" | "admin";
          verified?: boolean;
          status?: "active" | "suspended";
          createdAt?: string;
        }>;
        return stored.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          verified: !!u.verified,
          status: u.status || "active",
          createdAt: u.createdAt || "2026-02-01T00:00:00Z",
        }));
      }
    } catch {
      // Ignore
    }

    // Default seeded fallback users
    return [
      {
        id: "u-tenant",
        name: "Rafi Ahmed",
        email: "tenant@demo.test",
        phone: "01711111111",
        role: "tenant",
        verified: true,
        status: "active",
        createdAt: "2026-01-10T10:00:00Z",
      },
      {
        id: "u-landlord",
        name: "Kabir Hossain",
        email: "landlord@demo.test",
        phone: "01822222222",
        role: "landlord",
        verified: true,
        status: "active",
        createdAt: "2026-01-05T08:00:00Z",
      },
      {
        id: "u-admin",
        name: "System Admin",
        email: "admin@demo.test",
        phone: "01933333333",
        role: "admin",
        verified: true,
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "u-tenant-2",
        name: "Shakil Khan",
        email: "shakil.kuet@test.com",
        phone: "01744444444",
        role: "tenant",
        verified: false,
        status: "active",
        createdAt: "2026-03-01T12:00:00Z",
      },
      {
        id: "u-landlord-2",
        name: "Mustafa Rahman",
        email: "mustafa.gallamari@test.com",
        phone: "01755555555",
        role: "landlord",
        verified: true,
        status: "active",
        createdAt: "2026-02-15T09:30:00Z",
      },
    ];
  },

  async toggleUserStatus(
    userId: string,
    newStatus: "active" | "suspended",
    adminId: string,
    adminName: string,
  ): Promise<AdminUserItem> {
    await new Promise((r) => setTimeout(r, 60));
    const users = await this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error("User not found");

    target.status = newStatus;

    // Sync to thikana.mock.users
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (raw) {
        const storedUsers = JSON.parse(raw) as Array<{ id: string; status?: string }>;
        const idx = storedUsers.findIndex((u) => u.id === userId);
        const userToUpdate = idx >= 0 ? storedUsers[idx] : undefined;
        if (userToUpdate) {
          userToUpdate.status = newStatus;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(storedUsers));
        }
      }
    } catch {
      // Ignore
    }

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: newStatus === "suspended" ? "USER_SUSPENDED" : "USER_ACTIVATED",
      targetType: "user",
      targetId: userId,
      details: `${newStatus === "suspended" ? "Suspended" : "Activated"} user account for ${target.name} (${target.email})`,
    });

    return target;
  },

  async updatePropertyVerifications(
    propertyId: string,
    verifications: VerificationState[],
    adminId: string,
    adminName: string,
  ): Promise<PropertyItem> {
    await new Promise((r) => setTimeout(r, 60));
    const properties = getAllMergedProperties();
    const target = properties.find((p) => p.id === propertyId);
    if (!target) throw new Error("Property not found");

    const updated: PropertyItem = {
      ...target,
      verifications,
      updatedAt: new Date().toISOString(),
    };
    saveCustomProperty(updated);

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: "VERIFICATIONS_UPDATED",
      targetType: "property",
      targetId: propertyId,
      details: `Updated verifications on '${target.title}': [${verifications.join(", ")}]`,
    });

    return updated;
  },

  async getReports(): Promise<ListingReportItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [...SEED_REPORTS];
  },

  async resolveReport(
    reportId: string,
    status: "Resolved" | "Dismissed",
    resolutionNote: string,
    adminId: string,
    adminName: string,
  ): Promise<ListingReportItem> {
    await new Promise((r) => setTimeout(r, 60));
    const reports = await this.getReports();
    const target = reports.find((r) => r.id === reportId);
    if (!target) throw new Error("Report not found");

    target.status = status;
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch {
      // Ignore
    }

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: status === "Resolved" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
      targetType: "report",
      targetId: reportId,
      details: `${status} report on property '${target.propertyTitle}'. Resolution note: ${resolutionNote || "None provided"}`,
    });

    return target;
  },

  async getReviews(): Promise<PropertyReviewItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    // Default seed reviews
    return [
      {
        id: "rev-1",
        propertyId: "prop-kuet-01",
        tenantId: "u-tenant",
        tenantName: "Rafi Ahmed",
        visitedVerified: true,
        overallRating: 5,
        accuracyRating: 5,
        landlordBehaviorRating: 5,
        locationRating: 5,
        overallExperienceRating: 5,
        comment: "Excellent flat for KUET seniors. Clean water and peaceful surroundings.",
        createdAt: "2026-10-10T15:00:00Z",
      },
      {
        id: "rev-2",
        propertyId: "prop-ku-02",
        tenantId: "u-tenant-2",
        tenantName: "Shakil Khan",
        visitedVerified: true,
        overallRating: 4,
        accuracyRating: 4,
        landlordBehaviorRating: 4,
        locationRating: 5,
        overallExperienceRating: 4,
        comment: "Very close to KU Zero Point. Easy auto-rickshaw access.",
        createdAt: "2026-10-11T18:00:00Z",
      },
      {
        id: "rev-3",
        propertyId: "prop-boyra-04",
        tenantId: "u-tenant-3",
        tenantName: "Tariqul Islam",
        visitedVerified: false,
        overallRating: 3,
        accuracyRating: 3,
        landlordBehaviorRating: 3,
        locationRating: 4,
        overallExperienceRating: 3,
        comment: "Decent mess room but dining fees fluctuate each month.",
        createdAt: "2026-10-12T10:00:00Z",
      },
    ];
  },

  async deleteReview(reviewId: string, adminId: string, adminName: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 60));
    const reviews = await this.getReviews();
    const target = reviews.find((r) => r.id === reviewId);
    const filtered = reviews.filter((r) => r.id !== reviewId);

    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(filtered));
    } catch {
      // Ignore
    }

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: "REVIEW_DELETED",
      targetType: "review",
      targetId: reviewId,
      details: `Removed review by ${target?.tenantName || "tenant"} on property ID ${target?.propertyId || "unknown"}.`,
    });
  },

  async getCommunityData(): Promise<Record<string, CommunityInfo>> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    // Default community data map for Khulna areas
    const initialMap: Record<string, CommunityInfo> = {};
    for (const p of MOCK_PROPERTIES) {
      if (!initialMap[p.area]) {
        initialMap[p.area] = p.community;
      }
    }
    return initialMap;
  },

  async updateCommunityData(
    area: string,
    info: CommunityInfo,
    adminId: string,
    adminName: string,
  ): Promise<void> {
    await new Promise((r) => setTimeout(r, 60));
    const current = await this.getCommunityData();
    current[area] = info;

    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY, JSON.stringify(current));
    } catch {
      // Ignore
    }

    appendAuditLog({
      actorId: adminId,
      actorName: adminName,
      action: "COMMUNITY_DATA_UPDATED",
      targetType: "community",
      targetId: area,
      details: `Updated community and neighborhood data for Khulna area: ${area}.`,
    });
  },

  async getAnalytics(): Promise<{
    areaDemand: AreaDemandStat[];
    propertyTypeDistribution: Record<string, number>;
    studentPreferenceRatio: { studentsOnly: number; any: number; familyOnly: number };
    totalVisitsCompleted: number;
  }> {
    await new Promise((r) => setTimeout(r, 40));
    const properties = getAllMergedProperties();

    // Area demand calculation
    const areaMap: Record<string, { count: number; totalRent: number; inquiries: number }> = {};
    for (const a of KHULNA_AREAS.slice(1)) {
      areaMap[a] = { count: 0, totalRent: 0, inquiries: Math.floor(Math.random() * 8) + 3 };
    }

    for (const p of properties) {
      const existing = areaMap[p.area];
      if (existing) {
        existing.count += 1;
        existing.totalRent += p.rent;
      } else {
        areaMap[p.area] = { count: 1, totalRent: p.rent, inquiries: 5 };
      }
    }

    const areaDemand: AreaDemandStat[] = Object.entries(areaMap).map(([area, stats]) => ({
      area,
      listingCount: stats.count,
      avgRent: stats.count > 0 ? Math.round(stats.totalRent / stats.count) : 0,
      inquiryCount: stats.inquiries + stats.count * 2,
    }));

    // Property types
    const propertyTypeDistribution: Record<string, number> = {};
    for (const p of properties) {
      propertyTypeDistribution[p.propertyType] =
        (propertyTypeDistribution[p.propertyType] || 0) + 1;
    }

    // Student preferences
    let studentsOnly = 0;
    let any = 0;
    let familyOnly = 0;

    for (const p of properties) {
      if (
        p.preferredTenant === "Students Only" ||
        p.preferredTenant === "Male Students Only" ||
        p.preferredTenant === "Female Students Only"
      ) {
        studentsOnly += 1;
      } else if (p.preferredTenant === "Family Only") {
        familyOnly += 1;
      } else {
        any += 1;
      }
    }

    let visitsCompleted = 12;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
      if (raw) {
        const visits = JSON.parse(raw) as Array<{ status?: string }>;
        visitsCompleted += visits.filter((v) => v.status === "Completed").length;
      }
    } catch {
      // Ignore
    }

    return {
      areaDemand,
      propertyTypeDistribution,
      studentPreferenceRatio: { studentsOnly, any, familyOnly },
      totalVisitsCompleted: visitsCompleted,
    };
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [...SEED_AUDIT_LOGS];
  },
};
