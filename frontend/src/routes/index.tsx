import { useState, useMemo, useEffect, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Star,
  MapPin,
  Phone,
  Mail,
  Send,
  Plus,
  Minus,
  GraduationCap,
  Users,
  Briefcase,
  User,
  KeyRound,
  SlidersHorizontal,
  Home,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_PROPERTIES } from "@/lib/api/mock/properties";
import { propertyApi, PROPERTY_TYPES } from "@/lib/api/properties";
import { tenantApi } from "@/lib/api/tenant";
import { translateArea, translatePropertyType, toBnNumber } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { ImageMaskReveal } from "@/components/motion/ImageMaskReveal";
import { HomepageStructuredData } from "@/components/seo/HomepageStructuredData";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://thikana.com.bd/" }],
    meta: [
      { title: "খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা" },
      {
        name: "description",
        content:
          "Discover verified rental flats, bachelor rooms, student messes, and sublets across Khulna. 6-factor matching, side-by-side comparison, and direct landlord visits.",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:site_name", content: "Thikana" },
      {
        property: "og:title",
        content: "খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা",
      },
      {
        property: "og:description",
        content:
          "Discover verified rental flats, bachelor rooms, student messes, and sublets across Khulna. 6-factor matching, side-by-side comparison, and direct landlord visits.",
      },
      { property: "og:url", content: "https://thikana.com.bd/" },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=630&q=80",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content:
          "Thikana verified residential rental housing and student mess in Khulna, Bangladesh",
      },
      { property: "og:locale", content: "bn_BD" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "খুলনায় বাসা ও মেস ভাড়া খুঁজুন | ঠিকানা",
      },
      {
        name: "twitter:description",
        content:
          "Discover verified rental flats, bachelor rooms, student messes, and sublets across Khulna. 6-factor matching, side-by-side comparison, and direct landlord visits.",
      },
      {
        name: "twitter:image",
        content:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=630&q=80",
      },
    ],
  }),
  component: Index,
});

const SHOWCASE_TABS = [
  {
    num: "01",
    id: "tab_01",
    minRent: "12,000",
    maxRent: "28,000",
    propertyType: "apartment",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    features: ["Balcony with open view", "24/7 Deep Tube-Well Water", "CCTV & Security Guard"],
  },
  {
    num: "02",
    id: "tab_02",
    minRent: "3,000",
    maxRent: "7,500",
    propertyType: "bachelor_room",
    image:
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    features: ["High-Speed WiFi Included", "5 Min Walk to Campus", "IPS / Generator Backup"],
  },
  {
    num: "03",
    id: "tab_03",
    minRent: "2,500",
    maxRent: "5,500",
    propertyType: "hostel",
    image:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
    features: [
      "Daily Meal System Included",
      "Study Friendly Environment",
      "Filter Water Available",
    ],
  },
  {
    num: "04",
    id: "tab_04",
    minRent: "4,500",
    maxRent: "9,000",
    propertyType: "sublet",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    features: ["Attached Bathroom", "Shared Kitchen Access", "Quiet Residential Environment"],
  },
  {
    num: "05",
    id: "tab_05",
    minRent: "18,000",
    maxRent: "65,000",
    propertyType: "commercial",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    features: ["Prime Main Road Access", "High Footfall Hub", "Dedicated Meter & Parking"],
  },
];

const FAQS = [
  { id: "faq_1" },
  { id: "faq_2" },
  { id: "faq_3" },
  { id: "faq_4" },
  { id: "faq_5" },
  { id: "faq_6" },
  { id: "faq_7" },
  { id: "faq_8" },
];

const COLLECTIONS = [
  {
    key: "col_apartment",
    type: "apartment",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "col_bachelor_room",
    type: "bachelor_room",
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "col_hostel",
    type: "hostel",
    img: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "col_sublet",
    type: "sublet",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
];

const COMMUNITY_HOSTS = [
  {
    id: "host_1",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "host_2",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "host_3",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  },
];

function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  // Showcase state
  const [activeTab, setActiveTab] = useState(0);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryArea, setInquiryArea] = useState("Sonadanga R/A");
  const [inquiryBudget, setInquiryBudget] = useState("");
  const [inquiryNote, setInquiryNote] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: {
        search: searchQuery || undefined,
        area: selectedArea && selectedArea !== "All Areas" ? selectedArea : undefined,
        propertyType: selectedType || undefined,
        maxRent: maxBudget ? Number(maxBudget) : undefined,
      },
    });
  };

  const handleQuickArea = (area: string) => {
    navigate({
      to: "/properties",
      search: {
        area: area,
      },
    });
  };

  const handleInquirySubmit = (e: FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryName("");
      setInquiryPhone("");
      setInquiryBudget("");
      setInquiryNote("");
    }, 4000);
  };

  const currentTab = SHOWCASE_TABS[activeTab];
  const {
    data: catalogAreas = [],
    isLoading: areasLoading,
    isError: areasError,
    refetch: refetchAreas,
  } = useQuery({
    queryKey: ["propertyAreas"],
    queryFn: () => propertyApi.getAreas(),
    staleTime: 1000 * 60 * 30,
  });
  const activeAreas = catalogAreas;

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["featuredProperties"],
    queryFn: () => propertyApi.list({ limit: 4, sortBy: "rating" }),
  });
  const featuredListings =
    featuredData?.data && featuredData.data.length > 0
      ? featuredData.data
      : MOCK_PROPERTIES.slice(0, 4);

  const isTenant = !!user && user.role === "tenant";

  const { data: tenantFavorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => tenantApi.getFavorites(),
    enabled: isTenant,
  });

  const { data: tenantComparisons = [] } = useQuery({
    queryKey: ["comparisons"],
    queryFn: () => tenantApi.getComparisons(),
    enabled: isTenant,
  });

  const favoriteIds = useMemo(
    () => new Set(tenantFavorites.map((f) => String(f.id))),
    [tenantFavorites],
  );

  const comparisonIds = useMemo(
    () => new Set(tenantComparisons.map((c) => String(c.propertyId || c.id))),
    [tenantComparisons],
  );

  useEffect(() => {
    const isBn = i18n.language === "bn";
    const pageTitle = t("home.seoTitle");
    const pageDesc = t("home.seoDescription");

    document.title = pageTitle;
    document.documentElement.lang = isBn ? "bn" : "en";

    const updateMeta = (nameOrProp: string, value: string, isProp = false) => {
      const selector = isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (isProp) {
          el.setAttribute("property", nameOrProp);
        } else {
          el.setAttribute("name", nameOrProp);
        }
        document.head.appendChild(el);
      }
      el.content = value;
    };

    updateMeta("description", pageDesc);
    updateMeta("og:title", pageTitle, true);
    updateMeta("og:description", pageDesc, true);
    updateMeta("og:locale", isBn ? "bn_BD" : "en_US", true);
    updateMeta("twitter:title", pageTitle);
    updateMeta("twitter:description", pageDesc);
  }, [i18n.language, t]);

  return (
    <AppShell>
      <div className="animate-page-enter">
        <HomepageStructuredData />
        {/* ========================================================
            1. HERO SECTION (Reference Video 0s-15s: Two-Tone Typography,
               Pill Buttons, Social Stack, High-End Residential Imagery)
            ======================================================== */}
        <section className="relative overflow-hidden pt-6 pb-20 md:pt-12 md:pb-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            {/* Overline Chip */}
            <MotionReveal variant="fadeDown" duration={450}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="tracking-wide">{t("home.heroBadge")}</span>
              </div>
            </MotionReveal>

            {/* Two-Tone Display Headline */}
            <div className="mt-6 max-w-4xl">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-normal leading-[1.34] sm:leading-[1.32] md:leading-[1.30] [html[lang='en']_&]:md:font-extrabold [html[lang='en']_&]:md:tracking-tight [html[lang='en']_&]:leading-[1.15]">
                <TextReveal className="block text-foreground" delay={80} duration={650}>
                  {t("home.heroSub")}
                </TextReveal>
              </h1>
              <p className="mt-3 text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground tracking-normal [html[lang='en']_&]:tracking-tight">
                {t("home.heroTagline")}
              </p>

              <MotionReveal variant="fadeUp" delay={200} duration={500}>
                <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {t("home.heroSubtitle2")}
                </p>
              </MotionReveal>
            </div>

            {/* Dual Pill CTA Buttons & Social Proof Stack */}
            <MotionReveal variant="fadeUp" delay={280} duration={500}>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-8">
                <div className="flex flex-wrap items-center gap-3.5">
                  <Link to="/properties" className="btn-primary">
                    <span>{t("home.browseVerifiedHomes")}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
                    className="btn-secondary"
                  >
                    <span>{t("home.listYourHome")}</span>
                  </Link>
                </div>

                {/* Social Proof Avatar Stack */}
                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-border/80 pt-4 sm:pt-0 sm:pl-8">
                  <div className="flex -space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="Tenant"
                      className="h-10 w-10 rounded-full border-2 border-surface object-cover shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                      alt="Tenant"
                      className="h-10 w-10 rounded-full border-2 border-surface object-cover shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                      alt="Tenant"
                      className="h-10 w-10 rounded-full border-2 border-surface object-cover shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 text-gold font-bold">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-gold text-gold"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-1 text-foreground font-semibold">4.9 / 5</span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground font-medium">
                      {t("home.socialProofLabel")}
                    </p>
                  </div>
                </div>
              </div>
            </MotionReveal>

            {/* Floating Search & Filter Pill Card */}
            <MotionReveal variant="fadeUp" delay={360} duration={550}>
              <div className="mt-10 rounded-3xl bg-glass-card p-4 sm:p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 hover:border-foreground/20">
                <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("properties.khulnaArea")}
                      </span>
                      {areasError && (
                        <button
                          type="button"
                          onClick={() => refetchAreas()}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline cursor-pointer"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          Retry
                        </button>
                      )}
                    </span>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      disabled={areasLoading}
                      className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground transition-all duration-180 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus-visible:outline-none disabled:opacity-60 cursor-pointer"
                    >
                      <option value="">
                        {areasLoading ? "Loading areas..." : t("home.allKhulnaAreas")}
                      </option>
                      {activeAreas
                        .filter((a) => a !== "All Areas")
                        .map((a) => (
                          <option key={a} value={a}>
                            {translateArea(a, i18n.language)}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("properties.propertyType")}
                    </span>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground transition-all duration-180 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus-visible:outline-none cursor-pointer"
                    >
                      <option value="">{t("home.allPropertyTypes")}</option>
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {translatePropertyType(pt, i18n.language)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("properties.monthlyBudget")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder={t("home.budgetPlaceholder")}
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all duration-180 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus-visible:outline-none"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover-lift active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:scale-110">
                        <Search
                          className="h-3.5 w-3.5 text-primary-foreground"
                          aria-hidden="true"
                        />
                      </span>
                      <span>{t("home.search")}</span>
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </form>

                {/* Quick Campus Zones Pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:gap-3">
                  <span className="font-semibold text-foreground mr-1">
                    {t("home.popularHubs")}
                  </span>
                  {[
                    { name: "KUET Gate / Teligati", areaKey: "kuet_gate_teligati" },
                    { name: "Gallamari / Zero Point (KU)", areaKey: "gallamari_zero_point_ku" },
                    { name: "Sonadanga R/A", areaKey: "sonadanga_r_a" },
                    { name: "Boyra", areaKey: "boyra" },
                    { name: "Daulatpur (BL College)", areaKey: "daulatpur_bl_college" },
                  ].map((hub) => (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => handleQuickArea(hub.name)}
                      className="btn-pill"
                    >
                      {translateArea(hub.name, i18n.language)}
                    </button>
                  ))}
                </div>
              </div>
            </MotionReveal>

            {/* Opening Definition & Key Takeaways Card (AEO & GEO Top Summary - Reordered below Search) */}
            <MotionReveal variant="fadeUp" delay={420} duration={500}>
              <div className="mt-8 rounded-3xl border border-border/80 bg-surface/90 p-6 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("home.topSummaryBadge")}
                  </span>
                  <h2 className="text-sm font-bold text-foreground">{t("home.topSummaryTitle")}</h2>
                </div>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground font-medium">
                  {t("home.topSummaryDefinition")}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/60 pt-5 text-xs lg:gap-6">
                  <div className="rounded-xl bg-background/50 p-3.5 border border-border/40">
                    <span className="font-bold text-foreground block">
                      {t("home.takeawayCatLabel")}
                    </span>
                    <span className="mt-1 text-muted-foreground block leading-relaxed">
                      {t("home.takeawayCatVal")}
                    </span>
                  </div>
                  <div className="rounded-xl bg-background/50 p-3.5 border border-border/40">
                    <span className="font-bold text-foreground block">
                      {t("home.takeawayGeoLabel")}
                    </span>
                    <span className="mt-1 text-muted-foreground block leading-relaxed">
                      {t("home.takeawayGeoVal")}
                    </span>
                  </div>
                  <div className="rounded-xl bg-background/50 p-3.5 border border-border/40">
                    <span className="font-bold text-foreground block">
                      {t("home.takeawayAudLabel")}
                    </span>
                    <span className="mt-1 text-muted-foreground block leading-relaxed">
                      {t("home.takeawayAudVal")}
                    </span>
                  </div>
                  <div className="rounded-xl bg-background/50 p-3.5 border border-border/40">
                    <span className="font-bold text-foreground block">
                      {t("home.takeawayActionLabel")}
                    </span>
                    <span className="mt-1 text-muted-foreground block leading-relaxed">
                      {t("home.takeawayActionVal")}
                    </span>
                  </div>
                </div>
              </div>
            </MotionReveal>

            {/* Hero Editorial Showcase Banner */}
            <ImageMaskReveal className="mt-10 rounded-3xl" delay={300} hoverZoom>
              <div className="relative overflow-hidden rounded-3xl border border-border/80 shadow-xl aspect-[16/8] sm:aspect-[21/9]">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
                  alt="Modern residential living in Khulna"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white mb-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        {t("properties.verifiedBadge")} ·{" "}
                        {translateArea("Sonadanga R/A", i18n.language)}
                      </span>
                      <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                        Sonadanga Avenue 3-Bedroom Master Suite
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                        Walking distance to medical hub, generator power, reserved car parking.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-neutral-400 block uppercase">
                          {t("home.featuredRentLabel")}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          ৳ {toBnNumber("16,500", i18n.language)}
                        </span>
                      </div>
                      <Link
                        to="/properties"
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-xs font-bold text-black shadow-sm transition-all hover:bg-neutral-100 hover-lift-sm active:scale-[0.98]"
                      >
                        <span>{t("common.viewDetails")}</span>
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </ImageMaskReveal>
          </div>
        </section>

        {/* ========================================================
          2. MONOCHROME INSTITUTIONAL TRUST BAR (15s - 22s in Video)
          ======================================================== */}
        <section className="border-y border-border/70 bg-surface/50 py-10">
          <MotionReveal variant="fadeIn" duration={800}>
            <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">
                {t("home.trustBanner")}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("home.trustBannerDesc")}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold tracking-wider text-muted-foreground grayscale hover:grayscale-0 transition-all opacity-75">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-foreground" />
                  <a
                    href="https://www.kuet.ac.bd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    <span>KUET Campus</span>
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      (খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়)
                    </span>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-foreground" />
                  <a
                    href="https://ku.ac.bd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Khulna University (KU)
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-foreground" />
                  <a
                    href="http://kmc.gov.bd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Khulna Medical College (KMC)
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-foreground" />
                  <a
                    href="https://blcollege.edu.bd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Govt. B.L. College
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-foreground" />
                  <span>Northern University Khulna</span>
                </div>
              </div>
            </div>
          </MotionReveal>
        </section>

        {/* ========================================================
          AEO DIRECT-ANSWER OVERVIEW & VALUE PROPOSITIONS
          ======================================================== */}
        <section
          id="about-thikana"
          className="py-16 md:py-20 border-b border-border/70 bg-surface/30"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="rounded-3xl border border-border/80 bg-surface p-8 sm:p-12 shadow-md">
                <div className="max-w-3xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("home.aeoBadge")}
                  </span>
                  <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
                    {t("home.aeoHeading")}
                  </h2>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground font-normal">
                    {t("home.aeoAnswer")}
                  </p>
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-3 border-t border-border/60 pt-8">
                  <div className="space-y-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("home.pillar1Title")}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("home.pillar1Desc")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("home.pillar2Title")}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("home.pillar2Desc")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("home.pillar3Title")}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("home.pillar3Desc")}
                    </p>
                  </div>
                </div>

                {/* Target Audiences Grid */}
                <div className="mt-12 border-t border-border/60 pt-10">
                  <div className="max-w-2xl">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {t("home.audiencesHeading")}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {t("home.audiencesSubheading")}
                    </p>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {t("home.audStudentsTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.audStudentsDesc")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {t("home.audFamiliesTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.audFamiliesDesc")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {t("home.audProfessionalsTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.audProfessionalsDesc")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {t("home.audBachelorsTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.audBachelorsDesc")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-5 space-y-2 sm:col-span-2 lg:col-span-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {t("home.audLandlordsTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.audLandlordsDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* ========================================================
          HOW THIKANA WORKS (3 STEPS)
          ======================================================== */}
        <section id="how-it-works" className="py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t("home.howItWorksEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("home.howItWorksTitle")}
                </h2>
              </div>
            </MotionReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <MotionReveal variant="fadeUp" delay={100}>
                <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs h-full flex flex-col justify-between hover-lift">
                  <div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      01
                    </span>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      {t("home.howItWorksStep1Title")}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t("home.howItWorksStep1Desc")}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      to="/properties"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{t("home.viewAllProperties")}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </MotionReveal>

              <MotionReveal variant="fadeUp" delay={200}>
                <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs h-full flex flex-col justify-between hover-lift">
                  <div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      02
                    </span>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      {t("home.howItWorksStep2Title")}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t("home.howItWorksStep2Desc")}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      to={isTenant ? "/tenant/comparison" : "/properties"}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{t("home.featPricing")}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </MotionReveal>

              <MotionReveal variant="fadeUp" delay={300}>
                <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs h-full flex flex-col justify-between hover-lift">
                  <div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      03
                    </span>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      {t("home.howItWorksStep3Title")}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t("home.howItWorksStep3Desc")}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      to="/properties"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{t("home.featVisits")}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </MotionReveal>
            </div>

            {/* 5-Step Rental Discovery Flow */}
            <MotionReveal variant="fadeUp" delay={250}>
              <div className="mt-10 rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs">
                <div className="max-w-2xl">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("home.fiveStepsTitle")}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {t("home.fiveStepsSubtitle")}
                  </p>
                </div>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 list-none p-0">
                  <li className="flex flex-col justify-between rounded-2xl border border-border/60 bg-background/50 p-4 space-y-2">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {toBnNumber("1", i18n.language)}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{t("home.step1Title")}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.step1Desc")}
                      </p>
                    </div>
                  </li>
                  <li className="flex flex-col justify-between rounded-2xl border border-border/60 bg-background/50 p-4 space-y-2">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {toBnNumber("2", i18n.language)}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{t("home.step2Title")}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.step2Desc")}
                      </p>
                    </div>
                  </li>
                  <li className="flex flex-col justify-between rounded-2xl border border-border/60 bg-background/50 p-4 space-y-2">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {toBnNumber("3", i18n.language)}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{t("home.step3Title")}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.step3Desc")}
                      </p>
                    </div>
                  </li>
                  <li className="flex flex-col justify-between rounded-2xl border border-border/60 bg-background/50 p-4 space-y-2">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {toBnNumber("4", i18n.language)}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{t("home.step4Title")}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.step4Desc")}
                      </p>
                    </div>
                  </li>
                  <li className="flex flex-col justify-between rounded-2xl border border-border/60 bg-background/50 p-4 space-y-2">
                    <div className="space-y-1.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {toBnNumber("5", i18n.language)}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">{t("home.step5Title")}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("home.step5Desc")}
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* ========================================================
          RENTAL DECISION GUIDE & COMPARISON TABLE (AEO & GEO)
          ======================================================== */}
        <section
          id="rental-guide"
          className="border-t border-border/70 bg-secondary/20 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-wider text-primary">
                  {t("home.decisionTableEyebrow")}
                </p>
                <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("home.decisionTableTitle")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t("home.decisionTableDesc")}
                </p>
              </div>
            </MotionReveal>

            <MotionReveal variant="fadeUp" delay={150}>
              <div className="mt-10 overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <caption className="sr-only">{t("home.decisionTableTitle")}</caption>
                    <thead>
                      <tr className="border-b border-border/80 bg-secondary/50 text-foreground font-bold">
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionCategory")}
                        </th>
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionDeposit")}
                        </th>
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionUtility")}
                        </th>
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionWater")}
                        </th>
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionRules")}
                        </th>
                        <th scope="col" className="p-4 sm:p-5">
                          {t("home.decisionLocations")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-muted-foreground">
                      <tr className="hover:bg-secondary/20 transition-colors">
                        <th
                          scope="row"
                          className="p-4 sm:p-5 font-bold text-foreground text-left font-semibold"
                        >
                          {t("home.rowFamilyName")}
                        </th>
                        <td className="p-4 sm:p-5">{t("home.rowFamilyDeposit")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowFamilyUtility")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowFamilyWater")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowFamilyRules")}</td>
                        <td className="p-4 sm:p-5 font-medium text-foreground">
                          {t("home.rowFamilyLocations")}
                        </td>
                      </tr>
                      <tr className="hover:bg-secondary/20 transition-colors">
                        <th
                          scope="row"
                          className="p-4 sm:p-5 font-bold text-foreground text-left font-semibold"
                        >
                          {t("home.rowBachelorName")}
                        </th>
                        <td className="p-4 sm:p-5">{t("home.rowBachelorDeposit")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowBachelorUtility")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowBachelorWater")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowBachelorRules")}</td>
                        <td className="p-4 sm:p-5 font-medium text-foreground">
                          {t("home.rowBachelorLocations")}
                        </td>
                      </tr>
                      <tr className="hover:bg-secondary/20 transition-colors">
                        <th
                          scope="row"
                          className="p-4 sm:p-5 font-bold text-foreground text-left font-semibold"
                        >
                          {t("home.rowMessName")}
                        </th>
                        <td className="p-4 sm:p-5">{t("home.rowMessDeposit")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowMessUtility")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowMessWater")}</td>
                        <td className="p-4 sm:p-5">{t("home.rowMessRules")}</td>
                        <td className="p-4 sm:p-5 font-medium text-foreground">
                          {t("home.rowMessLocations")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Citations Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/80 bg-surface/80 p-4 sm:px-6 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {t("home.legalReferenceText")}
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href="http://bdlaws.minlaw.gov.bd/act-757.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <span>{t("home.rentControlAct")}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <span className="text-border">·</span>
                    <a
                      href="https://kcc.gov.bd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <span>{t("home.kccReference")}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </MotionReveal>

            {/* 8-Point Tenant Rental Decision Checklist */}
            <MotionReveal variant="fadeUp" delay={200}>
              <div className="mt-12 rounded-3xl border border-border/80 bg-surface p-8 sm:p-10 shadow-sm">
                <div className="max-w-3xl">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("home.checklistHeading")}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {t("home.checklistSubheading")}
                  </p>
                </div>

                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 list-none p-0">
                  {[
                    { title: t("home.chk1Title"), desc: t("home.chk1Desc") },
                    { title: t("home.chk2Title"), desc: t("home.chk2Desc") },
                    { title: t("home.chk3Title"), desc: t("home.chk3Desc") },
                    { title: t("home.chk4Title"), desc: t("home.chk4Desc") },
                    { title: t("home.chk5Title"), desc: t("home.chk5Desc") },
                    { title: t("home.chk6Title"), desc: t("home.chk6Desc") },
                    { title: t("home.chk7Title"), desc: t("home.chk7Desc") },
                    { title: t("home.chk8Title"), desc: t("home.chk8Desc") },
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className="flex flex-col justify-start rounded-2xl border border-border/60 bg-background/50 p-5 space-y-2"
                    >
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* ========================================================
          3. NUMBERED 01-05 INTERACTIVE SHOWCASE (22s - 45s in Video)
          ======================================================== */}
        <section id="categories" className="py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-wider text-primary">
                  {t("home.categoriesEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                  {t("home.livingSpacesTitle")}
                </h2>
              </div>
            </MotionReveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Interactive Tabs */}
              <MotionReveal variant="slideInLeft" delay={150} className="lg:col-span-5">
                <div role="tablist" aria-orientation="vertical" className="space-y-3">
                  {SHOWCASE_TABS.map((tab, idx) => {
                    const isActive = activeTab === idx;
                    return (
                      <button
                        key={tab.num}
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        type="button"
                        onClick={() => setActiveTab(idx)}
                        className={`w-full text-left rounded-2xl p-5 transition-all flex items-start gap-4 border cursor-pointer ${
                          isActive
                            ? "bg-surface border-border shadow-md"
                            : "bg-transparent border-transparent hover:bg-surface/60 hover:border-border/40"
                        }`}
                      >
                        <span
                          className={`text-xl font-bold transition-colors ${
                            isActive ? "text-foreground" : "text-muted-foreground/60"
                          }`}
                        >
                          {toBnNumber(tab.num, i18n.language)}
                        </span>
                        <div className="flex-1">
                          <h3
                            className={`text-base font-bold transition-colors ${
                              isActive ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {t(`home.showcase.${tab.id}.label`)}
                          </h3>
                          {isActive && (
                            <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              <p>{t(`home.showcase.${tab.id}.desc`)}</p>
                              <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60">
                                <span className="font-bold text-foreground text-xs">
                                  ৳ {toBnNumber(tab.minRent, i18n.language)} – ৳{" "}
                                  {toBnNumber(tab.maxRent, i18n.language)} /{" "}
                                  {t("properties.perMonth")}
                                </span>
                                <Link
                                  to="/properties"
                                  search={{ propertyType: tab.propertyType }}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                                >
                                  <span>{t("home.exploreFlats")}</span>
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </MotionReveal>

              {/* Right Showcase Large Image */}
              <MotionReveal variant="slideInRight" delay={250} className="lg:col-span-7">
                <div
                  role="tabpanel"
                  id={`tabpanel-${currentTab.id}`}
                  aria-labelledby={`tab-${currentTab.id}`}
                  className="relative overflow-hidden rounded-3xl border border-border/80 shadow-2xl aspect-[4/3] sm:aspect-[16/11]"
                >
                  <img
                    key={currentTab.num}
                    src={currentTab.image}
                    alt={t(`home.showcase.${currentTab.id}.title`)}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  {/* Floating pill badge */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-full bg-black/75 px-5 py-3 text-white backdrop-blur-md">
                    <div>
                      <span className="text-xs font-mono text-neutral-400 block">
                        {toBnNumber(currentTab.num, i18n.language)} /{" "}
                        {toBnNumber("05", i18n.language)}
                      </span>
                      <span className="text-sm font-bold">
                        {t(`home.showcase.${currentTab.id}.title`)}
                      </span>
                    </div>
                    <Link
                      to="/properties"
                      search={{ propertyType: currentTab.propertyType }}
                      className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                    >
                      {t("home.viewAllProperties")} ↗
                    </Link>
                  </div>
                </div>
              </MotionReveal>
            </div>
          </div>
        </section>

        {/* ========================================================
          4. CATEGORICAL GRID (4-COLUMN) (45s - 65s in Video)
          ======================================================== */}
        <section className="border-t border-border/70 bg-secondary/30 py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-primary">
                    {t("home.collectionsEyebrow")}
                  </p>
                  <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    {t("home.collectionsTitle")}
                  </h2>
                </div>
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary transition-all"
                >
                  <span>{t("home.viewAllProperties")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </MotionReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {COLLECTIONS.map((col, idx) => (
                <MotionReveal key={col.type} variant="fadeUp" delay={idx * 90}>
                  <Link
                    to="/properties"
                    search={{ propertyType: col.type }}
                    className="group relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm transition-all hover:shadow-xl hover-lift block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={col.img}
                        alt={t(`home.collectionsItems.${col.key}.title`)}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 flex flex-col justify-end p-5 sm:p-6 text-white">
                        <h3 className="text-lg font-bold leading-tight drop-shadow-sm">
                          {t(`home.collectionsItems.${col.key}.title`)}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-200 line-clamp-1 drop-shadow-xs">
                          {t(`home.collectionsItems.${col.key}.sub`)}
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2.5">
                          <span className="text-xs font-medium text-neutral-100">
                            {t(`home.collectionsItems.${col.key}.count`)} ·{" "}
                            {t(`home.collectionsItems.${col.key}.price`)}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                            <span>{t("home.exploreAction")}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
          5. EDITORIAL SHOWCASE ("Homes Made For Every Moment") (65s - 80s in Video)
          ======================================================== */}
        <section id="why-thikana" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Big Editorial Column */}
              <MotionReveal
                variant="slideInLeft"
                className="lg:col-span-5 flex flex-col justify-center space-y-6"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("home.featuresEyebrow")}
                  </p>
                  <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight [html[lang='bn']_&]:leading-[1.28] [html[lang='bn']_&]:tracking-normal">
                    {t("home.featuresTitle")}
                  </h2>
                  <p className="mt-3 text-sm sm:base leading-relaxed text-muted-foreground">
                    {t("home.featuresSubtitle")}
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{t("home.featPricing")}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t("home.featuresPricingDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{t("home.featVisits")}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t("home.featuresVisitsDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {t("home.featDeposits")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("home.featuresDepositsDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/properties"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                  >
                    <span>{t("home.browseVerifiedHomes")}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </MotionReveal>

              {/* Right Property Highlights */}
              <MotionReveal
                variant="slideInRight"
                delay={150}
                className="lg:col-span-7 grid gap-6 sm:grid-cols-2"
              >
                {featuredListings.slice(0, 2).map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={isTenant ? favoriteIds.has(String(property.id)) : undefined}
                    isCompared={isTenant ? comparisonIds.has(String(property.id)) : undefined}
                  />
                ))}
              </MotionReveal>
            </div>
          </div>
        </section>

        {/* ========================================================
          6. VERIFIED COMMUNITY GUIDES & LANDLORDS (80s - 92s in Video)
          ======================================================== */}
        <section className="border-t border-border/70 bg-secondary/30 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("home.communityEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("home.communityTitle")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{t("home.communitySubtitle")}</p>
              </div>
            </MotionReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {COMMUNITY_HOSTS.map((person, idx) => (
                <MotionReveal key={person.id} variant="fadeUp" delay={idx * 100}>
                  <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm transition-all hover:shadow-lg hover-lift">
                    <div className="aspect-[4/4] overflow-hidden">
                      <img
                        src={person.img}
                        alt={t(`home.communityHosts.${person.id}.name`)}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-0.5 text-xs font-bold dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t(`home.communityHosts.${person.id}.badge`)}
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-foreground">
                        {t(`home.communityHosts.${person.id}.name`)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(`home.communityHosts.${person.id}.role`)}
                      </p>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
          7. VERIFIED RENTAL JOURNEYS IN KHULNA
          ======================================================== */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("home.verifiedJourneysEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("home.verifiedJourneysTitle")}
                </h2>
              </div>
            </MotionReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <MotionReveal variant="fadeUp" delay={100}>
                <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-8 shadow-sm transition-all hover:shadow-md hover-lift h-full">
                  <div>
                    <div className="flex items-center gap-1 text-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground font-normal">
                      "{t("home.journey1Quote")}"
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-4">
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80"
                      alt={t("home.journey1Author")}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        {t("home.journey1Author")}
                      </h3>
                      <p className="text-xs text-muted-foreground">{t("home.journey1Role")}</p>
                    </div>
                  </div>
                </div>
              </MotionReveal>

              <MotionReveal variant="fadeUp" delay={200}>
                <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-8 shadow-sm transition-all hover:shadow-md hover-lift h-full">
                  <div>
                    <div className="flex items-center gap-1 text-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground font-normal">
                      "{t("home.journey2Quote")}"
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-4">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                      alt={t("home.journey2Author")}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        {t("home.journey2Author")}
                      </h3>
                      <p className="text-xs text-muted-foreground">{t("home.journey2Role")}</p>
                    </div>
                  </div>
                </div>
              </MotionReveal>

              <MotionReveal variant="fadeUp" delay={300}>
                <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-8 shadow-sm transition-all hover:shadow-md hover-lift h-full">
                  <div>
                    <div className="flex items-center gap-1 text-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground font-normal">
                      "{t("home.journey3Quote")}"
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-4">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                      alt={t("home.journey3Author")}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        {t("home.journey3Author")}
                      </h3>
                      <p className="text-xs text-muted-foreground">{t("home.journey3Role")}</p>
                    </div>
                  </div>
                </div>
              </MotionReveal>
            </div>
          </div>
        </section>

        {/* ========================================================
          8. DARK AMBIENT FROSTED GLASS FAQ ACCORDION (97s - 104s in Video)
          ======================================================== */}
        <section id="faq" className="py-20 md:py-28 bg-neutral-950 text-white">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <MotionReveal variant="fadeUp">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {t("home.faqEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {t("home.faqTitle")}
                </h2>
              </div>
            </MotionReveal>

            <MotionReveal variant="fadeUp" delay={150}>
              <div className="mt-12 space-y-4">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.id}
                      className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-md transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-neutral-800/40 focus-visible:outline-2 focus-visible:outline-white"
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <h3 className="text-base sm:text-lg font-bold text-white m-0 p-0">
                          {t(`home.faqItems.${faq.id}.q`)}
                        </h3>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black font-bold">
                          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </span>
                      </button>
                      <div
                        id={`faq-answer-${faq.id}`}
                        hidden={!isOpen}
                        role="region"
                        aria-label={t(`home.faqItems.${faq.id}.q`)}
                        className={`px-6 pb-6 pt-1 text-sm leading-relaxed text-neutral-300 border-t border-neutral-800/60 ${
                          isOpen ? "block animate-fade-in" : "hidden"
                        }`}
                      >
                        {t(`home.faqItems.${faq.id}.a`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* ========================================================
          9. GLASSMORPHIC INQUIRY FORM & EMBEDDED KHULNA MAP (104s - 108s in Video)
          ======================================================== */}
        <section id="contact" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              {/* Left Inquiry Form */}
              <MotionReveal
                variant="slideInLeft"
                className="lg:col-span-6 rounded-3xl border border-border/80 bg-surface p-8 sm:p-10 shadow-lg"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {t("home.inquiryEyebrow")}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {t("home.inquiryTitle")}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("home.inquiryDescription")}
                </p>

                {inquirySubmitted ? (
                  <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center dark:bg-emerald-950 dark:border-emerald-800 animate-fade-in">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="mt-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      {t("home.inquirySuccess")}
                    </h4>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      {t("home.inquiryFollowUp")}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {t("home.yourName")}
                      </label>
                      <input
                        required
                        type="text"
                        placeholder={t("home.namePlaceholder")}
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          {t("home.mobilePhone")}
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="017XXXXXXXX"
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          {t("home.preferredArea")}
                        </label>
                        <select
                          value={inquiryArea}
                          onChange={(e) => setInquiryArea(e.target.value)}
                          className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {activeAreas
                            .filter((a) => a !== "All Areas")
                            .map((a) => (
                              <option key={a} value={a}>
                                {translateArea(a, i18n.language)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {t("home.maxBudgetLabel")}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={inquiryBudget}
                        onChange={(e) => setInquiryBudget(e.target.value)}
                        className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {t("home.specificRequirementsLabel")}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={t("home.specificRequirementsPlaceholder")}
                        value={inquiryNote}
                        onChange={(e) => setInquiryNote(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-background p-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                      <span>{t("home.submitInquiry")}</span>
                    </button>
                  </form>
                )}
              </MotionReveal>

              {/* Right Khulna City Hub Card */}
              <MotionReveal variant="slideInRight" delay={150} className="lg:col-span-6 space-y-6">
                <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-lg hover-lift">
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                    <iframe
                      title="Khulna City Center Map Preview"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=89.50%2C22.80%2C89.58%2C22.90&layer=mapnik"
                      className="h-full w-full border-0 grayscale hover:grayscale-0 transition-all opacity-85"
                    />
                    <div className="absolute top-4 right-4">
                      <a
                        href="https://maps.google.com/?q=Khulna+Bangladesh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-black transition-colors"
                      >
                        <span>{t("home.openInMaps")}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">
                      {t("home.khulnaDeskTitle")}
                    </h3>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{t("home.khulnaDeskAddress")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <span>{t("home.directHotlineLabel")}: +880 1712 345678</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <span>{t("home.verificationDeskLabel")}: verify@thikana.com.bd</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Landlord Fast Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border/80 bg-secondary/50 p-6 sm:p-8 hover-lift">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("home.landlordCtaTitle")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("home.landlordCtaDesc")}
                    </p>
                  </div>
                  <Link
                    to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shrink-0 hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <span>{t("home.listYourHome")}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </MotionReveal>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
