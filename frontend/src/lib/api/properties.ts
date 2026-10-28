import { z } from "zod";
import { http } from "./http";
import { USE_MOCK } from "./client";
import { mockProperties, KHULNA_AREAS, ALL_AMENITIES } from "./mock/properties";

export const PROPERTY_TYPES = [
  "Apartment / Flat",
  "House",
  "Room",
  "Sublet",
  "Hostel",
  "Mess",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const RENTAL_TYPES = ["Monthly Rental", "Sublet"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];

export const AVAILABILITY_STATUSES = [
  "Available",
  "Reserved",
  "Rented",
  "Temporarily Unavailable",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const APPROVAL_STATUSES = ["Pending Approval", "Approved", "Rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const VERIFICATION_STATES = [
  "Owner Identity Verified",
  "Phone Verified",
  "Availability Verified",
  "Documents Verified",
] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const FURNISHED_STATUSES = ["Furnished", "Semi-Furnished", "Unfurnished"] as const;
export type FurnishedStatus = (typeof FURNISHED_STATUSES)[number];

export const TENANT_PREFERENCES = [
  "Any",
  "Students Only",
  "Male Students Only",
  "Female Students Only",
  "Family Only",
  "Job Holders",
] as const;
export type TenantPreference = (typeof TENANT_PREFERENCES)[number];

export interface CommunityInfo {
  transport: string;
  waterlogging: string;
  internet: string;
  noise: string;
  safety: string;
  general: string;
}

export interface MatchBreakdown {
  overallPercentage: number;
  locationScore: number; // Max 30
  budgetScore: number; // Max 25
  propertyTypeScore: number; // Max 15
  roomsAndBathsScore: number; // Max 10
  amenitiesScore: number; // Max 15
  availabilityScore: number; // Max 5
  hasTenantPreferences: boolean;
}

export interface LandlordSummary {
  id: string;
  name: string;
  avatar?: string;
  memberSince: string;
  publicContactVisible: boolean;
  phone?: string;
  email?: string;
  verified: boolean;
}

export interface PropertyItem {
  id: string;
  title: string;
  banglaTitle?: string;
  slug: string;
  propertyType: PropertyType;
  rentalType: RentalType;
  rent: number; // Monthly in BDT
  advance: number; // Security deposit
  additionalCharges: number; // Service/utility estimate
  billsIncluded: string[]; // e.g., ["Water", "Trash"]
  availability: AvailabilityStatus;
  availableFrom: string; // ISO date
  approvalStatus?: ApprovalStatus;

  // Location Hierarchy (Khulna-prioritized)
  division: string;
  district: string;
  city: string;
  area: string;
  exactAddress: string; // Public per specification
  lat: number;
  lng: number;

  // Specs
  size: number; // in sq ft
  rooms: number;
  bathrooms: number;
  balconies: number;
  floor: string;
  totalFloors?: number;
  furnishedStatus: FurnishedStatus;
  preferredTenant: TenantPreference;

  // Images (Max 5, first is featured)
  images: string[];
  featuredImage: string;

  // Amenities & Tags
  amenities: string[];

  // Simulated Verifications
  verifications: VerificationState[];

  // Community Information
  community: CommunityInfo;

  // Landlord
  landlord: LandlordSummary;

  // Reviews Summary
  rating: number; // 0 - 5
  reviewCount: number;

  createdAt: string;
  updatedAt: string;
}

export const PropertyFilterSchema = z.object({
  search: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  rentalType: z.enum(RENTAL_TYPES).optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  rooms: z.number().optional(),
  bathrooms: z.number().optional(),
  furnishedStatus: z.enum(FURNISHED_STATUSES).optional(),
  availability: z.enum(AVAILABILITY_STATUSES).optional(),
  verifiedOnly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "match", "rating"]).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type PropertyFilter = z.infer<typeof PropertyFilterSchema>;

export interface PropertyListResponse {
  data: PropertyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  areas: string[];
}

export type Property = PropertyItem;

export interface PropertyApi {
  list(filter?: PropertyFilter): Promise<PropertyListResponse>;
  getById(idOrSlug: string): Promise<PropertyItem | null>;
  getAreas(): Promise<string[]>;
  getAmenities(): Promise<string[]>;
}

export const realPropertyApi: PropertyApi = {
  async list(filter?: PropertyFilter): Promise<PropertyListResponse> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search) params.set("search", filter.search);
      if (filter.area && filter.area !== "All Areas") params.set("area", filter.area);
      if (filter.propertyType) params.set("propertyType", filter.propertyType);
      if (filter.rentalType) params.set("rentalType", filter.rentalType);
      if (filter.minRent !== undefined) params.set("minRent", String(filter.minRent));
      if (filter.maxRent !== undefined) params.set("maxRent", String(filter.maxRent));
      if (filter.rooms !== undefined) params.set("rooms", String(filter.rooms));
      if (filter.bathrooms !== undefined) params.set("bathrooms", String(filter.bathrooms));
      if (filter.furnishedStatus) params.set("furnishedStatus", filter.furnishedStatus);
      if (filter.availability) params.set("availability", filter.availability);
      if (filter.verifiedOnly) params.set("verifiedOnly", "true");
      if (filter.amenities && filter.amenities.length > 0) {
        filter.amenities.forEach((a) => params.append("amenities[]", a));
      }
      if (filter.sortBy) params.set("sortBy", filter.sortBy);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.limit) params.set("limit", String(filter.limit));
    }
    const query = params.toString();
    const endpoint = query ? `/properties?${query}` : "/properties";
    return http.get<PropertyListResponse>(endpoint);
  },

  async getById(idOrSlug: string): Promise<PropertyItem | null> {
    try {
      const res = await http.get<{ data: PropertyItem }>(`/properties/${encodeURIComponent(idOrSlug)}`);
      return res.data;
    } catch (err: any) {
      if (err?.status === 404) return null;
      throw err;
    }
  },

  async getAreas(): Promise<string[]> {
    const res = await http.get<{ data: string[] }>("/properties/areas");
    return res.data;
  },

  async getAmenities(): Promise<string[]> {
    const res = await http.get<{
      data: Array<{ name: string; bangla_name?: string; icon?: string } | string>;
    }>("/properties/amenities");
    if (!res || !Array.isArray(res.data)) {
      return [];
    }

    return res.data
      .map((item) => (typeof item === "string" ? item : item?.name))
      .filter((name): name is string => typeof name === "string" && name.length > 0);
  },
};

const mockPropertyApi: PropertyApi = {
  ...mockProperties,
  async getAreas(): Promise<string[]> {
    return KHULNA_AREAS.filter((a) => a !== "All Areas");
  },
  async getAmenities(): Promise<string[]> {
    return [...ALL_AMENITIES];
  },
};

export const propertyApi: PropertyApi = USE_MOCK ? mockPropertyApi : realPropertyApi;
