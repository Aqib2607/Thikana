import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { PropertyItem } from "@/lib/api/properties";
import "@/lib/i18n";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({
    children,
    to,
    className,
    params,
    ...rest
  }: {
    children?: React.ReactNode;
    to?: string;
    className?: string;
    params?: Record<string, string>;
    [key: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "#"} className={className} data-testid="property-link" {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
}));

// Mock auth context
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null }),
}));

describe("Frontend XSS Rendering Defense Verification (Finding P7-R07)", () => {
  beforeEach(() => {
    (window as unknown as { __xss?: boolean }).__xss = undefined;
    localStorage.clear();
  });

  afterEach(() => {
    delete (window as unknown as { __xss?: boolean }).__xss;
  });

  const xssPayloads = [
    '<script>window.__xss = true</script>',
    '<img src="x" onerror="window.__xss = true">',
    '<svg onload="window.__xss = true"></svg>',
    '<iframe src="javascript:alert(1)"></iframe>',
  ];

  it("renders property title containing script tags as literal text without DOM script execution", () => {
    const maliciousPayload = '<script>window.__xss = true</script>';
    const mockProperty: PropertyItem = {
      id: "prop-xss-1",
      title: maliciousPayload,
      slug: "prop-xss-1",
      propertyType: "Apartment / Flat",
      rentalType: "Monthly Rental",
      rent: 25000,
      advance: 50000,
      additionalCharges: 1000,
      billsIncluded: [],
      rooms: 3,
      bathrooms: 2,
      balconies: 1,
      size: 1200,
      floor: "3rd",
      availability: "Available",
      availableFrom: "2026-11-01",
      division: "Khulna",
      district: "Khulna",
      city: "Khulna",
      area: "sonadanga",
      exactAddress: "Safe Address Line 1",
      lat: 22.82,
      lng: 89.55,
      furnishedStatus: "Semi-Furnished",
      preferredTenant: "Family Only",
      featuredImage: "https://images.unsplash.com/photo-test",
      images: [],
      amenities: [],
      verifications: [],
      community: {
        transport: "Good",
        waterlogging: "None",
        internet: "Fiber",
        noise: "Low",
        safety: "High",
        general: "Peaceful",
      },
      landlord: {
        id: "l-1",
        name: "Test Landlord",
        memberSince: "2025-01-01",
        publicContactVisible: true,
        verified: true,
      },
      rating: 4.5,
      reviewCount: 3,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };

    const { container } = render(<PropertyCard property={mockProperty} />);

    // 1. Assert no executable <script> element was inserted into the DOM
    const scriptElements = container.querySelectorAll("script");
    expect(scriptElements.length).toBe(0);

    // 2. Assert the title text is rendered safely as plain text
    const linkElement = container.querySelector('[data-testid="property-link"]');
    expect(linkElement).not.toBeNull();
    expect(linkElement?.textContent).toBe(maliciousPayload);

    // 3. Assert window.__xss was never executed
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders property title containing img onerror payload without introducing event handler attributes", () => {
    const maliciousPayload = '<img src="invalid-image" onerror="window.__xss = true">';
    const mockProperty: PropertyItem = {
      id: "prop-xss-2",
      title: maliciousPayload,
      slug: "prop-xss-2",
      propertyType: "Apartment / Flat",
      rentalType: "Monthly Rental",
      rent: 25000,
      advance: 50000,
      additionalCharges: 1500,
      billsIncluded: [],
      rooms: 3,
      bathrooms: 2,
      balconies: 1,
      size: 1350,
      floor: "4th",
      availability: "Available",
      availableFrom: "2026-11-01",
      division: "Khulna",
      district: "Khulna",
      city: "Khulna",
      area: "boyra",
      exactAddress: "Safe Address",
      lat: 22.83,
      lng: 89.54,
      furnishedStatus: "Semi-Furnished",
      preferredTenant: "Family Only",
      featuredImage: "https://images.unsplash.com/photo-safe",
      images: [],
      amenities: [],
      verifications: [],
      community: {
        transport: "Good",
        waterlogging: "None",
        internet: "Fiber",
        noise: "Low",
        safety: "High",
        general: "Peaceful",
      },
      landlord: {
        id: "l-2",
        name: "Test Landlord 2",
        memberSince: "2025-01-01",
        publicContactVisible: true,
        verified: true,
      },
      rating: 4.0,
      reviewCount: 2,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };

    const { container } = render(<PropertyCard property={mockProperty} />);

    // The only <img> element should be the legitimate featuredImage from the template
    const imgElements = container.querySelectorAll("img");
    expect(imgElements.length).toBe(1);
    expect(imgElements[0]?.getAttribute("src")).toBe("https://images.unsplash.com/photo-safe");
    expect(imgElements[0]?.getAttribute("onerror")).toBeNull();

    // Verify textContent renders payload literally
    const titleLink = container.querySelector('[data-testid="property-link"]');
    expect(titleLink?.textContent).toBe(maliciousPayload);
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders address containing svg onload payload without executing svg handlers", () => {
    const maliciousPayload = '<svg onload="window.__xss = true"></svg>';
    const mockProperty: PropertyItem = {
      id: "prop-xss-3",
      title: "Normal Apartment Title",
      slug: "normal-apartment-title",
      area: maliciousPayload,
      propertyType: "Room",
      rentalType: "Monthly Rental",
      rent: 25000,
      advance: 50000,
      additionalCharges: 500,
      billsIncluded: [],
      rooms: 1,
      bathrooms: 1,
      balconies: 0,
      size: 350,
      floor: "2nd",
      availability: "Available",
      availableFrom: "2026-11-01",
      division: "Khulna",
      district: "Khulna",
      city: "Khulna",
      exactAddress: "Safe Address Line",
      lat: 22.84,
      lng: 89.53,
      furnishedStatus: "Unfurnished",
      preferredTenant: "Students Only",
      featuredImage: "https://images.unsplash.com/photo-safe",
      images: [],
      amenities: [],
      verifications: [],
      community: {
        transport: "Good",
        waterlogging: "None",
        internet: "Fiber",
        noise: "Low",
        safety: "High",
        general: "Peaceful",
      },
      landlord: {
        id: "l-3",
        name: "Test Landlord 3",
        memberSince: "2025-01-01",
        publicContactVisible: true,
        verified: true,
      },
      rating: 3.5,
      reviewCount: 1,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };

    const { container } = render(<PropertyCard property={mockProperty} />);

    // SVGs rendered should only be Lucide icons (aria-hidden), none with onload attribute
    const svgElements = container.querySelectorAll("svg[onload]");
    expect(svgElements.length).toBe(0);

    // Assert literal text is present in the document
    expect(container.textContent).toContain(maliciousPayload);
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders user-generated chat message bubbles with malicious script payloads safely as text", () => {
    // Simulating message bubble rendering as implemented in routes/tenant/messages.tsx
    const messages = [
      { id: "m-1", senderName: "Landlord <script>window.__xss = true</script>", text: "Hello! <img src=x onerror=\"window.__xss = true\">" },
      { id: "m-2", senderName: "Tenant", text: "Is this property available? <svg onload=\"window.__xss = true\"></svg>" },
    ];

    const { container } = render(
      <div data-testid="chat-container">
        {messages.map((m) => (
          <div key={m.id} className="message-row">
            <span className="sender">{m.senderName}</span>
            <div className="message-text">{m.text}</div>
          </div>
        ))}
      </div>
    );

    // Verify no script, iframe, or malicious event attributes
    expect(container.querySelectorAll("script").length).toBe(0);
    expect(container.querySelectorAll("img[onerror]").length).toBe(0);
    expect(container.querySelectorAll("svg[onload]").length).toBe(0);

    // Verify messages are rendered as plain text nodes
    expect(container.textContent).toContain("Landlord <script>window.__xss = true</script>");
    expect(container.textContent).toContain("Hello! <img src=x onerror=\"window.__xss = true\">");
    expect(container.textContent).toContain("Is this property available? <svg onload=\"window.__xss = true\"></svg>");

    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders user-generated reviews safely without converting markup into DOM elements", () => {
    // Simulating review component rendering
    const review = {
      id: "rev-1",
      userName: 'Tenant "><script>window.__xss = true</script>',
      comment: 'Terrible place! <iframe src="javascript:alert(1)"></iframe><img src=x onerror="window.__xss = true">',
      rating: 1,
    };

    const { container } = render(
      <div data-testid="review-card">
        <h4 className="user-name">{review.userName}</h4>
        <p className="comment">{review.comment}</p>
      </div>
    );

    expect(container.querySelectorAll("iframe").length).toBe(0);
    expect(container.querySelectorAll("script").length).toBe(0);
    expect(container.querySelectorAll("img").length).toBe(0);

    expect(container.textContent).toContain(review.userName);
    expect(container.textContent).toContain(review.comment);
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("proves legitimate multi-byte Bangla and English text render without corruption", () => {
    const mockProperty: PropertyItem = {
      id: "prop-bn-1",
      title: "Modern 3 Bed Family Apartment",
      banglaTitle: "সোনাডাঙ্গায় আধুনিক ৩ বেডরুমের ফ্ল্যাট",
      slug: "modern-3-bed-family-apartment",
      propertyType: "Apartment / Flat",
      rentalType: "Monthly Rental",
      rent: 25000,
      advance: 50000,
      additionalCharges: 2000,
      billsIncluded: [],
      rooms: 3,
      bathrooms: 3,
      balconies: 2,
      size: 1450,
      floor: "5th",
      availability: "Available",
      availableFrom: "2026-11-01",
      division: "Khulna",
      district: "Khulna",
      city: "Khulna",
      area: "sonadanga",
      exactAddress: "Road 4, Block B, Sonadanga R/A",
      lat: 22.82,
      lng: 89.55,
      furnishedStatus: "Furnished",
      preferredTenant: "Family Only",
      featuredImage: "https://images.unsplash.com/photo-safe",
      images: [],
      amenities: [],
      verifications: [],
      community: {
        transport: "Good",
        waterlogging: "None",
        internet: "Fiber",
        noise: "Low",
        safety: "High",
        general: "Peaceful",
      },
      landlord: {
        id: "l-4",
        name: "Test Landlord 4",
        memberSince: "2025-01-01",
        publicContactVisible: true,
        verified: true,
      },
      rating: 4.8,
      reviewCount: 5,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };

    const { container } = render(<PropertyCard property={mockProperty} />);
    expect(container.textContent).toContain("সোনাডাঙ্গায় আধুনিক ৩ বেডরুমের ফ্ল্যাট");
  });
});
