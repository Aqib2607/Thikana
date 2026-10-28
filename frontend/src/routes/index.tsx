import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CalendarCheck,
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
import { PROPERTY_TYPES } from "@/lib/api/properties";
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
    label: "Family Apartments",
    labelBn: "ফ্যামিলি ফ্ল্যাট",
    title: "Spacious Multi-Room Residences in Sonadanga & Boyra",
    titleBn: "সোনাডাঙ্গা ও বয়রায় খোলামেলা পারিবারিক ফ্ল্যাট",
    desc: "Carefully verified 2 to 4-bedroom apartments with separate drawing-dining spaces, secure building entry, dedicated gas line or cylinder, and elevator access.",
    descBn:
      "২ থেকে ৪ রুমের পারিবারিক ফ্ল্যাট, ড্রয়িং-ডাইনিং, নিজস্ব গ্যাস লাইন, সিকিউরিটি গার্ড এবং লিফট সুবিধাসহ খুলনা শহরের সেরা আবাসিক এলাকায়।",
    priceRange: "৳ 12,000 – ৳ 28,000 / mo",
    propertyType: "apartment",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    features: ["Balcony with open view", "24/7 Deep Tube-Well Water", "CCTV & Security Guard"],
  },
  {
    num: "02",
    label: "Bachelor & Student Rooms",
    labelBn: "ব্যাচেলর ও স্টুডেন্ট রুম",
    title: "Quiet Single & Double Rooms Close to KUET & KU",
    titleBn: "কুয়েট ও খুলনা বিশ্ববিদ্যালয়ের সন্নিকটে নিরিবিলি রুম",
    desc: "Independent single and shared bachelor accommodations tailored for students and researchers. High-speed WiFi, generator/IPS backup, and flexible landlord rules.",
    descBn:
      "শিক্ষার্থী ও গবেষকদের জন্য উপযুক্ত সিঙ্গেল এবং ডাবল রুম। দ্রুতগতির ওয়াইফাই, আইপিএস ব্যাকআপ এবং কোনো অনাকাঙ্ক্ষিত বিধিনিষেধ ছাড়াই।",
    priceRange: "৳ 3,000 – ৳ 7,500 / mo",
    propertyType: "bachelor_room",
    image:
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    features: ["High-Speed WiFi Included", "5 Min Walk to Campus", "IPS / Generator Backup"],
  },
  {
    num: "03",
    label: "Mess & Hostels",
    labelBn: "মেস ও হোস্টেল",
    title: "Organized Meal-Inclusive Student Quarters",
    titleBn: "মিল সুবিধাসহ সুশৃঙ্খল স্টুডেন্ট মেস ও হোস্টেল",
    desc: "Community living with managed daily meals, manager-run mess accounts, shared refrigerators, and comfortable study environments in Teligati and Gollamari.",
    descBn:
      "দৈনিক ৩ বেলা স্বাস্থ্যকর খাবার, অভিজ্ঞ মেস ম্যানেজার, ফ্রিজ ও পড়ার উপযোগী পরিবেশসহ সাশ্রয়ী মেস ব্যবস্থা।",
    priceRange: "৳ 2,500 – ৳ 5,500 / mo",
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
    label: "Sublet Rooms",
    labelBn: "সাবলেট রুম",
    title: "Furnished & Semi-Furnished Private Rooms",
    titleBn: "পারিবারিক বাসায় পরিপাটি ও নিরাপদ সাবলেট রুম",
    desc: "Private room inside a peaceful family home with attached bathroom and shared kitchen privileges. Ideal for working professionals and postgraduate researchers.",
    descBn:
      "শান্ত পারিবারিক পরিবেশে এটাচড বাথ ও রান্নাঘরের সুবিধাসহ একা বা দুজনের থাকার জন্য নিরাপদ সাবলেট।",
    priceRange: "৳ 4,500 – ৳ 9,000 / mo",
    propertyType: "sublet",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    features: ["Attached Bathroom", "Shared Kitchen Access", "Quiet Residential Environment"],
  },
  {
    num: "05",
    label: "Commercial & Office Spaces",
    labelBn: "অফিস ও বাণিজ্যিক স্থান",
    title: "Prime Business Hubs along KDA Avenue & Shibbari",
    titleBn: "কেডিএ এভিনিউ ও শিববাড়ি মোড়ে বাণিজ্যিক স্পেস",
    desc: "Roadside commercial spaces, IT office floors, coaching branches, and retail facilities with high footfall and reliable infrastructure.",
    descBn:
      "প্রধান রাস্তার পাশে বাণিজ্যিক ফ্লোর, আইটি অফিস ও কোচিং সেন্টারের জন্য সুপ্রশস্ত জায়গা।",
    priceRange: "৳ 18,000 – ৳ 65,000 / mo",
    propertyType: "commercial",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    features: ["Prime Main Road Access", "High Footfall Hub", "Dedicated Meter & Parking"],
  },
];

const FAQS = [
  {
    q: "How does Thikana verify rental properties in Khulna?",
    qBn: "ঠিকানা কীভাবে খুলনার বাসা ও মেস ভেরিফাই করে?",
    a: "Every listing on Thikana undergoes a strict verification pipeline. We confirm the landlord's national identity, phone number, property ownership/manager status, physical location coordinates, and up-to-date utility bills before issuing the verified checkmark badge.",
    aBn: "ঠিকানায় প্রকাশিত প্রতিটি প্রপার্টির মালিকের জাতীয় পরিচয়পত্র, মোবাইল নম্বর, প্রপার্টির সঠিক লোকেশন এবং ইউটিলিটি বিলের কপি প্ল্যাটফর্মের মাধ্যমে যাচাই করা হয়।",
  },
  {
    q: "Are there any hidden brokerage or middleman fees?",
    qBn: "ঠিকানায় কি কোনো গোপন দালাল বা মিডিয়া ফি রয়েছে?",
    a: "Zero hidden fees. Thikana connects tenants directly with verified homeowners and registered mess managers. You deal transparently without paying arbitrary third-party broker cuts.",
    aBn: "একদমই না। ঠিকানা কোনো মধ্যস্বত্বভোগী বা দালাল ছাড়া সরাসরি ভাড়াটিয়া ও বাড়িওয়ালার মধ্যে যোগাযোগ করিয়ে দেয়। কোনো গোপন চার্জ নেই।",
  },
  {
    q: "How do university students get prioritized rental access?",
    qBn: "বিশ্ববিদ্যালয়ের শিক্ষার্থীরা কীভাবে অগ্রাধিকার পায়?",
    a: "Students from KUET, Khulna University, BL College, and KMC can verify their student institutional email or student ID. This unlocks exclusive verified mess rooms and discounted advance deposit terms.",
    aBn: "কুয়েট, খুলনা বিশ্ববিদ্যালয়, বিএল কলেজ ও কেএমসির শিক্ষার্থীরা স্টুডেন্ট আইডি দিয়ে প্রোফাইল ভেরিফাই করে ক্যাম্পাস সংলগ্ন মেস ও রুমে বিশেষ সুবিধা পান।",
  },
  {
    q: "What is the Three-Property Comparison tool?",
    qBn: "৩টি প্রপার্টির তুলনামূলক ফিচারটি কীভাবে কাজ করে?",
    a: "You can pin up to three properties side-by-side to compare advance deposits, square footage, monthly utility rules, gas cylinder vs pipeline, WiFi speed, and landlord restrictions in a single unified table.",
    aBn: "একসাথে ৩টি বাসা নির্বাচন করে পাশাপাশি রেখে তাদের ভাড়া, সিকিউরিটি ডিপোজিট, গ্যাস-বিদ্যুৎ বিল ও সুবিধার বিস্তারিত তুলনা করতে পারবেন।",
  },
  {
    q: "How can a landlord in Khulna list their home?",
    qBn: "খুলনার একজন বাড়ির মালিক কীভাবে বাসা যুক্ত করবেন?",
    a: "Landlords can register for free, upload high-resolution photos, specify rooms and amenities, and instantly begin receiving verified visit requests through their dedicated landlord portal.",
    aBn: "বাড়ির মালিকরা সম্পূর্ণ বিনামূল্যে রেজিস্ট্রেশন করে তাদের বাসার ছবি, ভাড়ার পরিমাণ ও সুবিধা উল্লেখ করে বিজ্ঞাপন প্রকাশ করতে পারেন।",
  },
];

function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

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
  const featuredListings = MOCK_PROPERTIES.slice(0, 4);

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
                {isBn ? "খুলনার ভেরিফাইড রেন্টাল প্ল্যাটফর্ম" : "Smart Rental Discovery in Khulna"}
              </span>
            </div>
          </MotionReveal>

          {/* Two-Tone Display Headline */}
          <div className="mt-6 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
              <TextReveal className="block text-foreground" delay={80}>
                {isBn ? "খুলনায় আধুনিক ও নিরাপদ আবাসন" : "CRAFTED FOR MODERN LIVING"}
              </TextReveal>
              <TextReveal className="block text-muted-foreground font-medium mt-1" delay={200}>
                {isBn
                  ? "যেখানে প্রতিটি বাড়ি হয়ে ওঠে আপনার আপন ঠিকানা"
                  : "Designed for homes that feel like home."}
              </TextReveal>
            </h1>
            <MotionReveal variant="fadeUp" delay={280}>
              <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                {isBn
                  ? "কুয়েট, খুলনা বিশ্ববিদ্যালয় ও সোনাডাঙ্গার শত শত ভেরিফাইড ফ্ল্যাট, মেস ও ব্যাচেলর রুম। কোনো লুকানো দালাল ছাড়া সরাসরি বাড়িওয়ালার সাথে স্বচ্ছ চুক্তি।"
                  : "Explore verified residential apartments, university student rooms, messes, and executive sublets across Khulna. 100% direct landlord connections with transparent agreements."}
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
                  <span>{isBn ? "বাসা খুঁজুন" : "Explore Properties"}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>{isBn ? "বাড়ি লিস্টিং করুন" : "List Your Home"}</span>
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
                    {isBn ? "খুলনা এলাকা" : "Khulna Area"}
                  </span>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <option value="">{isBn ? "সকল এলাকা (All Khulna)" : "All Khulna Areas"}</option>
                    {KHULNA_AREAS.filter((a) => a !== "All Areas").map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    {isBn ? "প্রপার্টির ধরন" : "Property Type"}
                  </span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <option value="">{isBn ? "সকল ধরন (All Types)" : "All Property Types"}</option>
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {t(`properties.type.${pt}`, pt.replace("_", " "))}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    {isBn ? "সর্বোচ্চ বাজেট (৳)" : "Max Budget (৳)"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    placeholder={isBn ? "যেমন: ৮০০০" : "e.g. 8000"}
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
                    <span>{isBn ? "বাসা খুঁজুন" : "Find Homes ↗"}</span>
                  </button>
                </div>
              </form>

              {/* Quick Campus Zones Pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {isBn ? "জনপ্রিয় এলাকা:" : "Popular Hubs:"}
                </span>
                {[
                  { name: "KUET Gate / Teligati", label: "KUET Gate" },
                  { name: "Gallamari / Zero Point (KU)", label: "KU / Zero Point" },
                  { name: "Sonadanga R/A", label: "Sonadanga R/A" },
                  { name: "Boyra", label: "Boyra & KMC" },
                  { name: "Daulatpur (BL College)", label: "BL College Hub" },
                ].map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleQuickArea(hub.name)}
                    className="rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1 text-xs font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent cursor-pointer"
                  >
                    {hub.label}
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
                      Verified Sonadanga Residency
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
                      <span className="text-xs text-neutral-400 block uppercase">Monthly Rent</span>
                      <span className="text-xl sm:text-2xl font-bold text-white">৳ 16,500</span>
                    </div>
                    <Link
                      to="/properties"
                      className="rounded-full bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-neutral-200 transition-colors"
                    >
                      View Details ↗
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
              {isBn
                ? "খুলনার শীর্ষ শিক্ষা প্রতিষ্ঠান ও কমিউনিটির আস্থা"
                : "Trusted by Students & Residents Across Top Institutions in Khulna"}
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
                {isBn ? "ক্যাটাগরি অনুসন্ধান" : "01 — 05 CATEGORIES"}
              </p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                {isBn
                  ? "খুলনার সকল ধরনের আবাসন এক ঠিকানায়"
                  : "Tailored Living Spaces for Every Need in Khulna"}
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
                      {tab.num}
                    </span>
                    <div className="flex-1">
                      <h3
                        className={`text-base font-bold transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {isBn ? tab.labelBn : tab.label}
                      </h3>
                      {isActive && (
                        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          <p>{isBn ? tab.descBn : tab.desc}</p>
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60">
                            <span className="font-bold text-foreground text-xs">
                              {tab.priceRange}
                            </span>
                            <Link
                              to="/properties"
                              search={{ propertyType: tab.propertyType }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              <span>{isBn ? "প্রপার্টি দেখুন" : "Explore Flats"}</span>
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
                  alt={currentTab.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                {/* Floating pill badge */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-full bg-black/75 px-5 py-3 text-white backdrop-blur-md">
                  <div>
                    <span className="text-xs font-mono text-neutral-400 block">
                      {currentTab.num} / 05
                    </span>
                    <span className="text-sm font-bold">
                      {isBn ? currentTab.titleBn : currentTab.title}
                    </span>
                  </div>
                  <Link
                    to="/properties"
                    search={{ propertyType: currentTab.propertyType }}
                    className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                  >
                    View All ↗
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
                  {isBn ? "বিশেষ সংগ্রহ" : "COLLECTIONS"}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {isBn ? "জীবনযাত্রার ধরন অনুযায়ী বাসা খুঁজুন" : "Browse by Living Style"}
                </h2>
              </div>
              <Link
                to="/properties"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary transition-all"
              >
                <span>{isBn ? "সকল প্রপার্টি দেখুন" : "View Complete Directory"}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </MotionReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Family Residences",
                titleBn: "পারিবারিক ফ্ল্যাট",
                sub: "2-4 Bed Flats in Sonadanga & Boyra",
                price: "From ৳ 12,000",
                type: "apartment",
                img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                count: "18 Homes",
              },
              {
                title: "Bachelor Single Rooms",
                titleBn: "ব্যাচেলর সিঙ্গেল রুম",
                sub: "High Speed WiFi, Walk to KUET & KU",
                price: "From ৳ 3,500",
                type: "bachelor_room",
                img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
                count: "24 Rooms",
              },
              {
                title: "Student Mess & Hostels",
                titleBn: "মেস ও হোস্টেল ব্যবস্থা",
                sub: "3 Meals Daily, Study Friendly",
                price: "From ৳ 2,800",
                type: "hostel",
                img: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80",
                count: "12 Hostels",
              },
              {
                title: "Sublet & Studio Units",
                titleBn: "সাবলেট ও স্টুডিও রুম",
                sub: "Attached Bath, Kitchen Access",
                price: "From ৳ 4,500",
                type: "sublet",
                img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
                count: "9 Units",
              },
            ].map((col, idx) => (
              <MotionReveal key={col.type} variant="fadeUp" delay={idx * 90}>
                <Link
                  to="/properties"
                  search={{ propertyType: col.type }}
                  className="group relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm transition-all hover:shadow-xl hover-lift block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={col.img}
                      alt={col.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                      <h3 className="text-lg font-bold leading-tight">
                        {isBn ? col.titleBn : col.title}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-300 line-clamp-1">{col.sub}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2.5">
                        <span className="text-xs font-medium text-neutral-200">
                          {col.count} · {col.price}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                          <span>Explore</span>
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
            {/* Left Big Editorial Column (Balanced with adjacent cards) */}
            <MotionReveal
              variant="slideInLeft"
              className="lg:col-span-5 flex flex-col justify-center space-y-6"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {isBn ? "ঠিকানার বৈশিষ্ট্য" : "CURATED SPACES"}
                </p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                  {isBn ? "স্বচ্ছতা ও নিশ্চয়তার মেলবন্ধন" : "Homes Made for Every Moment"}
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {isBn
                    ? "ঠিকানায় প্রতিটি প্রপার্টি সরাসরি অডিট করা। সঠিক রুম সাইজ, ভেরিফাইড ইউটিলিটি বিল, কোনো দালাল ছাড়া মালিকের সাথে সরাসরি চুক্তি।"
                    : "Every property on Thikana is verified on the ground. Transparent pricing, zero middleman cuts, verified security deposits, and legitimate landlord contacts."}
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isBn ? "১০০% নিশ্চিত ভাড়ার হিসাব" : "100% Upfront Pricing"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isBn
                        ? "ভাড়া, সিকিউরিটি ডিপোজিট ও ইউটিলিটি রুলস শুরুতেই স্পষ্ট।"
                        : "Rent, advance deposit, service charges, and electricity rules clearly documented."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isBn ? "সরাসরি ভিজিট ও বুকিং" : "Direct Scheduled Visits"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isBn
                        ? "প্ল্যাটফর্মের মাধ্যমেই পছন্দসই সময়ে বাসা পরিদর্শনের অনুরোধ পাঠান।"
                        : "Book physical walkthroughs with landlords with calendar confirmation."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1 text-primary shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isBn ? "নিরাপদ অগ্রিম জামানত" : "Verified Security Deposits"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isBn
                        ? "খুলনার প্রচলিত নিয়মানুযায়ী স্বচ্ছ অগ্রিম শর্তাবলী ও রশিদ নিশ্চয়তা।"
                        : "Standard Khulna residential advance terms with verified receipts."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                >
                  <span>{isBn ? "ভেরিফাইড বাসা দেখুন" : "Browse Verified Homes"}</span>
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
                {isBn ? "কমিউনিটি" : "OUR COMMUNITY"}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isBn ? "ভেরিফাইড বাড়িওয়ালা ও ক্যাম্পাস গাইড" : "Verified Landlords & Local Guides"}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {isBn
                  ? "খুলনার বিভিন্ন এলাকার নির্ভরযোগ্য হোস্টদের সাথে সরাসরি পরিচিত হোন।"
                  : "Meet the trusted property hosts and campus housing advisors ensuring transparent living in Khulna."}
              </p>
            </div>
          </MotionReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Engr. Rafiqul Islam",
                nameBn: "ইঞ্জি. রফিকুল ইসলাম",
                role: "Sonadanga Residential Host · 8 Properties",
                roleBn: "সোনাডাঙ্গা আবাসিক হোস্ট · ৮টি প্রপার্টি",
                badge: "Verified Landlord · 4.9 ★ (32 Reviews)",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Tanvir Ahmed",
                nameBn: "তানভীর আহমেদ",
                role: "KUET Student Housing Guide · Teligati",
                roleBn: "কুয়েট ক্যাম্পাস গাইড · টেলিগাতী হাব",
                badge: "Campus Ambassador · KUET CSE '22",
                img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Nasreen Sultana",
                nameBn: "নাসরীন সুলতানা",
                role: "Boyra Family Residence Host · 5 Flats",
                roleBn: "বয়রা ফ্যামিলি হোস্ট · ৫টি ফ্ল্যাট",
                badge: "Verified Landlord · 5.0 ★ (19 Reviews)",
                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
              },
            ].map((person, idx) => (
              <MotionReveal key={person.name} variant="fadeUp" delay={idx * 100}>
                <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm transition-all hover:shadow-lg hover-lift">
                  <div className="aspect-[4/4] overflow-hidden">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-0.5 text-xs font-bold dark:bg-emerald-950 dark:text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {person.badge}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-foreground">
                      {isBn ? person.nameBn : person.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isBn ? person.roleBn : person.role}
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
                {isBn ? "ভাড়াটিয়াদের মতামত" : "EXPERIENCES"}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isBn
                  ? "খুলনার হাজারো ভাড়াটিয়ার অভিজ্ঞতা"
                  : "Loved by Thousands of Tenants in Khulna"}
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
                {isBn ? "সাধারণ জিজ্ঞাসা" : "FREQUENTLY ASKED QUESTIONS"}
              </p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                {isBn ? "বাসা ভাড়া সংক্রান্ত যাবতীয় প্রশ্নের উত্তর" : "Everything You Need to Know"}
              </h2>
            </div>
          </MotionReveal>

          <MotionReveal variant="fadeUp" delay={150}>
            <div className="mt-12 space-y-4">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-md transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-neutral-800/40"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-bold text-white">
                        {isBn ? faq.qBn : faq.q}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black font-bold">
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 text-sm leading-relaxed text-neutral-300 border-t border-neutral-800/60 animate-fade-in">
                        {isBn ? faq.aBn : faq.a}
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
                {isBn ? "সরাসরি রেন্টাল ইনকোয়ারি" : "Direct Rental Match"}
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {isBn ? "আপনার কাঙ্ক্ষিত বাসার বিবরণ দিন" : "Can't Find What You're Looking For?"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBn
                  ? "আপনার চাহিদা ও বাজেট জানান। ঠিকানার খুলনা টিম আপনার চাহিদামতো ভেরিফাইড বাড়িওয়ালাদের সাথে সরাসরি যোগাযোগ করিয়ে দেবে।"
                  : "Submit your requirements and our Khulna team will match you with verified landlords matching your budget and campus proximity."}
              </p>

              {inquirySubmitted ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center dark:bg-emerald-950 dark:border-emerald-800 animate-fade-in">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="mt-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {isBn ? "ইনকোয়ারি সফলভাবে জমা হয়েছে!" : "Inquiry Submitted Successfully!"}
                  </h4>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {isBn
                      ? "আমাদের খুলনা সাপোর্ট টিম শীঘ্রই আপনার নম্বরে যোগাযোগ করবে।"
                      : "Our Khulna housing team will contact you within 24 hours."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {isBn ? "আপনার নাম" : "Your Name"}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={isBn ? "যেমন: তানজিল আহমেদ" : "e.g. Tanzil Ahmed"}
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        {isBn ? "মোবাইল নম্বর" : "Mobile Phone"}
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
                        {isBn ? "পছন্দের এলাকা" : "Preferred Area"}
                      </label>
                      <select
                        value={inquiryArea}
                        onChange={(e) => setInquiryArea(e.target.value)}
                        className="h-11 w-full rounded-full border border-border bg-background px-4 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {KHULNA_AREAS.filter((a) => a !== "All Areas").map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {isBn ? "সর্বোচ্চ বাজেট (টাকা/মাস)" : "Max Budget (BDT / month)"}
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
                      {isBn
                        ? "নির্দিষ্ট কোনো চাহিদা (রুম সাইজ, গ্যাস, ওয়াইফাই ইত্যাদি)"
                        : "Specific Requirements"}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        isBn
                          ? "যেমন: ২ বেড, অ্যাটাচড বাথ, কুয়েটের কাছে হতে হবে..."
                          : "e.g. Need 2 bedrooms with attached bath near KUET gate..."
                      }
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
                    <span>{isBn ? "ইনকোয়ারি পাঠান" : "Submit Rental Request ↗"}</span>
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
                      <span>Open in Maps</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Thikana Khulna Operations & Verification Desk
                  </h3>
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        KDA Avenue, Sonadanga, Khulna (Covering KUET, KU, Boyra, Daulatpur & Zero
                        Point)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>Direct Hotline: +880 1712 345678</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span>Verification Desk: verify@thikana.com.bd</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord Fast Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border/80 bg-secondary/50 p-6 sm:p-8 hover-lift">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isBn ? "আপনি কি বাড়িওয়ালা?" : "Are You a Khulna Landlord?"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isBn
                      ? "বিনা খরচে বিজ্ঞাপন দিন এবং সরাসরি নির্ভরযোগ্য ভাড়াটিয়া পান।"
                      : "List your property in under 3 minutes and connect with verified university students."}
                  </p>
                </div>
                <Link
                  to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shrink-0 hover:opacity-90 transition-opacity shadow-xs"
                >
                  <span>{isBn ? "বাড়ি লিস্টিং করুন" : "List Your Home"}</span>
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
