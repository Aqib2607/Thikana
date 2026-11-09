import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "i18next";
import { AuthProvider } from "@/lib/auth";
import { HomepageStructuredData } from "@/components/seo/HomepageStructuredData";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (config: Record<string, unknown>) => ({
    ...config,
    path,
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
}));

// Import Route after mock
import { Route } from "@/routes/index";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  let result: ReturnType<typeof render>;
  act(() => {
    result = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{ui}</AuthProvider>
      </QueryClientProvider>,
    );
  });

  return result!;
}

describe("Thikana Homepage SEO, AEO, and GEO Optimization Suite", () => {
  beforeEach(async () => {
    localStorage.clear();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("verifies Route static head configuration for technical SEO, canonical, and OG tags", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routeAny = Route as any;
    expect(typeof routeAny.head).toBe("function");

    const headConfig = routeAny.head();
    expect(headConfig.links).toBeDefined();

    // 1. Canonical URL
    const canonicalLink = headConfig.links.find((l: { rel: string }) => l.rel === "canonical");
    expect(canonicalLink).toBeDefined();
    expect(canonicalLink.href).toBe("https://thikana.com.bd/");

    // 2. Title length check (30-65 chars) & topic near beginning
    const titleMeta = headConfig.meta.find((m: { title?: string }) => m.title);
    expect(titleMeta).toBeDefined();
    expect(titleMeta.title).toBe("খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা");
    expect(titleMeta.title.length).toBeGreaterThanOrEqual(30);
    expect(titleMeta.title.length).toBeLessThanOrEqual(65);

    // 3. Robots Directives
    const robotsMeta = headConfig.meta.find((m: { name?: string }) => m.name === "robots");
    expect(robotsMeta).toBeDefined();
    expect(robotsMeta.content).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );

    // 4. Open Graph Tags
    const ogSiteName = headConfig.meta.find(
      (m: { property?: string }) => m.property === "og:site_name",
    );
    expect(ogSiteName?.content).toBe("Thikana");

    const ogTitle = headConfig.meta.find((m: { property?: string }) => m.property === "og:title");
    expect(ogTitle?.content).toBe("খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা");

    const ogUrl = headConfig.meta.find((m: { property?: string }) => m.property === "og:url");
    expect(ogUrl?.content).toBe("https://thikana.com.bd/");

    const ogType = headConfig.meta.find((m: { property?: string }) => m.property === "og:type");
    expect(ogType?.content).toBe("website");

    const ogImage = headConfig.meta.find((m: { property?: string }) => m.property === "og:image");
    expect(ogImage?.content).toContain("images.unsplash.com");

    const ogImageWidth = headConfig.meta.find(
      (m: { property?: string }) => m.property === "og:image:width",
    );
    expect(ogImageWidth?.content).toBe("1200");

    const ogImageHeight = headConfig.meta.find(
      (m: { property?: string }) => m.property === "og:image:height",
    );
    expect(ogImageHeight?.content).toBe("630");

    // 5. Twitter Card
    const twitterCard = headConfig.meta.find((m: { name?: string }) => m.name === "twitter:card");
    expect(twitterCard?.content).toBe("summary_large_image");
  });

  it("verifies HomepageStructuredData generates valid JSON-LD graph matching visible content", () => {
    const { container } = renderWithProviders(<HomepageStructuredData />);

    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).not.toBeNull();
    expect(scriptTag?.textContent).toBeTruthy();

    const schema = JSON.parse(scriptTag!.textContent!);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(Array.isArray(schema["@graph"])).toBe(true);

    const graph = schema["@graph"];

    // WebSite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const website = graph.find((item: any) => item["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website.url).toBe("https://thikana.com.bd/");
    expect(website.potentialAction["@type"]).toBe("SearchAction");

    // Organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = graph.find((item: any) => item["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org.name).toBe("Thikana");
    expect(org.url).toBe("https://thikana.com.bd/");
    expect(org.areaServed).toBeDefined();
    expect(org.areaServed.name).toBe("Khulna");
    // Ensure knowsAbout topics are present
    expect(Array.isArray(org.knowsAbout)).toBe(true);
    expect(org.knowsAbout.length).toBeGreaterThanOrEqual(4);
    // Ensure unverified street address and unverified contact points are omitted
    expect(org.address).toBeUndefined();
    expect(org.contactPoint).toBeUndefined();

    // WebApplication
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webapp = graph.find((item: any) => item["@type"] === "WebApplication");
    expect(webapp).toBeDefined();
    expect(webapp["@id"]).toBe("https://thikana.com.bd/#app");
    expect(webapp.name).toBe("Thikana");
    expect(webapp.applicationCategory).toBe("RealEstateApplication");
    expect(webapp.operatingSystem).toBeUndefined();
    expect(webapp.browserRequirements).toBeUndefined();

    // BreadcrumbList
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const breadcrumb = graph.find((item: any) => item["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb.itemListElement[0].item).toBe("https://thikana.com.bd/");

    // WebPage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webpage = graph.find((item: any) => item["@type"] === "WebPage");
    expect(webpage).toBeDefined();
    expect(webpage.url).toBe("https://thikana.com.bd/");
    expect(webpage.isPartOf["@id"]).toBe("https://thikana.com.bd/#website");
    expect(webpage.about).toEqual([
      { "@id": "https://thikana.com.bd/#organization" },
      { "@id": "https://thikana.com.bd/#app" },
    ]);
    expect(webpage.breadcrumb["@id"]).toBe("https://thikana.com.bd/#breadcrumb");

    // FAQPage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faqPage = graph.find((item: any) => item["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(Array.isArray(faqPage.mainEntity)).toBe(true);
    expect(faqPage.mainEntity.length).toBe(8);

    // Verify all 8 questions in schema have non-empty text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faqPage.mainEntity.forEach((q: any) => {
      expect(q["@type"]).toBe("Question");
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
      expect(q.acceptedAnswer.text).toBeTruthy();
    });
  });

  it("renders primary H1, verified social proof label, and AEO direct-answer overview", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    renderWithProviders(<IndexComponent />);

    // 1. Primary H1
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent?.trim()).toBe("Find Rental Homes & Mess in Khulna");

    // 2. Top summary definition & Key Takeaways
    expect(screen.getByText(/At a Glance \(Key Takeaways\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Thikana is a rental housing discovery platform serving Khulna, Bangladesh/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Product Category:/i)).toBeInTheDocument();
    expect(screen.getByText(/Operating Region:/i)).toBeInTheDocument();

    // 2. Verified social proof (zero fabricated counts)
    expect(screen.getByText("Trusted by Students & Families across Khulna")).toBeInTheDocument();
    expect(screen.queryByText(/10,000\+ Happy Renters/i)).not.toBeInTheDocument();

    // 3. AEO direct-answer section
    const aeoHeading = screen.getByRole("heading", {
      level: 2,
      name: /What is Thikana\?/i,
    });
    expect(aeoHeading).toBeInTheDocument();
    expect(screen.getByText(/Direct Rental Overview/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Thikana is a rental housing discovery platform for Khulna/i),
    ).toBeInTheDocument();

    // 4. Pillars
    expect(screen.getByText(/Verified Khulna Listings & Zero Broker Fees/i)).toBeInTheDocument();
    expect(screen.getByText(/6-Factor Lifestyle & Campus Matching/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled In-Person Visits & 3-Way Compare/i)).toBeInTheDocument();

    // 5. Target Audiences
    expect(screen.getByText("Who Thikana Serves in Khulna")).toBeInTheDocument();
    expect(screen.getByText("University Students")).toBeInTheDocument();
    expect(screen.getByText("Families")).toBeInTheDocument();
    expect(screen.getByText("Working Professionals")).toBeInTheDocument();
    expect(screen.getByText("Bachelor Tenants")).toBeInTheDocument();
    expect(screen.getByText("Landlords & Mess Managers")).toBeInTheDocument();
  });

  it("renders 'How Thikana Works' 3-step and 5-step workflow sections", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    renderWithProviders(<IndexComponent />);

    const howItWorksHeading = screen.getByRole("heading", {
      level: 2,
      name: /How Thikana Works for Renters & Landlords/i,
    });
    expect(howItWorksHeading).toBeInTheDocument();

    expect(screen.getByText("1. Discover & Filter")).toBeInTheDocument();
    expect(screen.getByText("2. Compare & Match")).toBeInTheDocument();
    expect(screen.getByText("3. Schedule Visit & Connect")).toBeInTheDocument();

    // 5-step rental discovery flow
    expect(screen.getByText("5 Simple Steps to Find Rental Housing in Khulna")).toBeInTheDocument();
    expect(screen.getByText("1. Open Property Search")).toBeInTheDocument();
    expect(screen.getByText("2. Select Neighborhood or Campus Zone")).toBeInTheDocument();
    expect(screen.getByText("3. Apply Targeted Filters")).toBeInTheDocument();
    expect(screen.getByText("4. Compare 3 Properties Side-by-Side")).toBeInTheDocument();
    expect(screen.getByText("5. Contact Landlord & Schedule Visit")).toBeInTheDocument();
  });

  it("renders Section 7 verified rental journeys instead of fabricated testimonials", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    renderWithProviders(<IndexComponent />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Verified Rental Journeys in Khulna/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/KUET Engineering Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Mess in Teligati \(Near KUET\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Banking Professional, Khulna/i)).toBeInTheDocument();
    expect(screen.getByText(/Family Apartment in Sonadanga R\/A/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Owner in Boyra/i)).toBeInTheDocument();
    expect(screen.getByText(/Residential Property Owner, Boyra/i)).toBeInTheDocument();
  });

  it("renders the Rental Decision Guide and comparison table with credible citations", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    renderWithProviders(<IndexComponent />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /What Should You Check Before Renting a Home\?/i,
      }),
    ).toBeInTheDocument();

    // Verify categories in table
    expect(screen.getByText("Family Flat")).toBeInTheDocument();
    expect(screen.getByText("Bachelor Flat / Room")).toBeInTheDocument();
    expect(screen.getByText("Student Mess / Seat")).toBeInTheDocument();

    // Verify accessible table semantics (WCAG 2.1 AA)
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    const colHeaders = screen.getAllByRole("columnheader");
    expect(colHeaders.length).toBe(6);
    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders.length).toBe(3);

    // Verify statutory & official citations
    const actLink = screen.getByRole("link", { name: /The Premises Rent Control Act, 1991/i });
    expect(actLink).toHaveAttribute("href", "http://bdlaws.minlaw.gov.bd/act-757.html");

    const kccLink = screen.getByRole("link", { name: /Khulna City Corporation \(KCC\)/i });
    expect(kccLink).toHaveAttribute("href", "https://kcc.gov.bd/");

    // Verify neutral academic institutions trust bar
    expect(
      screen.getByText("Major Academic Institutions & Student Commute Zones in Khulna"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Geographic landmark and campus commute reference points/i),
    ).toBeInTheDocument();

    // Verify university official links in trust bar
    const kuetLink = screen.getByRole("link", {
      name: /^KUET/i,
    });
    expect(kuetLink).toHaveAttribute("href", "https://www.kuet.ac.bd/");

    const kuLink = screen.getByRole("link", {
      name: /^Khulna University \(KU\)/i,
    });
    expect(kuLink).toHaveAttribute("href", "https://ku.ac.bd/");

    // Verify 8-point rental decision checklist
    expect(screen.getByText("8-Point Rental Decision Checklist")).toBeInTheDocument();
    expect(screen.getByText("1. Monthly Rent & Due Date")).toBeInTheDocument();
    expect(screen.getByText("2. Security Deposit & Written Receipt")).toBeInTheDocument();
    expect(screen.getByText("3. Electricity, Gas & Utility Billing")).toBeInTheDocument();
    expect(screen.getByText("4. Water Supply & Pump Schedule")).toBeInTheDocument();
    expect(screen.getByText("5. Location & Commute Distance")).toBeInTheDocument();
    expect(screen.getByText("6. House Rules & Gate Curfew")).toBeInTheDocument();
    expect(screen.getByText("7. Direct Landlord Communication")).toBeInTheDocument();
    expect(screen.getByText("8. Move-in Availability & Handover")).toBeInTheDocument();
  });

  it("renders all 8 FAQ questions matching requested search intent and toggles accordion state on click", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    renderWithProviders(<IndexComponent />);

    // 8 questions
    expect(screen.getByRole("button", { name: /What is Thikana\?/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /How can I find rental homes in Khulna on Thikana\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /How can students find mess accommodation\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /How can landlords publish property listings\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /What should you check before renting a home\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Can I compare rental properties side-by-side\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /How do in-person property visits work\?/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /How does Thikana handle property verification\?/i,
      }),
    ).toBeInTheDocument();

    // Verify semantic H3 headers wrapping FAQ buttons
    const faqHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(faqHeadings.length).toBeGreaterThanOrEqual(8);

    // Verify all 8 FAQ buttons have aria-expanded and aria-controls
    const faqButtons = screen.getAllByRole("button", { name: /\?/i });
    expect(faqButtons.length).toBe(8);
    faqButtons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-expanded");
      expect(btn).toHaveAttribute("aria-controls");
      const targetId = btn.getAttribute("aria-controls")!;
      const answerEl = document.getElementById(targetId);
      expect(answerEl).toBeInTheDocument();
    });

    // Click 8th FAQ to expand
    const verificationFaqBtn = screen.getByRole("button", {
      name: /How does Thikana handle property verification\?/i,
    });
    fireEvent.click(verificationFaqBtn);

    expect(
      screen.getByText(
        /Thikana conducts an administrative platform verification process covering landlord identity/i,
      ),
    ).toBeInTheDocument();
  });

  it("dynamically synchronizes document.title, meta tags, and html lang on language change with 30-65 char title", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IndexComponent = (Route as any).component;
    const { unmount } = renderWithProviders(<IndexComponent />);

    expect(document.title).toBe("Find Rental Homes & Mess in Khulna | Thikana");
    expect(document.title.length).toBeGreaterThanOrEqual(30);
    expect(document.title.length).toBeLessThanOrEqual(65);
    expect(document.documentElement.lang).toBe("en");
    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute("content")).toContain("Discover verified rental flats");

    unmount();

    // Switch to Bengali
    await act(async () => {
      await i18n.changeLanguage("bn");
    });

    renderWithProviders(<IndexComponent />);

    expect(document.title).toBe("খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা");
    expect(document.title.length).toBeGreaterThanOrEqual(30);
    expect(document.title.length).toBeLessThanOrEqual(65);
    expect(document.documentElement.lang).toBe("bn");
    const descMetaBn = document.querySelector('meta[name="description"]');
    expect(descMetaBn?.getAttribute("content")).toContain("খুলনায় ভেরিফাইড ফ্ল্যাট");
  });
});
