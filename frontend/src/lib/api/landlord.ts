import { z } from "zod";
import { http } from "./http";
import { USE_MOCK } from "./client";
import { mockLandlordApi } from "./mock/landlord";
import {
  PROPERTY_TYPES,
  RENTAL_TYPES,
  AVAILABILITY_STATUSES,
  APPROVAL_STATUSES,
  FURNISHED_STATUSES,
  TENANT_PREFERENCES,
  type PropertyType,
  type RentalType,
  type AvailabilityStatus,
  type ApprovalStatus,
  type FurnishedStatus,
  type TenantPreference,
  type PropertyItem,
} from "./properties";
import type { VisitRequestItem, ContactRequestItem, ConversationItem, MessageItem } from "./tenant";

export const PropertyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters / শিরোনাম অন্তত ৫ অক্ষরের হতে হবে"),
  banglaTitle: z.string().optional(),
  propertyType: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: "Select a valid property type" }),
  }),
  rentalType: z.enum(RENTAL_TYPES, {
    errorMap: () => ({ message: "Select a valid rental type" }),
  }),
  rent: z
    .number({ invalid_type_error: "Monthly rent must be a number" })
    .min(500, "Rent must be at least ৳500 / ভাড়া অন্তত ৫০০ টাকা হতে হবে"),
  advance: z
    .number({ invalid_type_error: "Advance deposit must be a number" })
    .min(0, "Advance deposit cannot be negative"),
  additionalCharges: z
    .number({ invalid_type_error: "Additional charges must be a number" })
    .min(0, "Additional charges cannot be negative")
    .default(0),
  billsIncluded: z.array(z.string()).default([]),
  availability: z.enum(AVAILABILITY_STATUSES).default("Available"),
  availableFrom: z.string().min(1, "Available from date is required"),

  // Location Hierarchy (Khulna-prioritized)
  division: z.string().default("Khulna"),
  district: z.string().default("Khulna"),
  city: z.string().default("Khulna"),
  area: z.string().min(1, "Select area in Khulna / খুলনার এলাকা নির্বাচন করুন"),
  exactAddress: z.string().min(5, "Exact public address is required / পূর্ণ ও সঠিক ঠিকানা আবশ্যক"),
  lat: z.number().default(22.8456),
  lng: z.number().default(89.5403),

  // Specs
  size: z.number().min(50, "Size must be at least 50 sq ft / সাইজ অন্তত ৫০ বর্গফুট হতে হবে"),
  rooms: z.number().min(1, "At least 1 room / অন্তত ১টি room আবশ্যক"),
  bathrooms: z.number().min(1, "At least 1 bathroom / অন্তত ১টি বাথরুম আবশ্যক"),
  balconies: z.number().min(0, "Balconies cannot be negative").default(0),
  floor: z.string().min(1, "Floor level is required / তলার বিবরণ আবশ্যক"),
  totalFloors: z.number().optional(),
  furnishedStatus: z.enum(FURNISHED_STATUSES).default("Unfurnished"),
  preferredTenant: z.enum(TENANT_PREFERENCES).default("Any"),

  // Images (Max 5, first is featured)
  images: z
    .array(z.string().url("Must be a valid image URL"))
    .min(1, "At least 1 property photo is required / অন্তত ১টি ছবি আবশ্যক")
    .max(5, "Maximum 5 photos allowed / সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে"),
  featuredImage: z.string().url().optional(),

  // Amenities
  amenities: z.array(z.string()).default([]),

  // Public Contact Visibility Setting (Landlord-controlled)
  publicContactVisible: z.boolean().default(false),

  // Community Info
  community: z
    .object({
      transport: z.string().default(""),
      waterlogging: z.string().default(""),
      internet: z.string().default(""),
      noise: z.string().default(""),
      safety: z.string().default(""),
      general: z.string().default(""),
    })
    .default({
      transport: "",
      waterlogging: "",
      internet: "",
      noise: "",
      safety: "",
      general: "",
    }),
});

export type PropertyFormData = z.infer<typeof PropertyFormSchema>;

export interface LandlordStats {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  activeVisits: number;
  pendingContactRequests: number;
}

export interface LandlordApi {
  getMyProperties(landlordId?: string): Promise<PropertyItem[]>;
  getPropertyById(id: string): Promise<PropertyItem | null>;
  createProperty(
    landlordId: string,
    data: PropertyFormData,
    landlordProfile?: { name: string; phone?: string; email?: string },
  ): Promise<PropertyItem>;
  updateProperty(id: string, data: Partial<PropertyFormData>): Promise<PropertyItem>;
  updateAvailability(id: string, availability: AvailabilityStatus): Promise<PropertyItem>;
  toggleContactVisibility(id: string, visible: boolean): Promise<PropertyItem>;
  deactivateProperty(id: string): Promise<PropertyItem>;
  deleteProperty(id: string): Promise<void>;
  getStats(landlordId?: string): Promise<LandlordStats>;

  // Dedicated Image Management
  uploadImage?(
    propertyId: string,
    image: File | string,
  ): Promise<{ id: string; imageUrl: string; isFeatured: boolean; displayOrder: number }>;
  deleteImage?(propertyId: string, imageId: string | number): Promise<void>;
  reorderImages?(
    propertyId: string,
    imageIds: number[],
  ): Promise<{ status: number; message: string }>;

  // Inbound Requests & Visits
  getContactRequests(landlordId: string): Promise<ContactRequestItem[]>;
  updateContactRequestStatus(
    requestId: string,
    status: "Accepted" | "Rejected",
  ): Promise<ContactRequestItem>;

  getVisits(landlordId: string): Promise<VisitRequestItem[]>;
  updateVisitStatus(
    visitId: string,
    status: "Accepted" | "Rejected" | "Completed" | "Cancelled",
  ): Promise<VisitRequestItem>;

  // Messaging
  getConversations(landlordId: string): Promise<ConversationItem[]>;
  sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    text: string,
  ): Promise<MessageItem>;
}

export const realLandlordApi: LandlordApi = {
  async getMyProperties(_landlordId?: string): Promise<PropertyItem[]> {
    const res = await http.get<{ data: PropertyItem[] }>("/landlord/properties");
    return res.data;
  },

  async getPropertyById(id: string): Promise<PropertyItem | null> {
    try {
      const res = await http.get<{ data: PropertyItem }>(
        `/landlord/properties/${encodeURIComponent(id)}`,
      );
      return res.data;
    } catch (err: any) {
      if (err?.status === 404) return null;
      throw err;
    }
  },

  async createProperty(
    _landlordId: string,
    data: PropertyFormData,
    _landlordProfile?: { name: string; phone?: string; email?: string },
  ): Promise<PropertyItem> {
    const payload = {
      title: data.title,
      banglaTitle: data.banglaTitle,
      propertyType: data.propertyType,
      rentalType: data.rentalType,
      rent: data.rent,
      advance: data.advance,
      additionalCharges: data.additionalCharges,
      billsIncluded: data.billsIncluded,
      availability: data.availability,
      availableFrom: data.availableFrom,
      division: data.division,
      district: data.district,
      city: data.city,
      area: data.area,
      exactAddress: data.exactAddress,
      lat: data.lat,
      lng: data.lng,
      size: data.size,
      rooms: data.rooms,
      bathrooms: data.bathrooms,
      balconies: data.balconies,
      floor: data.floor,
      totalFloors: data.totalFloors,
      furnishedStatus: data.furnishedStatus,
      preferredTenant: data.preferredTenant,
      images: data.images,
      featuredImage: data.featuredImage || data.images?.[0],
      amenities: data.amenities,
      publicContactVisible: data.publicContactVisible,
      community: data.community,
    };
    const res = await http.post<{ data: PropertyItem }>("/landlord/properties", payload);
    return res.data;
  },

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<PropertyItem> {
    const res = await http.put<{ data: PropertyItem }>(
      `/landlord/properties/${encodeURIComponent(id)}`,
      data,
    );
    return res.data;
  },

  async updateAvailability(id: string, availability: AvailabilityStatus): Promise<PropertyItem> {
    const res = await http.patch<{ data: PropertyItem }>(
      `/landlord/properties/${encodeURIComponent(id)}/availability`,
      { availability },
    );
    return res.data;
  },

  async toggleContactVisibility(id: string, visible: boolean): Promise<PropertyItem> {
    const res = await http.patch<{ data: PropertyItem }>(
      `/landlord/properties/${encodeURIComponent(id)}/contact-visibility`,
      { publicContactVisible: visible },
    );
    return res.data;
  },

  async deactivateProperty(id: string): Promise<PropertyItem> {
    return this.updateAvailability(id, "Temporarily Unavailable");
  },

  async deleteProperty(id: string): Promise<void> {
    await http.delete(`/landlord/properties/${encodeURIComponent(id)}`);
  },

  async getStats(_landlordId?: string): Promise<LandlordStats> {
    const res = await http.get<{ data: LandlordStats }>("/landlord/stats");
    return res.data;
  },

  async uploadImage(
    propertyId: string,
    image: File | string,
  ): Promise<{ id: string; imageUrl: string; isFeatured: boolean; displayOrder: number }> {
    let body: FormData | { imageUrl: string };
    if (image instanceof File) {
      const fd = new FormData();
      fd.append("image", image);
      body = fd;
    } else {
      body = { imageUrl: image };
    }

    const res = await http.post<{
      data: { id: string; imageUrl: string; isFeatured: boolean; displayOrder: number };
    }>(`/landlord/properties/${encodeURIComponent(propertyId)}/images`, body);
    return res.data;
  },

  async deleteImage(propertyId: string, imageId: string | number): Promise<void> {
    await http.delete(
      `/landlord/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(String(imageId))}`,
    );
  },

  async reorderImages(
    propertyId: string,
    imageIds: number[],
  ): Promise<{ status: number; message: string }> {
    return http.put<{ status: number; message: string }>(
      `/landlord/properties/${encodeURIComponent(propertyId)}/images/reorder`,
      { imageIds },
    );
  },

  // Inbound Contact Requests (Live Integration)
  async getContactRequests(_landlordId?: string): Promise<ContactRequestItem[]> {
    const res = await http.get<{ data: ContactRequestItem[] }>("/landlord/contact-requests");
    return res.data;
  },
  async updateContactRequestStatus(
    requestId: string,
    status: "Accepted" | "Rejected",
  ): Promise<ContactRequestItem> {
    const res = await http.patch<{ data: ContactRequestItem }>(
      `/landlord/contact-requests/${encodeURIComponent(requestId)}/status`,
      { status: status.toLowerCase() },
    );
    return res.data;
  },

  // Inbound Visit Requests (Live Integration)
  async getVisits(_landlordId?: string): Promise<VisitRequestItem[]> {
    const res = await http.get<{ data: VisitRequestItem[] }>("/landlord/visits");
    return res.data;
  },
  async updateVisitStatus(
    visitId: string,
    status: "Accepted" | "Rejected" | "Completed" | "Cancelled",
  ): Promise<VisitRequestItem> {
    const res = await http.patch<{ data: VisitRequestItem }>(
      `/landlord/visits/${encodeURIComponent(visitId)}/status`,
      { status: status.toLowerCase() },
    );
    return res.data;
  },

  // Messaging delegated to mock
  getConversations: (id) => mockLandlordApi.getConversations(id),
  sendMessage: (cId, sId, sName, text) => mockLandlordApi.sendMessage(cId, sId, sName, text),
};

const mockLandlordWithImages: LandlordApi = {
  ...mockLandlordApi,
  async uploadImage(_propertyId: string, image: File | string) {
    const url = typeof image === "string" ? image : URL.createObjectURL(image);
    return {
      id: `img-${Date.now()}`,
      imageUrl: url,
      isFeatured: false,
      displayOrder: 1,
    };
  },
  async deleteImage() {},
  async reorderImages() {
    return { status: 200, message: "Images reordered successfully." };
  },
};

export const landlordApi: LandlordApi = USE_MOCK ? mockLandlordWithImages : realLandlordApi;
