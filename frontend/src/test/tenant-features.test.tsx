import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { mockTenantApi } from "@/lib/api/mock";
import { MOCK_PROPERTIES } from "@/lib/api/mock/properties";
import type { PropertyItem } from "@/lib/api/properties";
import { ComparisonTable } from "@/components/tenant/ComparisonTable";
import { PreferencesForm } from "@/components/tenant/PreferencesForm";
import { VisitRequestModal } from "@/components/tenant/VisitRequestModal";
import { ReviewFormModal } from "@/components/tenant/ReviewFormModal";
import { ReportPropertyModal } from "@/components/tenant/ReportPropertyModal";
import "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
    ...rest
  }: {
    children?: React.ReactNode;
    to?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "#"} className={className} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
  useParams: () => ({ propertyId: "prop-kuet-01" }),
}));

describe("Phase 4: Tenant Features - Comparison, Preferences, Visits & Reviews", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Three-Property Comparison Rules", () => {
    it("enforces maximum 3 properties for comparison", () => {
      // Add first 3
      expect(mockTenantApi.toggleComparison("prop-1").success).toBe(true);
      expect(mockTenantApi.toggleComparison("prop-2").success).toBe(true);
      expect(mockTenantApi.toggleComparison("prop-3").success).toBe(true);

      // Attempt 4th property
      const res = mockTenantApi.toggleComparison("prop-4");
      expect(res.success).toBe(false);
      expect(res.error).toContain("3 properties");
      expect(mockTenantApi.getComparisonIds()).toHaveLength(3);

      // Removing one frees up a slot
      const removeRes = mockTenantApi.toggleComparison("prop-2");
      expect(removeRes.success).toBe(true);
      expect(mockTenantApi.getComparisonIds()).toHaveLength(2);

      // Now adding another succeeds
      const retryRes = mockTenantApi.toggleComparison("prop-4");
      expect(retryRes.success).toBe(true);
      expect(mockTenantApi.getComparisonIds()).toHaveLength(3);
    });

    it("renders ComparisonTable with 14 specification fields", () => {
      const sample = MOCK_PROPERTIES.slice(0, 2);
      const onRemove = vi.fn();

      render(<ComparisonTable properties={sample} onRemove={onRemove} />);

      // Verify header and table caption
      expect(screen.getByRole("table")).toBeInTheDocument();

      // Check key specification rows exist
      expect(screen.getByText(/Monthly Rent|মাসিক ভাড়া/i)).toBeInTheDocument();
      expect(screen.getByText(/Advance Deposit|অগ্রিম জামানত/i)).toBeInTheDocument();
      expect(screen.getByText(/Property Type|প্রপার্টির ধরন/i)).toBeInTheDocument();
      expect(screen.getByText(/Bedrooms|বেডরুম/i)).toBeInTheDocument();
      expect(screen.getByText(/Bathrooms|বাথরুম/i)).toBeInTheDocument();
      expect(screen.getByText(/Size|আয়তন/i)).toBeInTheDocument();
      expect(screen.getByText(/Floor Level|ফ্লোর নম্বর/i)).toBeInTheDocument();
      expect(screen.getByText(/Furnished Status|আসবাবপত্র/i)).toBeInTheDocument();
      expect(screen.getByText(/Key Amenities|সুযোগ-সুবিধাসমূহ/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Availability|প্রাপ্যতা/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Verification Status|যাচাইকরণ স্ট্যাটাস/i)).toBeInTheDocument();
      expect(screen.getByText(/Location & Address|অবস্থান ও ঠিকানা/i)).toBeInTheDocument();
      expect(screen.getByText(/Match Score|ম্যাচিং স্কোর/i)).toBeInTheDocument();
    });

    it("renders empty state in ComparisonTable when no properties selected", () => {
      render(<ComparisonTable properties={[]} onRemove={vi.fn()} />);
      expect(
        screen.getByText(/No properties selected for comparison|কোনো প্রপার্টি নির্বাচন করা হয়নি/i),
      ).toBeInTheDocument();
    });
  });

  describe("Visit Scheduling & Status Transitions", () => {
    it("creates a visit with Pending status", async () => {
      const visit = await mockTenantApi.createVisit({
        propertyId: "prop-kuet-01",
        visitDate: "2026-10-25",
        visitTimeSlot: "Morning (10:00 AM - 12:00 PM)",
        note: "Need to check study desk space",
      });

      expect(visit.id).toBeDefined();
      expect(visit.status).toBe("Pending");
      expect(visit.propertyId).toBe("prop-kuet-01");
      expect(visit.visitTimeSlot).toContain("Morning");

      const all = await mockTenantApi.getVisits();
      expect(all.some((v) => v.id === visit.id)).toBe(true);
    });

    it("cancels a scheduled visit", async () => {
      const visit = await mockTenantApi.createVisit({
        propertyId: "prop-ku-02",
        visitDate: "2026-10-26",
        visitTimeSlot: "Evening (04:00 PM - 06:00 PM)",
      });

      const cancelled = await mockTenantApi.cancelVisit(visit.id);
      expect(cancelled.status).toBe("Cancelled");

      const all = await mockTenantApi.getVisits();
      const target = all.find((v) => v.id === visit.id);
      expect(target?.status).toBe("Cancelled");
    });
  });

  describe("Reviews with Visited Badge Verification", () => {
    it("submits a review and computes average overall rating", async () => {
      const review = await mockTenantApi.submitReview({
        propertyId: "prop-sonadanga-03",
        accuracyRating: 5,
        landlordBehaviorRating: 4,
        locationRating: 5,
        overallExperienceRating: 4,
        comment: "Excellent quiet flat with good natural air circulation.",
      });

      expect(review.id).toBeDefined();
      expect(review.overallRating).toBe(4.5);
      expect(review.visitedVerified).toBe(false); // No prior completed visit
    });

    it("awards visitedVerified badge when tenant has a completed visit", async () => {
      // Seed a completed visit for prop-kuet-01
      const seedVisits = [
        {
          id: "v-completed-test",
          propertyId: "prop-kuet-01",
          propertyTitle: "Quiet 2-Bed Flat",
          propertyArea: "KUET Gate / Teligati",
          propertyRent: 9500,
          propertyImage: "https://example.com/img.jpg",
          landlordName: "Kabir Hossain",
          landlordId: "u-landlord",
          visitDate: "2026-10-01",
          visitTimeSlot: "Morning",
          status: "Completed" as const,
          createdAt: "2026-09-25T10:00:00Z",
          updatedAt: "2026-10-01T12:00:00Z",
        },
      ];
      localStorage.setItem("thikana.tenant.visits", JSON.stringify(seedVisits));

      const review = await mockTenantApi.submitReview({
        propertyId: "prop-kuet-01",
        accuracyRating: 5,
        landlordBehaviorRating: 5,
        locationRating: 5,
        overallExperienceRating: 5,
        comment: "Visited in person, exactly matches photos and description.",
      });

      expect(review.visitedVerified).toBe(true);
    });
  });

  describe("Contact Request & Listing Reports", () => {
    it("sends contact request with Pending status", async () => {
      const req = await mockTenantApi.sendContactRequest({
        propertyId: "prop-kuet-01",
        message: "Assalamu Alaikum, I would like to inquire about rent terms.",
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe("Pending");
      expect(req.propertyId).toBe("prop-kuet-01");

      const all = await mockTenantApi.getContactRequests();
      expect(all.some((r) => r.id === req.id)).toBe(true);
    });

    it("submits a listing report with predefined reason", async () => {
      const rep = await mockTenantApi.submitReport({
        propertyId: "prop-kuet-01",
        reason: "Already rented",
        details: "The landlord told me this flat was already taken yesterday.",
      });

      expect(rep.id).toBeDefined();
      expect(rep.reason).toBe("Already rented");
      expect(rep.status).toBe("Pending Review");
    });
  });

  describe("Tenant Preferences Engine", () => {
    it("saves and retrieves rental preferences", async () => {
      const newPrefs = {
        preferredArea: "Gallamari / Zero Point (KU)",
        maxBudget: 6000,
        preferredPropertyType: "Room",
        minRooms: 1,
        requiredAmenities: ["High-Speed WiFi", "Generator / IPS Backup"],
        preferredFurnished: "Furnished",
      };

      const saved = await mockTenantApi.savePreferences(newPrefs);
      expect(saved.maxBudget).toBe(6000);

      const retrieved = await mockTenantApi.getPreferences();
      expect(retrieved.preferredArea).toBe("Gallamari / Zero Point (KU)");
      expect(retrieved.maxBudget).toBe(6000);
    });
  });
});
