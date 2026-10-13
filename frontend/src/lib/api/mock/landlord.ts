import type { LandlordApi, PropertyFormData, LandlordStats } from "../landlord";
import type { PropertyItem, AvailabilityStatus } from "../properties";
import type {
  VisitRequestItem,
  ContactRequestItem,
  ConversationItem,
  MessageItem,
  VisitStatus,
} from "../tenant";
import { MOCK_PROPERTIES } from "./properties";

const STORAGE_KEYS = {
  CUSTOM_PROPERTIES: "thikana.properties.custom",
  VISITS: "thikana.tenant.visits",
  CONTACT_REQUESTS: "thikana.contact_requests",
  CONVERSATIONS: "thikana.conversations",
};

// Seed an initial pending property for u-landlord to demonstrate review workflow
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

function getCustomProperties(): PropertyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROPERTIES);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage issues in test/SSR
  }
  return [SEED_PENDING_PROPERTY];
}

function saveCustomProperties(props: PropertyItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROPERTIES, JSON.stringify(props));
    window.dispatchEvent(new Event("thikana.properties.updated"));
  } catch {
    // Ignore
  }
}

export const mockLandlordApi: LandlordApi = {
  async getMyProperties(landlordId: string): Promise<PropertyItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    const custom = getCustomProperties();
    // In mock data, prop-kuet-01 and prop-sonadanga-03 belong to u-landlord
    const seeded = MOCK_PROPERTIES.filter(
      (p) =>
        p.landlord.id === landlordId ||
        (landlordId === "u-landlord" && (p.id === "prop-kuet-01" || p.id === "prop-sonadanga-03")),
    ).map((p) => ({
      ...p,
      approvalStatus: p.approvalStatus || "Approved",
    }));

    // Merge custom properties created by this landlord
    const myCustom = custom.filter((p) => p.landlord.id === landlordId);

    // Overwrite seeded with any modified custom copy if ID matches
    const customMap = new Map(myCustom.map((c) => [c.id, c]));
    const merged = seeded.map((s) => customMap.get(s.id) || s);

    // Add new custom properties not in seeded
    for (const c of myCustom) {
      if (!seeded.some((s) => s.id === c.id)) {
        merged.unshift(c);
      }
    }

    return merged;
  },

  async getPropertyById(id: string): Promise<PropertyItem | null> {
    await new Promise((r) => setTimeout(r, 40));
    const custom = getCustomProperties();
    const foundCustom = custom.find((p) => p.id === id);
    if (foundCustom) return foundCustom;

    const foundSeeded = MOCK_PROPERTIES.find((p) => p.id === id);
    if (foundSeeded) {
      return {
        ...foundSeeded,
        approvalStatus: foundSeeded.approvalStatus || "Approved",
      };
    }
    return null;
  },

  async createProperty(
    landlordId: string,
    data: PropertyFormData,
    landlordProfile: { name: string; phone?: string; email?: string },
  ): Promise<PropertyItem> {
    await new Promise((r) => setTimeout(r, 80));

    const id = `prop-${Date.now()}`;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newProperty: PropertyItem = {
      id,
      title: data.title,
      banglaTitle: data.banglaTitle,
      slug,
      propertyType: data.propertyType,
      rentalType: data.rentalType,
      rent: data.rent,
      advance: data.advance,
      additionalCharges: data.additionalCharges,
      billsIncluded: data.billsIncluded,
      availability: data.availability,
      availableFrom: data.availableFrom,
      // Default to "Pending Approval" per master prompt specification
      approvalStatus: "Pending Approval",
      division: data.division || "Khulna",
      district: data.district || "Khulna",
      city: data.city || "Khulna",
      area: data.area,
      exactAddress: data.exactAddress,
      lat: data.lat || 22.8456,
      lng: data.lng || 89.5403,
      size: data.size,
      rooms: data.rooms,
      bathrooms: data.bathrooms,
      balconies: data.balconies,
      floor: data.floor,
      totalFloors: data.totalFloors,
      furnishedStatus: data.furnishedStatus,
      preferredTenant: data.preferredTenant,
      images: data.images,
      featuredImage: data.featuredImage || data.images[0],
      amenities: data.amenities,
      verifications: [],
      community: {
        transport: data.community.transport || "",
        waterlogging: data.community.waterlogging || "",
        internet: data.community.internet || "",
        noise: data.community.noise || "",
        safety: data.community.safety || "",
        general: data.community.general || "",
      },
      landlord: {
        id: landlordId,
        name: landlordProfile.name,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        memberSince: "October 2026",
        publicContactVisible: data.publicContactVisible,
        phone: landlordProfile.phone || "01722222222",
        email: landlordProfile.email || "landlord@demo.test",
        verified: true,
      },
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentCustom = getCustomProperties();
    saveCustomProperties([newProperty, ...currentCustom]);
    return newProperty;
  },

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<PropertyItem> {
    await new Promise((r) => setTimeout(r, 60));
    const current = await this.getPropertyById(id);
    if (!current) throw new Error("Property not found");

    const updated: PropertyItem = {
      ...current,
      ...data,
      community: {
        ...current.community,
        ...(data.community || {}),
      },
      landlord: {
        ...current.landlord,
        publicContactVisible:
          data.publicContactVisible !== undefined
            ? data.publicContactVisible
            : current.landlord.publicContactVisible,
      },
      updatedAt: new Date().toISOString(),
    };

    const custom = getCustomProperties();
    const filtered = custom.filter((p) => p.id !== id);
    saveCustomProperties([updated, ...filtered]);
    return updated;
  },

  async updateAvailability(id: string, availability: AvailabilityStatus): Promise<PropertyItem> {
    const prop = await this.getPropertyById(id);
    if (!prop) throw new Error("Property not found");
    const updated: PropertyItem = {
      ...prop,
      availability,
      updatedAt: new Date().toISOString(),
    };
    const custom = getCustomProperties();
    const filtered = custom.filter((p) => p.id !== id);
    saveCustomProperties([updated, ...filtered]);
    return updated;
  },

  async toggleContactVisibility(id: string, visible: boolean): Promise<PropertyItem> {
    const prop = await this.getPropertyById(id);
    if (!prop) throw new Error("Property not found");
    const updated: PropertyItem = {
      ...prop,
      landlord: {
        ...prop.landlord,
        publicContactVisible: visible,
      },
      updatedAt: new Date().toISOString(),
    };
    const custom = getCustomProperties();
    const filtered = custom.filter((p) => p.id !== id);
    saveCustomProperties([updated, ...filtered]);
    return updated;
  },

  async deactivateProperty(id: string): Promise<PropertyItem> {
    return this.updateAvailability(id, "Temporarily Unavailable");
  },

  async deleteProperty(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 40));
    const custom = getCustomProperties();
    const filtered = custom.filter((p) => p.id !== id);
    saveCustomProperties(filtered);
  },

  async getStats(landlordId: string): Promise<LandlordStats> {
    const props = await this.getMyProperties(landlordId);
    const visits = await this.getVisits(landlordId);
    const contactReqs = await this.getContactRequests(landlordId);

    return {
      totalListings: props.length,
      approvedListings: props.filter((p) => p.approvalStatus === "Approved").length,
      pendingListings: props.filter((p) => p.approvalStatus === "Pending Approval").length,
      activeVisits: visits.filter((v) => v.status === "Pending" || v.status === "Accepted").length,
      pendingContactRequests: contactReqs.filter((c) => c.status === "Pending").length,
    };
  },

  // Contact Requests (Inbound)
  async getContactRequests(landlordId: string): Promise<ContactRequestItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_REQUESTS);
      if (raw) {
        const parsed: ContactRequestItem[] = JSON.parse(raw);
        return parsed.filter((r) => r.landlordId === landlordId);
      }
    } catch {
      // Ignore
    }
    // Default seed
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
      {
        id: "cr-2",
        propertyId: "prop-kuet-01",
        propertyTitle: "Quiet 2-Bed Flat Near KUET Main Gate",
        landlordId: "u-landlord",
        landlordName: "Kabir Hossain",
        tenantId: "t-tanvir",
        tenantName: "Tanvir Ahmed",
        tenantPhone: "01855555555",
        message: "Assalamu Alaikum. Is this flat suitable for 4 2nd-year CSE students?",
        status: "Pending",
        createdAt: "2026-10-13T09:30:00Z",
      },
    ];
  },

  async updateContactRequestStatus(
    requestId: string,
    status: "Accepted" | "Rejected",
  ): Promise<ContactRequestItem> {
    let requests: ContactRequestItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_REQUESTS);
      requests = raw ? JSON.parse(raw) : await this.getContactRequests("u-landlord");
    } catch {
      requests = await this.getContactRequests("u-landlord");
    }

    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error("Contact request not found");
    target.status = status;
    localStorage.setItem(STORAGE_KEYS.CONTACT_REQUESTS, JSON.stringify(requests));

    // If accepted, unlock / create conversation between landlord and tenant
    if (status === "Accepted") {
      try {
        const rawConv = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        const conversations: ConversationItem[] = rawConv ? JSON.parse(rawConv) : [];
        const existingConv = conversations.find(
          (c) => c.tenantId === target.tenantId && c.propertyId === target.propertyId,
        );

        if (!existingConv) {
          const newConv: ConversationItem = {
            id: `conv-${Date.now()}`,
            propertyId: target.propertyId,
            propertyTitle: target.propertyTitle,
            landlordId: target.landlordId,
            landlordName: target.landlordName,
            tenantId: target.tenantId,
            tenantName: target.tenantName,
            lastMessage: target.message,
            lastMessageAt: new Date().toISOString(),
            messages: [
              {
                id: `m-${Date.now()}`,
                conversationId: `conv-${Date.now()}`,
                senderId: target.tenantId,
                senderName: target.tenantName,
                senderRole: "tenant",
                text: target.message,
                createdAt: target.createdAt,
              },
            ],
          };
          conversations.push(newConv);
          localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
          window.dispatchEvent(new Event("thikana.conversations.updated"));
        }
      } catch {
        // Ignore
      }
    }

    window.dispatchEvent(new Event("thikana.contact_requests.updated"));
    return target;
  },

  // Visits (Inbound)
  async getVisits(landlordId: string): Promise<VisitRequestItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
      if (raw) {
        const parsed: VisitRequestItem[] = JSON.parse(raw);
        return parsed.filter((v) => v.landlordId === landlordId);
      }
    } catch {
      // Ignore
    }
    // Default seed
    return [
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
        id: "visit-landlord-pending",
        propertyId: "prop-kuet-01",
        propertyTitle: "Quiet 2-Bed Flat Near KUET Main Gate",
        propertyArea: "KUET Gate / Teligati",
        propertyRent: 9500,
        propertyImage:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
        landlordName: "Kabir Hossain",
        landlordId: "u-landlord",
        visitDate: "2026-10-25",
        visitTimeSlot: "Afternoon (02:00 PM - 04:00 PM)",
        note: "Checking for family relocation.",
        status: "Pending",
        createdAt: "2026-10-13T10:15:00Z",
        updatedAt: "2026-10-13T10:15:00Z",
      },
    ];
  },

  async updateVisitStatus(visitId: string, status: VisitStatus): Promise<VisitRequestItem> {
    let visits: VisitRequestItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
      visits = raw ? JSON.parse(raw) : await this.getVisits("u-landlord");
    } catch {
      visits = await this.getVisits("u-landlord");
    }

    const target = visits.find((v) => v.id === visitId);
    if (!target) throw new Error("Visit request not found");
    target.status = status;
    target.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    window.dispatchEvent(new Event("thikana.visits.updated"));
    return target;
  },

  // Messaging
  async getConversations(landlordId: string): Promise<ConversationItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (raw) {
        const parsed: ConversationItem[] = JSON.parse(raw);
        return parsed.filter((c) => c.landlordId === landlordId);
      }
    } catch {
      // Ignore
    }
    // Default seed
    return [
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
            text: "Walaikum Assalam. Yes, it will be available from November 1st.",
            createdAt: "2026-10-11T11:30:00Z",
          },
          {
            id: "m-3",
            conversationId: "conv-1",
            senderId: "u-tenant",
            senderName: "Arif Khan",
            senderRole: "tenant",
            text: "Can I come for a quick visit this weekend?",
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
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    text: string,
  ): Promise<MessageItem> {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const conversations: ConversationItem[] = raw
      ? JSON.parse(raw)
      : await this.getConversations("u-landlord");

    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error("Conversation not found");

    const newMessage: MessageItem = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId,
      senderName,
      senderRole: "landlord",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(newMessage);
    conv.lastMessage = newMessage.text;
    conv.lastMessageAt = newMessage.createdAt;

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    window.dispatchEvent(new Event("thikana.conversations.updated"));
    return newMessage;
  },
};
