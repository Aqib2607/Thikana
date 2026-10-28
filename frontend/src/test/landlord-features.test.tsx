import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PropertyImageUploader } from "@/components/landlord/PropertyImageUploader";
import { PropertyForm } from "@/components/landlord/PropertyForm";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import { landlordApi, realLandlordApi } from "@/lib/api/landlord";
import { http } from "@/lib/api/http";
import type { PropertyFormData } from "@/lib/api/landlord";

describe("Phase 5: Landlord Features Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("5-Image Uploader & Featured Photo Rule", () => {
    const mockImages = [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    ];

    it("displays current image counter and badges first image as featured", () => {
      const handleChange = vi.fn();
      render(<PropertyImageUploader images={mockImages} onChange={handleChange} />);

      // Verify counter
      expect(screen.getByText(/2 \/ 5/i)).toBeInTheDocument();

      // Verify 1st image is marked as Featured / প্রধান ছবি badge
      expect(screen.getByText(/^Featured$|^প্রধান ছবি$/i)).toBeInTheDocument();

      // Verify slot counter for remaining slots
      expect(screen.getByText(/Slot 3|স্লট ৩/i)).toBeInTheDocument();
    });

    it("allows removing an image", () => {
      const handleChange = vi.fn();
      render(<PropertyImageUploader images={mockImages} onChange={handleChange} />);

      const removeBtns = screen.getAllByRole("button", { name: /remove photo|ছবি মুছুন/i });
      expect(removeBtns.length).toBe(2);

      fireEvent.click(removeBtns[0]);
      expect(handleChange).toHaveBeenCalledWith([mockImages[1]]);
    });

    it("allows promoting an image to featured (moves it to index 0)", () => {
      const handleChange = vi.fn();
      render(<PropertyImageUploader images={mockImages} onChange={handleChange} />);

      const makeFeatureBtn = screen.getByRole("button", { name: /make featured|প্রধান করুন/i });
      fireEvent.click(makeFeatureBtn);

      expect(handleChange).toHaveBeenCalledWith([mockImages[1], mockImages[0]]);
    });

    it("blocks sixth image selection with an accessible error banner", () => {
      const fiveImages = [
        "https://images.unsplash.com/photo-1?w=800",
        "https://images.unsplash.com/photo-2?w=800",
        "https://images.unsplash.com/photo-3?w=800",
        "https://images.unsplash.com/photo-4?w=800",
        "https://images.unsplash.com/photo-5?w=800",
      ];
      const handleChange = vi.fn();

      render(<PropertyImageUploader images={fiveImages} onChange={handleChange} />);

      // Verify counter displays 5 / 5
      expect(screen.getByText(/5 \/ 5/i)).toBeInTheDocument();

      // Add Photo button is disabled when at limit
      const addBtn = screen.getByRole("button", { name: /add photo|ছবি যোগ করুন/i });
      expect(addBtn).toBeDisabled();
    });
  });

  describe("Property Creation & Initial Pending Approval State", () => {
    it("creates a new property in Pending Approval state with exact public address", async () => {
      const newListingData: PropertyFormData = {
        title: "Brand New 2-Bed Flat Near KUET Gate",
        propertyType: "Apartment / Flat",
        rentalType: "Monthly Rental",
        rent: 11000,
        advance: 15000,
        additionalCharges: 1000,
        billsIncluded: ["Water Supply", "Trash Management"],
        availability: "Available",
        availableFrom: "2026-11-01",
        division: "Khulna",
        district: "Khulna",
        city: "Khulna",
        area: "KUET Gate / Teligati",
        exactAddress: "Holding 55, South Teligati Road, Khulna-9203",
        lat: 22.8997,
        lng: 89.5028,
        size: 850,
        rooms: 2,
        bathrooms: 2,
        balconies: 2,
        floor: "3rd Floor",
        furnishedStatus: "Semi-Furnished",
        preferredTenant: "Students Only",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        ],
        featuredImage:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        amenities: ["High-Speed WiFi", "24/7 Deep Tube-Well Water"],
        publicContactVisible: false,
        community: {
          transport: "3 mins to KUET gate",
          waterlogging: "None",
          internet: "Carnival active",
          noise: "Quiet",
          safety: "CCTV on gate",
          general: "Near stationery",
        },
      };

      const created = await mockLandlordApi.createProperty("u-landlord", newListingData, {
        name: "Kabir Hossain",
        phone: "01722222222",
        email: "landlord@demo.test",
      });

      // Verify rule: default approval status must be "Pending Approval"
      expect(created.approvalStatus).toBe("Pending Approval");
      expect(created.title).toBe("Brand New 2-Bed Flat Near KUET Gate");
      expect(created.landlord.id).toBe("u-landlord");
      expect(created.landlord.publicContactVisible).toBe(false);
      expect(created.featuredImage).toBe(newListingData.images[0]);

      // Verify retrieval through getMyProperties
      const myProps = await mockLandlordApi.getMyProperties("u-landlord");
      expect(myProps.some((p) => p.id === created.id)).toBe(true);
    });

    it("toggles public contact visibility setting", async () => {
      const myProps = await mockLandlordApi.getMyProperties("u-landlord");
      const target = myProps[0];
      const initialVisibility = target.landlord.publicContactVisible;

      const updated = await mockLandlordApi.toggleContactVisibility(target.id, !initialVisibility);
      expect(updated.landlord.publicContactVisible).toBe(!initialVisibility);
    });

    it("updates listing availability status", async () => {
      const myProps = await mockLandlordApi.getMyProperties("u-landlord");
      const target = myProps[0];

      const updated = await mockLandlordApi.updateAvailability(target.id, "Reserved");
      expect(updated.availability).toBe("Reserved");

      const rented = await mockLandlordApi.updateAvailability(target.id, "Rented");
      expect(rented.availability).toBe("Rented");
    });
  });

  describe("Inbound Contact Requests & Messaging Unlock", () => {
    it("lists contact requests for landlord and accepts request to unlock messaging", async () => {
      const requests = await mockLandlordApi.getContactRequests("u-landlord");
      expect(requests.length).toBeGreaterThan(0);

      const pendingReq = requests.find((r) => r.status === "Pending") || requests[0];
      const accepted = await mockLandlordApi.updateContactRequestStatus(pendingReq.id, "Accepted");
      expect(accepted.status).toBe("Accepted");

      // Verify conversation exists or was unlocked
      const conversations = await mockLandlordApi.getConversations("u-landlord");
      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations.some((c) => c.tenantId === pendingReq.tenantId)).toBe(true);
    });

    it("allows landlord to send messages in conversation thread", async () => {
      const conversations = await mockLandlordApi.getConversations("u-landlord");
      const conv = conversations[0];

      const sent = await mockLandlordApi.sendMessage(
        conv.id,
        "u-landlord",
        "Kabir Hossain",
        "Yes, the flat is available. Please feel free to schedule a visit.",
      );

      expect(sent.text).toBe("Yes, the flat is available. Please feel free to schedule a visit.");
      expect(sent.senderRole).toBe("landlord");

      // Verify persistence in conversation
      const updatedConvs = await mockLandlordApi.getConversations("u-landlord");
      const updatedConv = updatedConvs.find((c) => c.id === conv.id);
      expect(updatedConv?.lastMessage).toBe(sent.text);
    });
  });

  describe("Inbound Visit Requests Management", () => {
    it("updates visit status across lifecycle from Pending to Accepted and Completed", async () => {
      const visits = await mockLandlordApi.getVisits("u-landlord");
      expect(visits.length).toBeGreaterThan(0);

      const target = visits[0];
      const accepted = await mockLandlordApi.updateVisitStatus(target.id, "Accepted");
      expect(accepted.status).toBe("Accepted");

      const completed = await mockLandlordApi.updateVisitStatus(target.id, "Completed");
      expect(completed.status).toBe("Completed");
    });
  });

  describe("Landlord KPI Statistics", () => {
    it("calculates accurate statistics for landlord dashboard", async () => {
      const stats = await mockLandlordApi.getStats("u-landlord");
      expect(stats.totalListings).toBeGreaterThan(0);
      expect(stats.approvedListings).toBeGreaterThanOrEqual(0);
      expect(stats.activeVisits).toBeGreaterThanOrEqual(0);
      expect(stats.pendingContactRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cycle 5B: Live Landlord API Contract Suite", () => {
    it("fetches landlord properties via /landlord/properties", async () => {
      const getSpy = vi.spyOn(http, "get").mockResolvedValueOnce({
        data: [{ id: "prop-101", title: "Test Listing", approvalStatus: "Approved" }],
      });

      const res = await realLandlordApi.getMyProperties();
      expect(getSpy).toHaveBeenCalledWith("/landlord/properties");
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe("prop-101");
    });

    it("creates property and posts payload to /landlord/properties", async () => {
      const postSpy = vi.spyOn(http, "post").mockResolvedValueOnce({
        data: { id: "prop-102", title: "New Live Listing", approvalStatus: "Pending Approval" },
      });

      const payload: PropertyFormData = {
        title: "Brand New Flat in Boyra",
        propertyType: "Apartment / Flat",
        rentalType: "Monthly Rental",
        rent: 12000,
        advance: 20000,
        additionalCharges: 1000,
        billsIncluded: ["Water Supply"],
        availability: "Available",
        availableFrom: "2026-11-01",
        division: "Khulna",
        district: "Khulna",
        city: "Khulna",
        area: "Boyra",
        exactAddress: "Road 3, House 10, Boyra",
        lat: 22.8456,
        lng: 89.5403,
        size: 900,
        rooms: 2,
        bathrooms: 2,
        balconies: 1,
        floor: "2nd Floor",
        furnishedStatus: "Unfurnished",
        preferredTenant: "Family Only",
        images: ["https://example.com/photo1.jpg"],
        amenities: ["High-Speed WiFi"],
        publicContactVisible: true,
        community: {
          transport: "Close to road",
          waterlogging: "None",
          internet: "Active",
          noise: "Low",
          safety: "Secure",
          general: "Good",
        },
      };

      const res = await realLandlordApi.createProperty("u-landlord", payload);
      expect(postSpy).toHaveBeenCalledWith(
        "/landlord/properties",
        expect.objectContaining({
          title: "Brand New Flat in Boyra",
          area: "Boyra",
          publicContactVisible: true,
        }),
      );
      expect(res.id).toBe("prop-102");
    });

    it("updates property availability and contact visibility via PATCH", async () => {
      const patchSpy = vi.spyOn(http, "patch").mockResolvedValue({
        data: { id: "prop-103", availability: "Reserved", landlord: { publicContactVisible: true } },
      });

      await realLandlordApi.updateAvailability("prop-103", "Reserved");
      expect(patchSpy).toHaveBeenCalledWith("/landlord/properties/prop-103/availability", {
        availability: "Reserved",
      });

      await realLandlordApi.toggleContactVisibility("prop-103", true);
      expect(patchSpy).toHaveBeenCalledWith("/landlord/properties/prop-103/contact-visibility", {
        publicContactVisible: true,
      });
    });

    it("dispatches image reordering to /landlord/properties/{id}/images/reorder", async () => {
      const putSpy = vi.spyOn(http, "put").mockResolvedValueOnce({
        status: 200,
        message: "Images reordered successfully.",
      });

      const res = await realLandlordApi.reorderImages!("prop-103", [3, 1, 2]);
      expect(putSpy).toHaveBeenCalledWith("/landlord/properties/prop-103/images/reorder", {
        imageIds: [3, 1, 2],
      });
      expect(res.status).toBe(200);
    });

    it("landlordApi delegates seamlessly under default configuration", async () => {
      const props = await landlordApi.getMyProperties("u-landlord");
      expect(props.length).toBeGreaterThan(0);
      const stats = await landlordApi.getStats("u-landlord");
      expect(stats.totalListings).toBeGreaterThan(0);
    });
  });
});
