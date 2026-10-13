import { z } from "zod";
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
  createdAt: string;
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
