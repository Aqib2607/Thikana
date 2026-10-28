import { useState, type FormEvent } from "react";
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
  SlidersHorizontal,
  Home,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_PROPERTIES, KHULNA_AREAS } from "@/lib/api/mock/properties";
import { propertyApi, PROPERTY_TYPES } from "@/lib/api/properties";
import { translateArea, translatePropertyType, toBnNumber } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { ImageMaskReveal } from "@/components/motion/ImageMaskReveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thikana — Verified Rental Homes in Khulna" },
      {
        name: "description",
        content:
          "Search, compare and visit verified flats, student rooms, messes and sublets in Khulna. Bangla-first, KUET & Khulna University student prioritized.",
      },
      { property: "og:title", content: "Thikana — Verified Rental Homes in Khulna" },
      {
        property: "og:description",
        content:
          "Academic rental discovery in Khulna with exact public addresses, community insights, and simulated verifications.",
      },
      { property: "og:type", content: "website" },
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
  const { data: featuredData } = useQuery({
    queryKey: ["featuredProperties"],
    queryFn: () => propertyApi.list({ limit: 4, sortBy: "rating" }),
  });
  const featuredListings =
    featuredData?.data && featuredData.data.length > 0
      ? featuredData.data
      : MOCK_PROPERTIES.slice(0, 4);

  return (
    <AppShell>
      {/* ========================================================
          1. HERO SECTION (Reference Video 0s-15s: Two-Tone Typography,
             Pill Buttons, Social Stack, High-End Residential Imagery)
          ======================================================== */}
      <section className="relative overflow-hidden pt-6 pb-20 md:pt-12 md:pb-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Overline Chip */}
          <MotionReveal variant="fadeDown" duration={600}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="tracking-wide">
                {t("home.heroBadge")}
              </span>
            </div>
          </MotionReveal>

          {/* Two-Tone Display Headline */}
          <div className="mt-6 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
              <TextReveal className="block text-foreground" delay={80}>
                {t("home.heroSub")}
              </TextReveal>
              <TextReveal className="block text-muted-foreground font-medium mt-1" delay={200}>
                {t("home.heroTagline")}
              </TextReveal>
            </h1>
            <MotionReveal variant="fadeUp" delay={280}>
              <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                {t("home.heroSubtitle2")}
              </p>
            </MotionReveal>
          </div>

          {/* Dual Pill CTA Buttons & Social Proof Stack */}
          <MotionReveal variant="fadeUp" delay={380}>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>{t("home.exploreProperties")}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>{t("home.listYourHome")}</span>
                </Link>
              </div>

              {/* Social Proof Avatar Stack */}
              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-border/80 pt-4 sm:pt-0 sm:pl-6">
                <div className="flex -space-x-2">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="Tenant"
                    className="h-9 w-9 rounded-full border-2 border-surface object-cover shadow-xs"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="Tenant"
                    className="h-9 w-9 rounded-full border-2 border-surface object-cover shadow-xs"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                    alt="Tenant"
                    className="h-9 w-9 rounded-full border-2 border-surface object-cover shadow-xs"
                  />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-1 text-gold font-bold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                    ))}
                    <span className="ml-1 text-foreground font-semibold">4.9 / 5</span>
                  </div>
                  <p className="text-muted-foreground font-medium">
                    10,000+ Happy Renters in Khulna
                  </p>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* Floating Search & Filter Pill Card */}
          <MotionReveal variant="fadeUp" delay={460}>
            <div className="mt-12 rounded-3xl border border-border/80 bg-surface/95 p-4 sm:p-6 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.07)] backdrop-blur-md">
              <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("properties.khulnaArea")}
                  </span>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <option value="">{t("home.allKhulnaAreas")}</option>
                    {KHULNA_AREAS.filter((a) => a !== "All Areas").map((a) => (
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
                    className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
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
                    className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Search className="h-4 w-4" />
                    <span>{t("home.exploreProperties")} ↗</span>
                  </button>
                </div>
              </form>

              {/* Quick Campus Zones Pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
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
                    className="rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1 text-xs font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent cursor-pointer"
                  >
                    {translateArea(hub.name, i18n.language)}
                  </button>
                ))}
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
                      {t("properties.verifiedBadge")} · {translateArea("Sonadanga R/A", i18n.language)}
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
                      className="rounded-full bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-neutral-200 transition-colors"
                    >
                      {t("common.viewDetails")} ↗
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
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold tracking-wider text-muted-foreground grayscale hover:grayscale-0 transition-all opacity-75">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-foreground" />
                <span>KUET (খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়)</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-foreground" />
                <span>Khulna University (KU)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-foreground" />
                <span>Khulna Medical College (KMC)</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-foreground" />
                <span>Govt. B.L. College</span>
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
          3. NUMBERED 01-05 INTERACTIVE SHOWCASE (22s - 45s in Video)
          ======================================================== */}
      <section id="categories" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <MotionReveal variant="fadeUp">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("home.categoriesEyebrow")}
              </p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                {t("home.livingSpacesTitle")}
              </h2>
            </div>
          </MotionReveal>

          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Interactive Tabs */}
            <MotionReveal variant="slideInLeft" delay={150} className="space-y-4 lg:col-span-5">
              {SHOWCASE_TABS.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.num}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left rounded-2xl p-5 transition-all flex items-start gap-4 border ${
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
                              ৳ {toBnNumber(tab.minRent, i18n.language)} – ৳ {toBnNumber(tab.maxRent, i18n.language)} / {t("properties.perMonth")}
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
            </MotionReveal>

            {/* Right Showcase Large Image */}
            <MotionReveal variant="slideInRight" delay={250} className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-border/80 shadow-2xl aspect-[4/3] sm:aspect-[16/11]">
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
                      {toBnNumber(currentTab.num, i18n.language)} / {toBnNumber("05", i18n.language)}
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
      <section className="border-t border-border/70 bg-secondary/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <MotionReveal variant="fadeUp">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                      <h3 className="text-lg font-bold leading-tight">
                        {t(`home.collectionsItems.${col.key}.title`)}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-300 line-clamp-1">
                        {t(`home.collectionsItems.${col.key}.sub`)}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2.5">
                        <span className="text-xs font-medium text-neutral-200">
                          {t(`home.collectionsItems.${col.key}.count`)} · {t(`home.collectionsItems.${col.key}.price`)}
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
                <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
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
                    <h3 className="text-sm font-bold text-foreground">
                      {t("home.featPricing")}
                    </h3>
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
                    <h3 className="text-sm font-bold text-foreground">
                      {t("home.featVisits")}
                    </h3>
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
                <PropertyCard key={property.id} property={property} />
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
              <p className="mt-3 text-sm text-muted-foreground">
                {t("home.communitySubtitle")}
              </p>
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
          7. TESTIMONIAL CARDS WITH 5 GOLD STARS (92s - 97s in Video)
          ======================================================== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <MotionReveal variant="fadeUp">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("home.reviewsEyebrow")}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t("home.experienceTitle")}
              </h2>
            </div>
          </MotionReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                quote:
                  "কুয়েটে ভর্তির পর টেলিগাতীতে বাসা খুঁজতে গিয়ে দালালের ভোগান্তিতে পড়েছিলাম। ঠিকানার মাধ্যমে সরাসরি বাড়িওয়ালার সাথে কথা বলে ২ দিনের মধ্যে ভেরিফাইড রুম নিয়েছি।",
                author: "Tahmid Hasan",
                role: "KUET ME '21 · Teligati Resident",
                img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
              },
              {
                quote:
                  "Moving our family from Dhaka to Khulna for a bank posting felt seamless. The side-by-side comparison showed exact Sonadanga utility rules and deposit amounts upfront.",
                author: "Mahmudul Karim",
                role: "Senior Officer, Sonali Bank Khulna",
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
              },
              {
                quote:
                  "খুলনা বিশ্ববিদ্যালয়ের কাছাকাছি নিরিবিলি সাবলেট খুঁজে পাওয়া সত্যিই কঠিন ছিল। ঠিকানার ফিল্টার এবং পাবলিক লোকেশন দেখে এক দেখাতেই পছন্দ হয়েছে।",
                author: "Sadia Afrin",
                role: "Masters Researcher, Khulna University",
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
              },
            ].map((tItem, idx) => (
              <MotionReveal key={idx} variant="fadeUp" delay={idx * 100}>
                <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-8 shadow-sm transition-all hover:shadow-md hover-lift h-full">
                  <div>
                    <div className="flex items-center gap-1 text-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground font-normal">
                      "{tItem.quote}"
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-4">
                    <img
                      src={tItem.img}
                      alt={tItem.author}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{tItem.author}</h3>
                      <p className="text-xs text-muted-foreground">{tItem.role}</p>
                    </div>
                  </div>
                </div>
              </MotionReveal>
            ))}
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
                      className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-neutral-800/40"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-bold text-white">
                        {t(`home.faqItems.${faq.id}.q`)}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black font-bold">
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 text-sm leading-relaxed text-neutral-300 border-t border-neutral-800/60 animate-fade-in">
                        {t(`home.faqItems.${faq.id}.a`)}
                      </div>
                    )}
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
                        {KHULNA_AREAS.filter((a) => a !== "All Areas").map((a) => (
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
    </AppShell>
  );
}
