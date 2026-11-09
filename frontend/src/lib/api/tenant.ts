import { z } from "zod";
import { http } from "./http";
import { USE_MOCK } from "./client";
import { mockTenantApi } from "./mock/tenant";
import type { PropertyItem } from "./properties";

export const VISIT_STATUSES = [
  "Pending",
  "Accepted",
  "Rejected",
  "Cancelled",
  "Completed",
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const REPORT_REASONS = [
  "Fake listing",
  "Already rented",
  "Incorrect information",
  "Suspicious behavior",
  "Inappropriate content",
  "Other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface TenantPreferencesData {
  preferredArea?: string;
  preferredAreaId?: number | null;
  maxBudget?: number;
  preferredPropertyType?: string;
  minRooms?: number;
  minBathrooms?: number;
  requiredAmenities?: string[];
  preferredFurnished?: string;
  hasMeaningfulPreferences?: boolean;
}

export interface TenantDashboardStats {
  favoritesCount: number;
  comparisonCount: number;
  visitsCount: number;
  conversationsCount: number;
  unreadMessagesCount: number;
  preferences: TenantPreferencesData | null;
}

export interface VisitRequestItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyArea: string;
  propertyRent: number;
  propertyImage: string;
  landlordName: string;
  landlordId: string;
  visitDate: string; // YYYY-MM-DD
  visitTimeSlot: string; // e.g. "Morning (10:00 AM - 12:00 PM)"
  note?: string;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  message: string;
  status: "Pending" | "Accepted" | "Rejected";
  landlordContact?: {
    phone: string | null;
    email: string | null;
  } | null;
  landlordNote?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "tenant" | "landlord";
  text: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  lastMessage: string;
  lastMessageAt: string;
  messages: MessageItem[];
}

export interface PropertyReviewItem {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  visitedVerified: boolean; // True if tenant completed a verified visit
  overallRating: number;
  accuracyRating: number;
  landlordBehaviorRating: number;
  locationRating: number;
  overallExperienceRating: number;
  comment: string;
  status?: string;
  createdAt: string;
}

export interface ListingReportItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
  status: "Pending Review" | "Resolved" | "Dismissed";
  createdAt: string;
}

export const PreferencesSchema = z.object({
  preferredArea: z.string().optional(),
  preferredAreaId: z.number().nullable().optional(),
  maxBudget: z
    .union([z.number().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  preferredPropertyType: z.string().optional(),
  minRooms: z
    .union([z.number().min(1), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  minBathrooms: z
    .union([z.number().min(1), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  requiredAmenities: z.array(z.string()).optional(),
  preferredFurnished: z.string().optional(),
  hasMeaningfulPreferences: z.boolean().optional(),
});

export const realTenantApi = {
  async getDashboardStats(): Promise<TenantDashboardStats> {
    const res = await http.get<{ data: TenantDashboardStats }>("/tenant/dashboard/stats");
    return res.data;
  },

  async getPreferences(): Promise<TenantPreferencesData> {
    const res = await http.get<{ data: TenantPreferencesData | null }>("/tenant/preferences");
    return res.data ?? {};
  },

  async savePreferences(data: TenantPreferencesData): Promise<TenantPreferencesData> {
    const res = await http.put<{ data: TenantPreferencesData }>("/tenant/preferences", data);
    return res.data;
  },

  async clearPreferences(): Promise<void> {
    await http.delete("/tenant/preferences");
  },

  async sendContactRequest(data: {
    propertyId: string;
    message: string;
    phone?: string;
  }): Promise<ContactRequestItem> {
    const res = await http.post<{ data: ContactRequestItem }>(
      `/properties/${encodeURIComponent(data.propertyId)}/contact`,
      { message: data.message, phone: data.phone },
    );
    return res.data;
  },

  async getContactRequests(): Promise<ContactRequestItem[]> {
    const res = await http.get<{ data: ContactRequestItem[] }>("/tenant/contact-requests");
    return res.data;
  },

  async createVisit(data: {
    propertyId: string;
    visitDate: string;
    visitTimeSlot: string;
    note?: string;
  }): Promise<VisitRequestItem> {
    const res = await http.post<{ data: VisitRequestItem }>(
      `/properties/${encodeURIComponent(data.propertyId)}/visits`,
      {
        visit_date: data.visitDate,
        preferred_time_slot: data.visitTimeSlot,
        notes: data.note,
      },
    );
    return res.data;
  },

  async getVisits(): Promise<VisitRequestItem[]> {
    const res = await http.get<{ data: VisitRequestItem[] }>("/tenant/visits");
    return res.data;
  },

  async cancelVisit(visitId: string, reason?: string): Promise<VisitRequestItem> {
    const res = await http.patch<{ data: VisitRequestItem }>(
      `/tenant/visits/${encodeURIComponent(visitId)}/cancel`,
      { cancellation_reason: reason },
    );
    return res.data;
  },

  // Messaging (Live Integration)
  async getConversations(): Promise<ConversationItem[]> {
    const res = await http.get<{ data: ConversationItem[] }>("/conversations");
    return res.data ?? [];
  },

  async getConversation(id: string): Promise<ConversationItem> {
    const res = await http.get<{ data: ConversationItem }>(
      `/conversations/${encodeURIComponent(id)}`,
    );
    return res.data;
  },

  async sendMessage(conversationId: string, text: string): Promise<MessageItem> {
    const res = await http.post<{ data: MessageItem }>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      { text },
    );
    return res.data;
  },

  async startConversation(contactRequestId: string, text: string): Promise<MessageItem> {
    const res = await http.post<{ data: MessageItem; conversation?: ConversationItem }>(
      `/contact-requests/${encodeURIComponent(contactRequestId)}/messages`,
      { text },
    );
    return res.data;
  },

  // Favorites (Live Integration)
  async getFavorites(): Promise<PropertyItem[]> {
    const res = await http.get<{ data: PropertyItem[] }>("/tenant/favorites");
    return res.data ?? [];
  },

  async addFavorite(propertyId: string | number): Promise<void> {
    await http.post("/tenant/favorites", { property_id: Number(propertyId) });
  },

  async removeFavorite(propertyId: string | number): Promise<void> {
    await http.delete(`/tenant/favorites/${encodeURIComponent(String(propertyId))}`);
  },

  // Comparisons (Live Integration)
  async getComparisons(): Promise<
    Array<{ id: string; propertyId: string; displayOrder: number; property: PropertyItem }>
  > {
    const res = await http.get<{
      data: Array<{ id: string; propertyId: string; displayOrder: number; property: PropertyItem }>;
    }>("/tenant/comparisons");
    return res.data ?? [];
  },

  async addComparison(
    propertyId: string | number,
  ): Promise<{ id: string; propertyId: string; displayOrder: number }> {
    const res = await http.post<{
      data: { id: string; propertyId: string; displayOrder: number };
    }>("/tenant/comparisons", {
      property_id: Number(propertyId),
    });
    return res.data;
  },

  async removeComparison(propertyId: string | number): Promise<void> {
    await http.delete(`/tenant/comparisons/${encodeURIComponent(String(propertyId))}`);
  },

  async clearComparisons(): Promise<void> {
    await http.delete("/tenant/comparisons");
  },

  async getReviews(): Promise<PropertyReviewItem[]> {
    const res = await http.get<{ data: PropertyReviewItem[] }>("/tenant/reviews");
    return res.data ?? [];
  },

  async submitReview(data: {
    property_id: number;
    accuracy_rating: number;
    landlord_behavior_rating: number;
    location_rating: number;
    overall_experience_rating: number;
    comment: string;
  }): Promise<PropertyReviewItem> {
    const res = await http.post<{ data: PropertyReviewItem }>("/tenant/reviews", data);
    return res.data;
  },
};

export const tenantApi = USE_MOCK
  ? {
      ...mockTenantApi,
      getPreferences: (...args: Parameters<typeof mockTenantApi.getPreferences>) =>
        mockTenantApi.getPreferences(...args),
      savePreferences: (...args: Parameters<typeof mockTenantApi.savePreferences>) =>
        mockTenantApi.savePreferences(...args),
      clearPreferences: (...args: Parameters<typeof mockTenantApi.clearPreferences>) =>
        mockTenantApi.clearPreferences(...args),
      getConversations: () => mockTenantApi.getConversations(),
      getConversation: async (id: string) => {
        const convs = await mockTenantApi.getConversations();
        const conv = convs.find((c) => c.id === id);
        if (!conv) throw new Error("Conversation not found");
        return conv;
      },
      sendMessage: (cId: string, text: string) => mockTenantApi.sendMessage(cId, text),
      startConversation: async (_crId: string, text: string) => {
        return mockTenantApi.sendMessage("conv-01", text);
      },
      getFavorites: async () => [],
      addFavorite: async (id: string | number) => {
        mockTenantApi.toggleFavorite(String(id));
      },
      removeFavorite: async (id: string | number) => {
        mockTenantApi.toggleFavorite(String(id));
      },
      getComparisons: async () => [],
      addComparison: async (id: string | number) => {
        mockTenantApi.toggleComparison(String(id));
        return { id: String(id), propertyId: String(id), displayOrder: 1 };
      },
      removeComparison: async (id: string | number) => {
        mockTenantApi.toggleComparison(String(id));
      },
      clearComparisons: async () => {
        localStorage.removeItem("thikana.comparison");
      },
      getReviews: async () => {
        return mockTenantApi.getReviews ? mockTenantApi.getReviews("") : [];
      },
      submitReview: (data: Parameters<typeof mockTenantApi.submitReview>[0]) => {
        return mockTenantApi.submitReview(data);
      },
      getDashboardStats: async (): Promise<TenantDashboardStats> => ({
        favoritesCount: mockTenantApi.getFavoriteIds().length,
        comparisonCount: mockTenantApi.getComparisonIds().length,
        visitsCount: (await mockTenantApi.getVisits()).length,
        conversationsCount: (await mockTenantApi.getConversations()).length,
        unreadMessagesCount: 0,
        preferences: await mockTenantApi.getPreferences(),
      }),
    }
  : {
      ...mockTenantApi,
      getDashboardStats: realTenantApi.getDashboardStats,
      getPreferences: realTenantApi.getPreferences,
      savePreferences: realTenantApi.savePreferences,
      clearPreferences: realTenantApi.clearPreferences,
      sendContactRequest: realTenantApi.sendContactRequest,
      getContactRequests: realTenantApi.getContactRequests,
      createVisit: realTenantApi.createVisit,
      getVisits: realTenantApi.getVisits,
      cancelVisit: realTenantApi.cancelVisit,
      getConversations: realTenantApi.getConversations,
      getConversation: realTenantApi.getConversation,
      sendMessage: realTenantApi.sendMessage,
      startConversation: realTenantApi.startConversation,
      getFavorites: realTenantApi.getFavorites,
      addFavorite: realTenantApi.addFavorite,
      removeFavorite: realTenantApi.removeFavorite,
      getComparisons: realTenantApi.getComparisons,
      addComparison: realTenantApi.addComparison,
      removeComparison: realTenantApi.removeComparison,
      clearComparisons: realTenantApi.clearComparisons,
      getReviews: realTenantApi.getReviews,
      submitReview: realTenantApi.submitReview,
    };
