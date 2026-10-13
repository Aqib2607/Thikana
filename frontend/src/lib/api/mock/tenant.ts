import type {
  TenantPreferencesData,
  VisitRequestItem,
  ContactRequestItem,
  ConversationItem,
  MessageItem,
  PropertyReviewItem,
  ListingReportItem,
  VisitStatus,
} from "../tenant";
import { MOCK_PROPERTIES } from "./properties";

const STORAGE_KEYS = {
  PREFS: "thikana.tenant.preferences",
  FAVORITES: "thikana.favorites",
  COMPARISON: "thikana.comparison",
  VISITS: "thikana.tenant.visits",
  CONTACT_REQUESTS: "thikana.contact_requests",
  CONVERSATIONS: "thikana.conversations",
  REVIEWS: "thikana.reviews",
  REPORTS: "thikana.reports",
};

// Seed initial visits
const SEED_VISITS: VisitRequestItem[] = [
  {
    id: "visit-1",
    propertyId: "prop-kuet-01",
    propertyTitle: "Quiet 2-Bed Flat Near KUET Main Gate",
    propertyArea: "KUET Gate / Teligati",
    propertyRent: 9500,
    propertyImage:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
    landlordName: "Kabir Hossain",
    landlordId: "u-landlord",
    visitDate: "2026-10-18",
    visitTimeSlot: "Morning (10:00 AM - 12:00 PM)",
    note: "Would like to see the water pressure and balcony orientation.",
    status: "Accepted",
    createdAt: "2026-10-10T09:00:00Z",
    updatedAt: "2026-10-11T14:00:00Z",
  },
  {
    id: "visit-2",
    propertyId: "prop-ku-02",
    propertyTitle: "Attached Bath Single Room in Gallamari Student House",
    propertyArea: "Gallamari / Zero Point (KU)",
    propertyRent: 4200,
    propertyImage:
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80",
    landlordName: "Mustafa Rahman",
    landlordId: "l-gallamari-1",
    visitDate: "2026-10-22",
    visitTimeSlot: "Evening (04:00 PM - 06:00 PM)",
    note: "KU student moving in next semester.",
    status: "Pending",
    createdAt: "2026-10-12T11:00:00Z",
    updatedAt: "2026-10-12T11:00:00Z",
  },
  {
    id: "visit-3",
    propertyId: "prop-boyra-04",
    propertyTitle: "Organized Boyra Mess Sublet with Daily Meal System",
    propertyArea: "Boyra",
    propertyRent: 3200,
    propertyImage:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80",
    landlordName: "Salma Begum",
    landlordId: "l-boyra-fem",
    visitDate: "2026-09-30",
    visitTimeSlot: "Afternoon (02:00 PM - 04:00 PM)",
    note: "Completed visit before final decision.",
    status: "Completed",
    createdAt: "2026-09-25T10:00:00Z",
    updatedAt: "2026-09-30T17:00:00Z",
  },
];

// Seed initial conversation
const SEED_CONVERSATIONS: ConversationItem[] = [
  {
    id: "conv-1",
    propertyId: "prop-kuet-01",
    propertyTitle: "Quiet 2-Bed Flat Near KUET Main Gate",
    landlordId: "u-landlord",
    landlordName: "Kabir Hossain",
    tenantId: "u-tenant",
    tenantName: "Arif Khan",
    lastMessage: "Sure, please visit Sunday morning at 10 AM.",
    lastMessageAt: "2026-10-11T14:02:00Z",
    messages: [
      {
        id: "m-1",
        conversationId: "conv-1",
        senderId: "u-tenant",
        senderName: "Arif Khan",
        senderRole: "tenant",
        text: "Assalamu Alaikum. Is the 2-bed flat still vacant for next month?",
        createdAt: "2026-10-11T10:15:00Z",
      },
      {
        id: "m-2",
        conversationId: "conv-1",
        senderId: "u-landlord",
        senderName: "Kabir Hossain",
        senderRole: "landlord",
        text: "Walaikum Assalam. Yes, the flat is available. The current tenants graduate this month.",
        createdAt: "2026-10-11T12:30:00Z",
      },
      {
        id: "m-3",
        conversationId: "conv-1",
        senderId: "u-tenant",
        senderName: "Arif Khan",
        senderRole: "tenant",
        text: "Can I inspect the room this Sunday?",
        createdAt: "2026-10-11T13:45:00Z",
      },
      {
        id: "m-4",
        conversationId: "conv-1",
        senderId: "u-landlord",
        senderName: "Kabir Hossain",
        senderRole: "landlord",
        text: "Sure, please visit Sunday morning at 10 AM.",
        createdAt: "2026-10-11T14:02:00Z",
      },
    ],
  },
];

export const mockTenantApi = {
  // Preferences
  async getPreferences(): Promise<TenantPreferencesData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return {
      preferredArea: "KUET Gate / Teligati",
      maxBudget: 10000,
      preferredPropertyType: "Apartment / Flat",
      minRooms: 2,
      requiredAmenities: ["High-Speed WiFi", "24/7 Deep Tube-Well Water"],
      preferredFurnished: "Semi-Furnished",
    };
  },

  async savePreferences(data: TenantPreferencesData): Promise<TenantPreferencesData> {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(data));
      window.dispatchEvent(new Event("thikana.preferences.updated"));
    } catch {
      // Ignore
    }
    return data;
  },

  // Visits
  async getVisits(): Promise<VisitRequestItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return SEED_VISITS;
  },

  async createVisit(data: {
    propertyId: string;
    visitDate: string;
    visitTimeSlot: string;
    note?: string;
  }): Promise<VisitRequestItem> {
    const prop = MOCK_PROPERTIES.find((p) => p.id === data.propertyId);
    if (!prop) throw new Error("Property not found");

    const newVisit: VisitRequestItem = {
      id: `visit-${Date.now()}`,
      propertyId: prop.id,
      propertyTitle: prop.title,
      propertyArea: prop.area,
      propertyRent: prop.rent,
      propertyImage: prop.featuredImage,
      landlordName: prop.landlord.name,
      landlordId: prop.landlord.id,
      visitDate: data.visitDate,
      visitTimeSlot: data.visitTimeSlot,
      note: data.note,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = await this.getVisits();
    const updated = [newVisit, ...current];
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updated));
    return newVisit;
  },

  async cancelVisit(visitId: string): Promise<VisitRequestItem> {
    const current = await this.getVisits();
    const target = current.find((v) => v.id === visitId);
    if (!target) throw new Error("Visit not found");
    target.status = "Cancelled";
    target.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(current));
    return target;
  },

  // Contact Requests (Rule: Contact Request before messaging)
  async getContactRequests(): Promise<ContactRequestItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_REQUESTS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [
      {
        id: "cr-1",
        propertyId: "prop-kuet-01",
        propertyTitle: "Quiet 2-Bed Flat Near KUET Main Gate",
        landlordId: "u-landlord",
        landlordName: "Kabir Hossain",
        tenantId: "u-tenant",
        tenantName: "Arif Khan",
        tenantPhone: "01711111111",
        message: "Hello, I am interested in renting this flat from November 1st.",
        status: "Accepted",
        createdAt: "2026-10-10T10:00:00Z",
      },
    ];
  },

  async sendContactRequest(data: {
    propertyId: string;
    message: string;
  }): Promise<ContactRequestItem> {
    const prop = MOCK_PROPERTIES.find((p) => p.id === data.propertyId);
    if (!prop) throw new Error("Property not found");

    const newReq: ContactRequestItem = {
      id: `cr-${Date.now()}`,
      propertyId: prop.id,
      propertyTitle: prop.title,
      landlordId: prop.landlord.id,
      landlordName: prop.landlord.name,
      tenantId: "u-tenant",
      tenantName: "Arif Khan",
      tenantPhone: "01711111111",
      message: data.message,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const current = await this.getContactRequests();
    const updated = [newReq, ...current];
    localStorage.setItem(STORAGE_KEYS.CONTACT_REQUESTS, JSON.stringify(updated));
    return newReq;
  },

  // Messaging (Conversations unlocked only after contact request approval)
  async getConversations(): Promise<ConversationItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return SEED_CONVERSATIONS;
  },

  async sendMessage(conversationId: string, text: string): Promise<MessageItem> {
    const convs = await this.getConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) throw new Error("Conversation not found");

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: "u-tenant",
      senderName: "Arif Khan",
      senderRole: "tenant",
      text,
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(newMsg);
    conv.lastMessage = text;
    conv.lastMessageAt = newMsg.createdAt;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    return newMsg;
  },

  // Comparison (Enforce Maximum 3)
  getComparisonIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPARISON);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleComparison(propertyId: string): { success: boolean; list: string[]; error?: string } {
    let list = this.getComparisonIds();
    if (list.includes(propertyId)) {
      list = list.filter((id) => id !== propertyId);
    } else {
      if (list.length >= 3) {
        return {
          success: false,
          list,
          error: "You can compare up to 3 properties at a time.",
        };
      }
      list.push(propertyId);
    }
    localStorage.setItem(STORAGE_KEYS.COMPARISON, JSON.stringify(list));
    window.dispatchEvent(new Event("thikana.comparison.updated"));
    return { success: true, list };
  },

  // Favorites
  getFavoriteIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(propertyId: string): string[] {
    let list = this.getFavoriteIds();
    if (list.includes(propertyId)) {
      list = list.filter((id) => id !== propertyId);
    } else {
      list.push(propertyId);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(list));
    window.dispatchEvent(new Event("thikana.favorites.updated"));
    return list;
  },

  // Reviews
  async getReviews(propertyId: string): Promise<PropertyReviewItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      const all: PropertyReviewItem[] = raw ? JSON.parse(raw) : [];
      return all.filter((r) => r.propertyId === propertyId);
    } catch {
      return [];
    }
  },

  async submitReview(data: {
    propertyId: string;
    accuracyRating: number;
    landlordBehaviorRating: number;
    locationRating: number;
    overallExperienceRating: number;
    comment: string;
  }): Promise<PropertyReviewItem> {
    const visits = await this.getVisits();
    // Eligible if logged in tenant. If they have a completed visit, show "Visited" badge.
    const hasCompletedVisit = visits.some(
      (v) => v.propertyId === data.propertyId && v.status === "Completed",
    );

    const overallRating = Number(
      (
        (data.accuracyRating +
          data.landlordBehaviorRating +
          data.locationRating +
          data.overallExperienceRating) /
        4
      ).toFixed(1),
    );

    const newReview: PropertyReviewItem = {
      id: `rev-${Date.now()}`,
      propertyId: data.propertyId,
      tenantId: "u-tenant",
      tenantName: "Arif Khan",
      visitedVerified: hasCompletedVisit,
      overallRating,
      accuracyRating: data.accuracyRating,
      landlordBehaviorRating: data.landlordBehaviorRating,
      locationRating: data.locationRating,
      overallExperienceRating: data.overallExperienceRating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };

    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const all: PropertyReviewItem[] = raw ? JSON.parse(raw) : [];
    all.push(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(all));
    return newReview;
  },

  // Reports
  async submitReport(data: {
    propertyId: string;
    reason: ListingReportItem["reason"];
    details: string;
  }): Promise<ListingReportItem> {
    const prop = MOCK_PROPERTIES.find((p) => p.id === data.propertyId);
    const newReport: ListingReportItem = {
      id: `rep-${Date.now()}`,
      propertyId: data.propertyId,
      propertyTitle: prop ? prop.title : "Reported Listing",
      reporterId: "u-tenant",
      reason: data.reason,
      details: data.details,
      status: "Pending Review",
      createdAt: new Date().toISOString(),
    };

    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const all: ListingReportItem[] = raw ? JSON.parse(raw) : [];
    all.push(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(all));
    return newReport;
  },
};
