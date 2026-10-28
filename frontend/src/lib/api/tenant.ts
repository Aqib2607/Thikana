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
  maxBudget?: number;
  preferredPropertyType?: string;
  minRooms?: number;
  requiredAmenities?: string[];
  preferredFurnished?: string;
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
  maxBudget: z.number().min(0).optional(),
  preferredPropertyType: z.string().optional(),
  minRooms: z.number().min(1).optional(),
  requiredAmenities: z.array(z.string()).optional(),
  preferredFurnished: z.string().optional(),
});

export const realTenantApi = {
  async sendContactRequest(data: {
    propertyId: string;
    message: string;
    phone?: string;
  }): Promise<ContactRequestItem> {
    const res = await http.post<{ data: ContactRequestItem }>(
      `/properties/${encodeURIComponent(data.propertyId)}/contact`,
      { message: data.message, phone: data.phone }
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
      }
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
      { cancellation_reason: reason }
    );
    return res.data;
  },
};

export const tenantApi = USE_MOCK
  ? mockTenantApi
  : {
      ...mockTenantApi,
      sendContactRequest: realTenantApi.sendContactRequest,
      getContactRequests: realTenantApi.getContactRequests,
      createVisit: realTenantApi.createVisit,
      getVisits: realTenantApi.getVisits,
      cancelVisit: realTenantApi.cancelVisit,
    };
