import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mockTenantApi } from "@/lib/api/mock";
import { MOCK_PROPERTIES } from "@/lib/api/mock/properties";
import { propertyApi, type PropertyItem } from "@/lib/api/properties";
import { tenantApi, type TenantPreferencesData } from "@/lib/api/tenant";
import { ComparisonTable } from "@/components/tenant/ComparisonTable";
import { PreferencesForm } from "@/components/tenant/PreferencesForm";
import { TenantDashboard, Route as TenantDashboardRoute } from "@/routes/tenant/dashboard";
import { TenantFavoritesPage } from "@/routes/tenant/favorites";
import { TenantComparisonPage } from "@/routes/tenant/comparison";
import { TenantVisitsPage } from "@/routes/tenant/visits";
import { TenantReviewsPage } from "@/components/tenant/TenantReviewsPage";
import { TenantMessagesPage } from "@/routes/tenant/messages";
import { PropertyCard } from "@/components/property/PropertyCard";
import { VisitRequestModal } from "@/components/tenant/VisitRequestModal";
import { ReviewFormModal } from "@/components/tenant/ReviewFormModal";
import { ReportPropertyModal } from "@/components/tenant/ReportPropertyModal";
import { AuthProvider } from "@/lib/auth";
import "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: Record<string, unknown> = {}) => ({
    ...options,
    path,
    options,
  }),
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
    vi.restoreAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement, customClient?: QueryClient) => {
    const qc = customClient || new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <AuthProvider>{ui}</AuthProvider>
      </QueryClientProvider>,
    );
  };

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

    it("saves and retrieves rental preferences with minBathrooms", async () => {
      const newPrefs = {
        preferredArea: "Gallamari / Zero Point (KU)",
        maxBudget: 6000,
        preferredPropertyType: "Room",
        minRooms: 1,
        minBathrooms: 1,
        requiredAmenities: ["High-Speed WiFi", "Generator / IPS Backup"],
        preferredFurnished: "Furnished",
      };

      const saved = await mockTenantApi.savePreferences(newPrefs);
      expect(saved.maxBudget).toBe(6000);

      const retrieved = await mockTenantApi.getPreferences();
      expect(retrieved.preferredArea).toBe("Gallamari / Zero Point (KU)");
      expect(retrieved.maxBudget).toBe(6000);
    });

    it("renders PreferencesForm with minBathrooms and 7 weights", async () => {
      renderWithClient(<PreferencesForm />);

      expect(screen.getByLabelText(/নূন্যতম বাথরুম|Minimum Bathrooms/i)).toBeInTheDocument();
      expect(screen.getByText(/৭টি মানদণ্ড|7 Weights/i)).toBeInTheDocument();
    });

    it("dismiss hides the banner and preserves legacy preference payload", async () => {
      vi.spyOn(mockTenantApi, "getPreferences").mockResolvedValueOnce({} as TenantPreferencesData);

      localStorage.setItem("thikana.mock.session", "u-tenant");
      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Sonadanga", maxBudget: 15000, minRooms: 3 }),
      );

      const { unmount } = renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
        ).toBeInTheDocument();
      });

      const dismissBtn = screen.getByRole("button", { name: /বাতিল|Dismiss/i });
      fireEvent.click(dismissBtn);

      expect(screen.queryByText(/Legacy local preferences/i)).not.toBeInTheDocument();
      // Payload preserved in localStorage
      expect(localStorage.getItem("thikana.tenant.preferences")).not.toBeNull();
      const payload = JSON.parse(localStorage.getItem("thikana.tenant.preferences")!);
      expect(payload.preferredArea).toBe("Sonadanga");

      // Dismissal state persisted separately for this user
      expect(localStorage.getItem("thikana.legacy_prefs_dismissed.u-tenant")).toBe("true");

      unmount();
    });

    it("dismissal persists across remount and allows recovery", async () => {
      vi.spyOn(mockTenantApi, "getPreferences").mockResolvedValue({} as TenantPreferencesData);

      localStorage.setItem("thikana.mock.session", "u-tenant");
      localStorage.setItem("thikana.legacy_prefs_dismissed.u-tenant", "true");
      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Sonadanga", maxBudget: 15000, minRooms: 3 }),
      );

      const { unmount } = renderWithClient(<PreferencesForm />);

      // Recovery button should be available
      const recoverBtn = await screen.findByRole("button", {
        name: /পর্যালোচনা করুন|Review dismissed/i,
      });
      expect(recoverBtn).toBeInTheDocument();

      // Banner should NOT appear because it was dismissed
      expect(
        screen.queryByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
      ).not.toBeInTheDocument();

      fireEvent.click(recoverBtn);

      // Banner is restored
      expect(
        await screen.findByText(
          /পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i,
        ),
      ).toBeInTheDocument();
      expect(localStorage.getItem("thikana.legacy_prefs_dismissed.u-tenant")).toBeNull();

      unmount();
    });

    it("failed save preserves legacy preference payload", async () => {
      vi.spyOn(mockTenantApi, "getPreferences").mockResolvedValueOnce({} as TenantPreferencesData);
      vi.spyOn(mockTenantApi, "savePreferences").mockRejectedValueOnce(new Error("Server error"));

      localStorage.setItem("thikana.mock.session", "u-tenant");
      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Sonadanga", maxBudget: 15000, minRooms: 3 }),
      );

      renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
        ).toBeInTheDocument();
      });

      // Submit form
      const submitBtn = screen.getByRole("button", {
        name: /পছন্দ.*সংরক্ষণ করুন|Save Preferences/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Server error|Failed to save/i)).toBeInTheDocument();
      });

      // Legacy preferences preserved on failed save
      expect(localStorage.getItem("thikana.tenant.preferences")).not.toBeNull();
    });

    it("successful save removes legacy preference payload", async () => {
      vi.spyOn(mockTenantApi, "getPreferences").mockResolvedValueOnce({} as TenantPreferencesData);
      vi.spyOn(mockTenantApi, "savePreferences").mockResolvedValueOnce({
        preferredArea: "Sonadanga",
        maxBudget: 15000,
        minRooms: 3,
        minBathrooms: 2,
        requiredAmenities: [],
        preferredFurnished: "Any",
        preferredPropertyType: "Family Apartment",
      });

      localStorage.setItem("thikana.mock.session", "u-tenant");
      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Sonadanga", maxBudget: 15000, minRooms: 3 }),
      );

      renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
        ).toBeInTheDocument();
      });

      // Import legacy
      const importBtn = screen.getByRole("button", { name: /ইমপোর্ট করুন|Import/i });
      fireEvent.click(importBtn);

      // Submit form
      const submitBtn = screen.getByRole("button", {
        name: /পছন্দ.*সংরক্ষণ করুন|Save Preferences/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText(/সফলভাবে সংরক্ষিত/i)).toBeInTheDocument();
      });

      // Now and only now removed from localStorage
      expect(localStorage.getItem("thikana.tenant.preferences")).toBeNull();
      expect(localStorage.getItem("thikana.legacy_prefs_dismissed.u-tenant")).toBeNull();
    });

    it("different authenticated accounts do not inherit another account's dismissal state", async () => {
      vi.spyOn(mockTenantApi, "getPreferences").mockResolvedValue({} as TenantPreferencesData);

      // User A dismisses legacy banner
      localStorage.setItem("thikana.mock.session", "u-tenant");
      localStorage.setItem("thikana.legacy_prefs_dismissed.u-tenant", "true");
      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Sonadanga", maxBudget: 15000, minRooms: 3 }),
      );

      // User B logs in
      localStorage.setItem("thikana.mock.session", "u-landlord");

      renderWithClient(<PreferencesForm />);

      // User B should see the banner because u-landlord dismissalKey is not set
      await waitFor(() => {
        expect(
          screen.getByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
        ).toBeInTheDocument();
      });
    });

    it("PropertyCard renders server-provided match score for tenant", async () => {
      const sample: PropertyItem = {
        ...MOCK_PROPERTIES[0],
        match: {
          overallPercentage: 88,
          locationScore: 30,
          budgetScore: 25,
          propertyTypeScore: 15,
          roomsScore: 5,
          bathroomsScore: 4,
          roomsAndBathsScore: 9,
          amenitiesScore: 10,
          availabilityScore: 5,
          hasTenantPreferences: true,
        },
      };

      // Seed authenticated tenant session
      localStorage.setItem("thikana.mock.session", "u-tenant");

      renderWithClient(<PropertyCard property={sample} />);

      await waitFor(() => {
        expect(screen.getByText(/88%|৮৮%/)).toBeInTheDocument();
      });
    });
  });

  describe("PropertyCard Server-Backed Favorite & Comparison Synchronization", () => {
    const sampleProp = MOCK_PROPERTIES[0];
    const matchFavRemove = /Remove from favorites|সংরক্ষিত থেকে সরান/i;
    const matchFavSave = /Save property|সংরক্ষণ করুন/i;
    const matchCompRemove = /Remove from comparison|তুলনা থেকে সরান/i;
    const matchCompAdd = /Add to comparison|তুলনায় যোগ করুন/i;

    it("initializes favorite state from server query cache for authenticated tenant", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], [sampleProp]);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      await waitFor(() => {
        const favBtn = screen.getByRole("button", { name: matchFavRemove });
        expect(favBtn).toBeInTheDocument();
        expect(favBtn).toHaveClass("bg-destructive");
      });
    });

    it("initializes non-favorite state when property is not in server favorites", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      await waitFor(() => {
        const favBtn = screen.getByRole("button", { name: matchFavSave });
        expect(favBtn).toBeInTheDocument();
      });
    });

    it("calls tenantApi.addFavorite when an un-favorited property is clicked by authenticated tenant", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const addSpy = vi.spyOn(tenantApi, "addFavorite").mockResolvedValueOnce(undefined);
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const favBtn = await screen.findByRole("button", { name: matchFavSave });
      fireEvent.click(favBtn);

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(sampleProp.id);
      });
    });

    it("calls tenantApi.removeFavorite when a favorited property is clicked by authenticated tenant", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const removeSpy = vi.spyOn(tenantApi, "removeFavorite").mockResolvedValueOnce(undefined);
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], [sampleProp]);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const favBtn = await screen.findByRole("button", { name: matchFavRemove });
      fireEvent.click(favBtn);

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalledWith(sampleProp.id);
      });
    });

    it("rolls back optimistic favorite state when API call rejects", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.spyOn(tenantApi, "addFavorite").mockRejectedValueOnce(new Error("Network connection error"));
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const favBtn = await screen.findByRole("button", { name: matchFavSave });
      fireEvent.click(favBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      // Query cache should be rolled back to empty array
      const cached = qc.getQueryData<PropertyItem[]>(["favorites"]);
      expect(cached).toEqual([]);
    });

    it("prevents duplicate favorite submissions while mutation is pending", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((res) => {
        resolvePromise = res;
      });
      const addSpy = vi.spyOn(tenantApi, "addFavorite").mockReturnValue(pendingPromise);
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const favBtn = await screen.findByRole("button", { name: matchFavSave });
      await waitFor(() => expect(favBtn).not.toBeDisabled());
      await new Promise((r) => setTimeout(r, 50));

      fireEvent.click(favBtn);
      fireEvent.click(favBtn);
      fireEvent.click(favBtn);

      expect(addSpy).toHaveBeenCalledTimes(1);
      resolvePromise!();
    });

    it("isolates guest favorite state in localStorage without invoking tenant API", async () => {
      localStorage.removeItem("thikana.mock.session");
      const addSpy = vi.spyOn(tenantApi, "addFavorite");
      renderWithClient(<PropertyCard property={sampleProp} />);

      const favBtn = await screen.findByRole("button", { name: matchFavSave });
      fireEvent.click(favBtn);

      expect(addSpy).not.toHaveBeenCalled();
      const saved = JSON.parse(localStorage.getItem("thikana.favorites") || "[]");
      expect(saved).toContain(sampleProp.id);
    });

    it("ensures guest localStorage does not leak into authenticated tenant state", async () => {
      localStorage.setItem("thikana.favorites", JSON.stringify([sampleProp.id]));
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["favorites"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      await waitFor(() => {
        const favBtn = screen.getByRole("button", { name: matchFavSave });
        expect(favBtn).toBeInTheDocument();
      });
    });

    it("initializes comparison state from server query cache for authenticated tenant", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["comparisons"], [
        { id: sampleProp.id, propertyId: sampleProp.id, displayOrder: 1, property: sampleProp },
      ]);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      await waitFor(() => {
        const compBtn = screen.getByRole("button", { name: matchCompRemove });
        expect(compBtn).toBeInTheDocument();
        expect(compBtn).toHaveClass("bg-primary");
      });
    });

    it("calls tenantApi.addComparison when compare button is clicked by authenticated tenant", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      const addSpy = vi
        .spyOn(tenantApi, "addComparison")
        .mockResolvedValueOnce({ id: sampleProp.id, propertyId: sampleProp.id, displayOrder: 1 });
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["comparisons"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const compBtn = await screen.findByRole("button", { name: matchCompAdd });
      fireEvent.click(compBtn);

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(sampleProp.id);
      });
    });

    it("enforces maximum 3 comparison limit for authenticated tenant without calling API", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      vi.spyOn(window, "alert").mockImplementation(() => {});
      const addSpy = vi.spyOn(tenantApi, "addComparison");
      const fourthProp = MOCK_PROPERTIES[3] || { ...sampleProp, id: "prop-fourth" };

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["comparisons"], [
        { id: "1", propertyId: "1", displayOrder: 1, property: MOCK_PROPERTIES[0] },
        { id: "2", propertyId: "2", displayOrder: 2, property: MOCK_PROPERTIES[1] },
        { id: "3", propertyId: "3", displayOrder: 3, property: MOCK_PROPERTIES[2] },
      ]);

      renderWithClient(<PropertyCard property={fourthProp} />, qc);

      const compBtn = await screen.findByRole("button", { name: matchCompAdd });
      await new Promise((r) => setTimeout(r, 50));

      fireEvent.click(compBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
      expect(addSpy).not.toHaveBeenCalled();
    });

    it("rolls back comparison optimistic update when API call fails", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.spyOn(tenantApi, "addComparison").mockRejectedValueOnce(new Error("Server limit exceeded"));
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      qc.setQueryData(["comparisons"], []);

      renderWithClient(<PropertyCard property={sampleProp} />, qc);

      const compBtn = await screen.findByRole("button", { name: matchCompAdd });
      fireEvent.click(compBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      const cached = qc.getQueryData<Array<{ propertyId: string }>>(["comparisons"]);
      expect(cached).toEqual([]);
    });

    it("isolates guest comparison in localStorage without invoking tenant API", async () => {
      localStorage.removeItem("thikana.mock.session");
      const addSpy = vi.spyOn(tenantApi, "addComparison");
      renderWithClient(<PropertyCard property={sampleProp} />);

      const compBtn = await screen.findByRole("button", { name: matchCompAdd });
      fireEvent.click(compBtn);

      expect(addSpy).not.toHaveBeenCalled();
      const saved = JSON.parse(localStorage.getItem("thikana.comparison") || "[]");
      expect(saved).toContain(sampleProp.id);
    });

    it("synchronizes PropertyCard state directly from parent props", async () => {
      renderWithClient(
        <PropertyCard property={sampleProp} isFavorite={true} isCompared={true} />,
      );

      await waitFor(() => {
        const favBtn = screen.getByRole("button", { name: matchFavRemove });
        const compBtn = screen.getByRole("button", { name: matchCompRemove });
        expect(favBtn).toHaveClass("bg-destructive");
        expect(compBtn).toHaveClass("bg-primary");
      });
    });
  });

  describe("Phase 4 Batch 2: Tenant Dashboard Live Stats & Server-Authoritative Preferences", () => {
    beforeEach(() => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
    });
    it("renders API-provided favorites, comparisons, visits and conversations count", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockResolvedValue({
        favoritesCount: 5,
        comparisonCount: 2,
        visitsCount: 3,
        conversationsCount: 4,
        unreadMessagesCount: 1,
        preferences: {
          preferredArea: "Sonadanga",
          maxBudget: 18000,
          preferredPropertyType: "Apartment",
          minRooms: 3,
          minBathrooms: 2,
          requiredAmenities: ["Generator / IPS Backup"],
          hasMeaningfulPreferences: true,
        },
      });

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("2/3")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
      });

      // Saved preferences card is rendered from API response
      expect(screen.getAllByText(/সোনাডাঙ্গা|Sonadanga/i).length).toBeGreaterThanOrEqual(1);
    });

    it("displays loading skeleton during dashboard query pending state", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockImplementation(
        () => new Promise(() => {}), // Pending promise
      );

      const { container } = renderWithClient(<TenantDashboard />);

      // Wait for auth readiness, then skeletons are rendered in statistics cards
      await waitFor(() => {
        const skeletons = container.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThanOrEqual(4);
      });
    });

    it("displays error alert and does not render fabricated zeros when dashboard API fails", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockRejectedValue(new Error("API Failure"));

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(/ড্যাশবোর্ড তথ্য লোড করা যায়নি|Failed to load dashboard statistics/i),
        ).toBeInTheDocument();
      });

      // Does not show false zeros as values
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBe(4);
    });

    it("provides retry functionality when dashboard API request fails", async () => {
      const statsSpy = vi
        .spyOn(tenantApi, "getDashboardStats")
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce({
          favoritesCount: 1,
          comparisonCount: 1,
          visitsCount: 0,
          conversationsCount: 0,
          unreadMessagesCount: 0,
          preferences: null,
        });

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole("button", { name: /পুনরায় চেষ্টা করুন|Retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText("1/3")).toBeInTheDocument();
      });
      expect(statsSpy).toHaveBeenCalledTimes(2);
    });

    it("displays confirmed zero values when tenant has zero records", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockResolvedValue({
        favoritesCount: 0,
        comparisonCount: 0,
        visitsCount: 0,
        conversationsCount: 0,
        unreadMessagesCount: 0,
        preferences: null,
      });

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        const zeroes = screen.getAllByText("0");
        expect(zeroes.length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText("0/3")).toBeInTheDocument();
      });

      // No preferences card rendered when null
      expect(screen.queryByText(/savedPreferences/i)).not.toBeInTheDocument();
    });

    it("renders real summaries for matching properties, recent visits, and conversations", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockResolvedValue({
        favoritesCount: 2,
        comparisonCount: 1,
        visitsCount: 1,
        conversationsCount: 1,
        unreadMessagesCount: 0,
        preferences: {
          preferredArea: "Sonadanga",
          maxBudget: 20000,
          preferredPropertyType: "Apartment",
          minRooms: 2,
          hasMeaningfulPreferences: true,
        },
      });

      vi.spyOn(propertyApi, "list").mockResolvedValue({
        data: [
          {
            ...MOCK_PROPERTIES[0],
            id: "prop-match-1",
            slug: "matching-property-lotus",
            title: "Matching Property Lotus",
            banglaTitle: "Matching Property Lotus",
            rent: 18000,
            area: "Sonadanga",
            propertyType: "Apartment / Flat",
            rentalType: "Monthly Rental",
            rooms: 3,
            bathrooms: 2,
            verified: true,
            available: true,
            matchScore: 92,
            verifications: [],
            images: [],
          } as any,
        ],
        total: 1,
        page: 1,
        limit: 3,
        totalPages: 1,
        areas: ["Sonadanga"],
      });

      vi.spyOn(tenantApi, "getVisits").mockResolvedValue([
        {
          id: "v-1",
          propertyId: "prop-match-1",
          propertyTitle: "Visit Villa Sonadanga",
          propertyArea: "Sonadanga",
          propertyRent: 18000,
          propertyImage: "",
          landlordName: "Karim Ullah",
          landlordId: "l-1",
          visitDate: "2026-11-15",
          visitTimeSlot: "Morning",
          status: "Pending",
          createdAt: "2026-11-08",
          updatedAt: "2026-11-08",
        },
      ]);

      vi.spyOn(tenantApi, "getConversations").mockResolvedValue([
        {
          id: "c-1",
          propertyId: "prop-match-1",
          propertyTitle: "Chat Flat Boyra",
          landlordId: "l-1",
          landlordName: "Karim Ullah",
          tenantId: "u-tenant",
          tenantName: "Tenant User",
          lastMessage: "Hello, when can I visit?",
          lastMessageAt: "2026-11-08T10:00:00Z",
          messages: [],
        },
      ]);

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Matching Property Lotus")).toBeInTheDocument();
        expect(screen.getByText("Visit Villa Sonadanga")).toBeInTheDocument();
        expect(screen.getByText("Chat Flat Boyra")).toBeInTheDocument();
        expect(screen.getAllByText(/Karim Ullah/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/"Hello, when can I visit\?"/i)).toBeInTheDocument();
      });

      // Verify that redundant 6-card navigation articles are not rendered
      expect(screen.queryByText(/Define your preferred area, budget and amenities/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Inspect up to 3 listings side-by-side/i)).not.toBeInTheDocument();
    });

    it("renders truthful empty states when matching properties, visits, and conversations are empty", async () => {
      vi.spyOn(tenantApi, "getDashboardStats").mockResolvedValue({
        favoritesCount: 0,
        comparisonCount: 0,
        visitsCount: 0,
        conversationsCount: 0,
        unreadMessagesCount: 0,
        preferences: null,
      });

      vi.spyOn(propertyApi, "list").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 3,
        totalPages: 0,
        areas: [],
      });

      vi.spyOn(tenantApi, "getVisits").mockResolvedValue([]);
      vi.spyOn(tenantApi, "getConversations").mockResolvedValue([]);

      renderWithClient(<TenantDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/No matching properties found yet|এখনও কোনো ম্যাচিং প্রপার্টি পাওয়া যায়নি/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/No visit requests scheduled yet|এখনও কোনো পরিদর্শনের অনুরোধ নেই/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/No active conversations yet|এখনও কোনো সক্রিয় কথোপকথন নেই/i),
        ).toBeInTheDocument();
      });
    });

    it("loads authenticated tenant preferences directly from server API", async () => {
      const getPrefsSpy = vi.spyOn(tenantApi, "getPreferences").mockResolvedValue({
        preferredArea: "Boyra",
        maxBudget: 12000,
        preferredPropertyType: "Bachelor Room",
        minRooms: 1,
        minBathrooms: 1,
        requiredAmenities: [],
        hasMeaningfulPreferences: true,
      });

      renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(getPrefsSpy).toHaveBeenCalled();
        expect(screen.getByDisplayValue("12000")).toBeInTheDocument();
      });
    });

    it("prioritizes server preferences over legacy localStorage data", async () => {
      vi.spyOn(tenantApi, "getPreferences").mockResolvedValue({
        preferredArea: "Sonadanga",
        maxBudget: 25000,
        minRooms: 3,
        hasMeaningfulPreferences: true,
      });

      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Khalishpur", maxBudget: 5000, minRooms: 1 }),
      );

      renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("25000")).toBeInTheDocument();
      });

      // Server data took priority, legacy banner is NOT shown
      expect(
        screen.queryByText(/পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ|Legacy local preferences/i),
      ).not.toBeInTheDocument();
    });

    it("does not fall back to localStorage if server preference loading rejects", async () => {
      vi.spyOn(tenantApi, "getPreferences").mockRejectedValue(new Error("Server offline"));

      localStorage.setItem(
        "thikana.tenant.preferences",
        JSON.stringify({ preferredArea: "Khalishpur", maxBudget: 5000 }),
      );

      renderWithClient(<PreferencesForm />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Should NOT populate form with localStorage data
      expect(screen.queryByDisplayValue("5000")).not.toBeInTheDocument();
    });
  });

  describe("Workstream B: Favorites and Comparison Live Integrations", () => {
    beforeEach(() => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
    });

    it("TenantFavoritesPage renders server favorites and handles empty state", async () => {
      const getFavSpy = vi.spyOn(tenantApi, "getFavorites").mockResolvedValue([]);
      renderWithClient(<TenantFavoritesPage />);
      await waitFor(() => {
        expect(getFavSpy).toHaveBeenCalled();
        expect(screen.getByText(/কোনো বাসা সংরক্ষিত নেই|No Saved Properties/i)).toBeInTheDocument();
      });
    });

    it("TenantFavoritesPage renders server property cards when data exists", async () => {
      vi.spyOn(tenantApi, "getFavorites").mockResolvedValue([MOCK_PROPERTIES[0]]);
      renderWithClient(<TenantFavoritesPage />);
      await waitFor(() => {
        const titleRegex = new RegExp(`${MOCK_PROPERTIES[0].title}|${MOCK_PROPERTIES[0].banglaTitle || ""}`, "i");
        expect(screen.getAllByText(titleRegex).length).toBeGreaterThanOrEqual(1);
      });
    });

    it("TenantComparisonPage renders comparisons from server and clears list", async () => {
      const getCompSpy = vi.spyOn(tenantApi, "getComparisons").mockResolvedValue([
        { id: "1", propertyId: MOCK_PROPERTIES[0].id, displayOrder: 0, property: MOCK_PROPERTIES[0] },
      ]);
      const clearSpy = vi.spyOn(tenantApi, "clearComparisons").mockResolvedValue(undefined);

      renderWithClient(<TenantComparisonPage />);

      await waitFor(() => {
        expect(getCompSpy).toHaveBeenCalled();
        expect(screen.getByText(/Side-by-Side Property Comparison|পাশাপাশি প্রপার্টি তুলনা/i)).toBeInTheDocument();
      });

      const clearBtn = screen.getByText(/তালিকা খালি করুন|Clear Comparison/i);
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(clearSpy).toHaveBeenCalled();
      });
    });
  });

  describe("Workstream C: Reviews and Visits Live Integrations", () => {
    beforeEach(() => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
    });

    it("TenantReviewsPage renders real tenant reviews with status and ratings", async () => {
      const getRevSpy = vi.spyOn(tenantApi, "getReviews").mockResolvedValue([
        {
          id: "rev-101",
          propertyId: "1",
          tenantId: "u-tenant-1",
          tenantName: "Arif",
          visitedVerified: true,
          overallRating: 4.8,
          accuracyRating: 5,
          landlordBehaviorRating: 5,
          locationRating: 4,
          overallExperienceRating: 5,
          comment: "Authentic living experience during studies.",
          status: "approved",
          createdAt: "2026-11-01T10:00:00.000Z",
        },
      ]);

      renderWithClient(<TenantReviewsPage />);

      await waitFor(() => {
        expect(getRevSpy).toHaveBeenCalled();
        expect(screen.getByText(/Authentic living experience during studies/i)).toBeInTheDocument();
        expect(screen.getByText(/অনুমোদিত|Approved/i)).toBeInTheDocument();
        expect(screen.getByText(/পরিদর্শিত|Visited/i)).toBeInTheDocument();
      });
    });

    it("TenantVisitsPage renders real visits and handles cancellation", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.spyOn(window, "prompt").mockReturnValue("Schedule changed");

      const getVisitsSpy = vi.spyOn(tenantApi, "getVisits").mockResolvedValue([
        {
          id: "vis-1",
          propertyId: "1",
          propertyTitle: "Green Villa Boyra",
          propertyArea: "Boyra",
          propertyRent: 12000,
          propertyImage: "/test.jpg",
          landlordName: "Rafiq",
          landlordId: "l-1",
          visitDate: "2026-12-15",
          visitTimeSlot: "Morning (10:00 AM - 12:00 PM)",
          status: "Pending",
          createdAt: "2026-11-01T10:00:00.000Z",
          updatedAt: "2026-11-01T10:00:00.000Z",
        },
      ]);
      const cancelSpy = vi.spyOn(tenantApi, "cancelVisit").mockResolvedValue({} as any);

      renderWithClient(<TenantVisitsPage />);

      await waitFor(() => {
        expect(getVisitsSpy).toHaveBeenCalled();
        expect(screen.getByText("Green Villa Boyra")).toBeInTheDocument();
      });

      const cancelBtn = screen.getByText(/cancelRequest|অনুরোধ বাতিল/i);
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(cancelSpy).toHaveBeenCalledWith("vis-1", "Schedule changed");
      });
    });
  });

  describe("Workstream D: Messaging and Read Receipts", () => {
    beforeEach(() => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
    });

    it("TenantMessagesPage renders conversation list and sends message", async () => {
      const getConvsSpy = vi.spyOn(tenantApi, "getConversations").mockResolvedValue([
        {
          id: "conv-1",
          propertyId: "1",
          propertyTitle: "Green Villa Boyra",
          landlordId: "l-1",
          landlordName: "Rafiq",
          tenantId: "t-1",
          tenantName: "Arif",
          lastMessage: "Hello tenant",
          lastMessageAt: "2026-11-08T12:00:00.000Z",
          messages: [
            {
              id: "msg-1",
              conversationId: "conv-1",
              senderId: "l-1",
              senderName: "Rafiq",
              senderRole: "landlord",
              text: "Hello tenant",
              createdAt: "2026-11-08T12:00:00.000Z",
            },
          ],
        },
      ]);
      vi.spyOn(tenantApi, "getConversation").mockResolvedValue({
        id: "conv-1",
        propertyId: "1",
        propertyTitle: "Green Villa Boyra",
        landlordId: "l-1",
        landlordName: "Rafiq",
        tenantId: "t-1",
        tenantName: "Arif",
        lastMessage: "Hello tenant",
        lastMessageAt: "2026-11-08T12:00:00.000Z",
        messages: [
          {
            id: "msg-1",
            conversationId: "conv-1",
            senderId: "l-1",
            senderName: "Rafiq",
            senderRole: "landlord",
            text: "Hello tenant",
            createdAt: "2026-11-08T12:00:00.000Z",
          },
        ],
      });
      vi.spyOn(tenantApi, "getContactRequests").mockResolvedValue([]);
      const sendSpy = vi.spyOn(tenantApi, "sendMessage").mockResolvedValue({} as any);

      renderWithClient(<TenantMessagesPage />);

      await waitFor(() => {
        expect(getConvsSpy).toHaveBeenCalled();
        expect(screen.getAllByText("Rafiq").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Hello tenant")).toBeInTheDocument();
      });

      const input = await screen.findByPlaceholderText(/Type your message|আপনার বার্তা লিখুন/i);
      fireEvent.change(input, { target: { value: "When can I move in?" } });

      const sendBtn = screen.getByText(/send|পাঠান/i);
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(sendSpy).toHaveBeenCalledWith("conv-1", "When can I move in?");
      });
    });

    it("TenantMessagesPage preserves unsent draft text when message sending fails", async () => {
      vi.spyOn(tenantApi, "getConversations").mockResolvedValue([
        {
          id: "conv-1",
          propertyId: "1",
          propertyTitle: "Green Villa Boyra",
          landlordId: "l-1",
          landlordName: "Rafiq",
          tenantId: "t-1",
          tenantName: "Arif",
          lastMessage: "Hello",
          lastMessageAt: "2026-11-08T12:00:00.000Z",
          messages: [],
        },
      ]);
      vi.spyOn(tenantApi, "getConversation").mockResolvedValue({
        id: "conv-1",
        propertyId: "1",
        propertyTitle: "Green Villa Boyra",
        landlordId: "l-1",
        landlordName: "Rafiq",
        tenantId: "t-1",
        tenantName: "Arif",
        lastMessage: "Hello",
        lastMessageAt: "2026-11-08T12:00:00.000Z",
        messages: [],
      });
      vi.spyOn(tenantApi, "getContactRequests").mockResolvedValue([]);
      vi.spyOn(tenantApi, "sendMessage").mockRejectedValue(new Error("Network timeout"));

      renderWithClient(<TenantMessagesPage />);

      await waitFor(() => {
        expect(screen.getAllByText("Rafiq").length).toBeGreaterThanOrEqual(1);
      });

      const input = await screen.findByPlaceholderText(/Type your message|আপনার বার্তা লিখুন/i);
      fireEvent.change(input, { target: { value: "Draft message that should remain on error" } });

      const sendBtn = screen.getByText(/send|পাঠান/i);
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();
      });

      // Draft is preserved in input
      expect(screen.getByDisplayValue("Draft message that should remain on error")).toBeInTheDocument();
    });
  });

  describe("Tenant Dashboard SEO, Privacy, and Indexing Guards", () => {
    it("configures noindex, nofollow on TenantDashboard Route head", () => {
      const headConfig = (TenantDashboardRoute as { head?: () => { meta: Array<{ name?: string; content?: string; title?: string }> } }).head?.();
      expect(headConfig).toBeDefined();
      expect(headConfig?.meta).toContainEqual({
        name: "robots",
        content: "noindex, nofollow",
      });
      expect(headConfig?.meta).toContainEqual({
        title: "Tenant Dashboard — Thikana",
      });
      // Verify no user name or personalized identifiers appear in route metadata
      headConfig?.meta.forEach((tag) => {
        if (tag.content) {
          expect(tag.content).not.toMatch(/Alex|Rafiq|user@/i);
        }
        if (tag.title) {
          expect(tag.title).not.toMatch(/Alex|Rafiq|user@/i);
        }
      });
    });

    it("renders generic dashboard H1 and places user greeting in subtitle", async () => {
      localStorage.setItem("thikana.mock.session", "u-tenant");
      renderWithClient(<TenantDashboard />);

      // Generic localized H1 (Tenant Dashboard / ভাড়াটিয়া ড্যাশবোর্ড)
      await waitFor(() => {
        const h1 = screen.getByRole("heading", { level: 1 });
        expect(h1).toHaveTextContent(/Tenant Dashboard|ভাড়াটিয়া ড্যাশবোর্ড/i);
        expect(h1.textContent).not.toMatch(/রাফি|Alex|স্বাগতম/i);
      });

      // Welcome greeting is rendered as subtitle text for authenticated session
      await waitFor(() => {
        expect(screen.getByText(/স্বাগতম, রাফি|Welcome/i)).toBeInTheDocument();
      });
    });

    it("verifies robots.txt disallows crawling of private authenticated paths", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const robotsPath = path.resolve(process.cwd(), "public/robots.txt");
      const robotsTxt = fs.readFileSync(robotsPath, "utf-8");

      expect(robotsTxt).toContain("Disallow: /tenant/");
      expect(robotsTxt).toContain("Disallow: /landlord/");
      expect(robotsTxt).toContain("Disallow: /admin/");
      expect(robotsTxt).toContain("Disallow: /profile");
      expect(robotsTxt).toContain("Disallow: /api/");
      expect(robotsTxt).toContain("Allow: /");
    });
  });
});
