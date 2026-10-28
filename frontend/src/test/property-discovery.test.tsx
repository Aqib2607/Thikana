import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  mockProperties,
  MOCK_PROPERTIES,
  calculateMatchBreakdown,
} from "@/lib/api/mock/properties";
import { propertyApi, realPropertyApi } from "@/lib/api/properties";
import { authApi } from "@/lib/api/auth";
import { getAuthToken, setAuthToken, httpRequest, TOKEN_STORAGE_KEY } from "@/lib/api/http";
import { USE_MOCK } from "@/lib/api/client";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CommunityInfoCard } from "@/components/property/CommunityInfoCard";
import { PropertyMap } from "@/components/property/PropertyMap";
import { ImageGallery } from "@/components/property/ImageGallery";
import { MatchBreakdownCard } from "@/components/property/MatchBreakdownCard";
import { AuthProvider } from "@/lib/auth";
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

describe("Phase 3: Property Discovery Mock Repository & Matching Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lists seeded Khulna properties", async () => {
    const res = await mockProperties.list();
    expect(res.total).toBeGreaterThan(0);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.areas).toContain("KUET Gate / Teligati");
  });

  it("filters properties by Khulna area", async () => {
    const res = await mockProperties.list({ area: "KUET Gate / Teligati" });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((p) => p.area.includes("KUET"))).toBe(true);
  });

  it("filters properties by maximum budget", async () => {
    const res = await mockProperties.list({ maxRent: 5000 });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((p) => p.rent <= 5000)).toBe(true);
  });

  it("filters properties by property type", async () => {
    const res = await mockProperties.list({ propertyType: "Room" });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((p) => p.propertyType === "Room")).toBe(true);
  });

  it("sorts properties by price ascending", async () => {
    const res = await mockProperties.list({ sortBy: "price_asc" });
    for (let i = 0; i < res.data.length - 1; i++) {
      expect(res.data[i].rent).toBeLessThanOrEqual(res.data[i + 1].rent);
    }
  });

  it("calculates weighted match score according to prompt formula", () => {
    const prop = MOCK_PROPERTIES[0]; // 9500 BDT, KUET Gate / Teligati

    // Case 1: No preferences -> 0%
    const emptyMatch = calculateMatchBreakdown(prop, null);
    expect(emptyMatch.overallPercentage).toBe(0);
    expect(emptyMatch.hasTenantPreferences).toBe(false);

    // Case 2: Matching area, budget, type
    const perfectMatch = calculateMatchBreakdown(prop, {
      preferredArea: "KUET Gate / Teligati",
      maxBudget: 10000,
      preferredPropertyType: "Apartment / Flat",
      minRooms: 2,
      requiredAmenities: ["High-Speed WiFi"],
    });

    expect(perfectMatch.hasTenantPreferences).toBe(true);
    expect(perfectMatch.locationScore).toBe(30);
    expect(perfectMatch.budgetScore).toBe(25);
    expect(perfectMatch.propertyTypeScore).toBe(15);
    expect(perfectMatch.roomsAndBathsScore).toBe(10);
    expect(perfectMatch.overallPercentage).toBeGreaterThanOrEqual(90);
  });
});

describe("Phase 3: Discovery Accessible Components", () => {
  const sampleProp = MOCK_PROPERTIES[0];

  it("renders PropertyCard with BDT price, area, and verified status", () => {
    render(
      <AuthProvider>
        <PropertyCard property={sampleProp} />
      </AuthProvider>,
    );

    expect(screen.getByText(/৳9,500|৳৯,৫০০/)).toBeInTheDocument();
    expect(screen.getByText(/KUET Gate \/ Teligati|কুয়েট গেট/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      sampleProp.banglaTitle || sampleProp.title,
    );
  });

  it("renders CommunityInfoCard with all 6 required criteria", () => {
    render(<CommunityInfoCard community={sampleProp.community} areaName={sampleProp.area} />);

    expect(screen.getByText(sampleProp.community.transport)).toBeInTheDocument();
    expect(screen.getByText(sampleProp.community.waterlogging)).toBeInTheDocument();
    expect(screen.getByText(sampleProp.community.internet)).toBeInTheDocument();
    expect(screen.getByText(sampleProp.community.noise)).toBeInTheDocument();
    expect(screen.getByText(sampleProp.community.safety)).toBeInTheDocument();
    expect(screen.getByText(sampleProp.community.general)).toBeInTheDocument();
  });

  it("renders PropertyMap with interactive pins and accessible text list", () => {
    render(<PropertyMap properties={MOCK_PROPERTIES} />);

    // Check accessible alternative exists
    expect(screen.getByText(/Screen Reader|অ্যাক্সেসিবল/i)).toBeInTheDocument();
    // Check pin buttons exist
    const pins = screen.getAllByRole("button", { name: /Property:/i });
    expect(pins.length).toBe(MOCK_PROPERTIES.length);
  });

  it("renders ImageGallery and highlights the first image as featured", () => {
    render(<ImageGallery images={sampleProp.images} title={sampleProp.title} />);

    expect(screen.getByText(/Featured/i)).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeLessThanOrEqual(5);
  });

  it("renders MatchBreakdownCard with weights analysis for logged-in tenant", async () => {
    localStorage.setItem("thikana.mock.session", "u-tenant");
    const breakdown = calculateMatchBreakdown(sampleProp, {
      preferredArea: sampleProp.area,
      maxBudget: 10000,
    });

    render(
      <AuthProvider>
        <MatchBreakdownCard breakdown={breakdown} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/30%|৩০%/)).toBeInTheDocument();
      expect(screen.getByText(/25%|২৫%/)).toBeInTheDocument();
    });
  });
});


describe("Phase 5A: HTTP Client, Adapter Switching & Property Discovery Contracts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("selects mock adapters when VITE_API_BASE_URL is unset", () => {
    expect(USE_MOCK).toBe(true);
    expect(authApi).toBeDefined();
    expect(propertyApi).toBeDefined();
  });

  it("manages bearer token in localStorage securely", () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken("1|test_token_sample");
    expect(getAuthToken()).toBe("1|test_token_sample");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("1|test_token_sample");

    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("normalizes API error responses correctly in httpRequest", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        status: 422,
        message: "auth.errors.invalid",
        fieldErrors: { email: ["The email field is required."] },
      }),
    });
    global.fetch = mockFetch;

    await expect(httpRequest("/test-endpoint")).rejects.toMatchObject({
      status: 422,
      message: "auth.errors.invalid",
      fieldErrors: { email: ["The email field is required."] },
    });
  });

  it("clears bearer token on 401 unauthenticated response", async () => {
    setAuthToken("expired_token");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        status: 401,
        message: "auth.errors.unauthenticated",
      }),
    });
    global.fetch = mockFetch;

    await expect(httpRequest("/auth/me")).rejects.toMatchObject({
      status: 401,
    });
    expect(getAuthToken()).toBeNull();
  });

  it("formats property query parameters correctly in realPropertyApi", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        areas: [],
      }),
    });
    global.fetch = mockFetch;

    await realPropertyApi.list({
      search: "boyra flat",
      area: "Boyra",
      minRent: 5000,
      maxRent: 15000,
      rooms: 2,
      page: 2,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("search=boyra+flat"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("area=Boyra"),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything()
    );
  });
});
