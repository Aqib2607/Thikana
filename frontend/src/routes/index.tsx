import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  Percent,
  Columns3,
  ShieldCheck,
  Lock,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_PROPERTIES, KHULNA_AREAS } from "@/lib/api/mock/properties";
import { PROPERTY_TYPES } from "@/lib/api/properties";
import { useAuth } from "@/lib/auth";

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

function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

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

  const features = [
    {
      icon: Percent,
      title: isBn ? "স্মার্ট ম্যাচিং স্কোর" : "Weighted Matching Score",
      desc: isBn
        ? "লোকেশন (৩০%), বাজেট (২৫%), সুযোগ-সুবিধা ও রুম সাইজের ভিত্তিতে আপনার পছন্দের নিখুঁত হিসাব।"
        : "Automated weighted score evaluating location, budget, room size, and desired amenities.",
    },
    {
      icon: Columns3,
      title: isBn ? "৩টি প্রপার্টির বিস্তারিত তুলনা" : "Three-Property Comparison",
      desc: isBn
        ? "ভাড়া, সিকিউরিটি ডিপোজিট, ইউটিলিটি বিল এবং সুবিধা পাশাপাশি রেখে সিদ্ধান্ত নিন।"
        : "Compare advance deposit, bills, square footage, and amenities side-by-side.",
    },
    {
      icon: ShieldCheck,
      title: isBn ? "সিমুলেটেড ভেরিফিকেশন ও সেফটি" : "Simulated Verifications",
      desc: isBn
        ? "মালিকের পরিচয়, ফোন নম্বর ও সত্যতা প্ল্যাটফর্ম-লেভেলে যাচাইকৃত।"
        : "Platform-level owner identity and availability checks before you visit.",
    },
  ];

  const field =
    "h-12 w-full rounded-lg border border-input bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary";

  const featuredListings = MOCK_PROPERTIES.slice(0, 4);

  return (
    <AppShell>
      {/* Search-First Hero Section */}
      <section className="relative overflow-hidden bg-hero pb-20 pt-12 md:pb-28 md:pt-20">
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-surface px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>
                {isBn
                  ? "খুলনার প্রথম অ্যাকাডেমিক রেন্টাল প্ল্যাটফর্ম"
                  : "Academic-First Rental Platform in Khulna"}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.15]">
              {isBn
                ? "খুলনায় ক্যাম্পাস ও পরিবারের জন্য নিশ্চিত ভেরিফাইড ঠিকানা"
                : "Find Verified Academic & Family Rentals in Khulna"}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {isBn
                ? "কুয়েট, খুলনা বিশ্ববিদ্যালয় ও বিএল কলেজ সংলগ্ন ফ্ল্যাট, মেস, রুম ও সাবলেট আবিষ্কার করুন কোনো গোপন দালালি ছাড়াই।"
                : "Explore verified apartments, student rooms, messes, and sublets near KUET, Khulna University, and Sonadanga with public addresses and community reports."}
            </p>
          </div>

          {/* Search Card Form */}
          <form
            role="search"
            onSubmit={handleSearch}
            className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-lg md:p-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                <span>{isBn ? "খুলনা এলাকা" : "Khulna Area"}</span>
                <select
                  className={field}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <option value="">{isBn ? "সকল এলাকা নির্বাচন করুন" : "Select Area"}</option>
                  {KHULNA_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                <span>{isBn ? "প্রপার্টির ধরন" : "Property Type"}</span>
                <select
                  className={field}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">{isBn ? "সকল ধরন" : "All Types"}</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                <span>{isBn ? "সর্বোচ্চ বাজেট (৳)" : "Max Budget (৳)"}</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  placeholder={isBn ? "যেমন: ৮০০০" : "e.g. 8000"}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className={field}
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>{isBn ? "খুঁজুন" : "Search Homes"}</span>
                </button>
              </div>
            </div>

            {/* Quick Campus Zones Presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {isBn ? "জনপ্রিয় এলাকা:" : "Popular Zones:"}
              </span>
              <button
                type="button"
                onClick={() => handleQuickArea("KUET Gate / Teligati")}
                className="rounded-pill bg-secondary px-3 py-1 font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                KUET Gate / Teligati
              </button>
              <button
                type="button"
                onClick={() => handleQuickArea("Gallamari / Zero Point (KU)")}
                className="rounded-pill bg-secondary px-3 py-1 font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                KU / Gallamari
              </button>
              <button
                type="button"
                onClick={() => handleQuickArea("Sonadanga R/A")}
                className="rounded-pill bg-secondary px-3 py-1 font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Sonadanga R/A
              </button>
              <button
                type="button"
                onClick={() => handleQuickArea("Boyra")}
                className="rounded-pill bg-secondary px-3 py-1 font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Boyra
              </button>
            </div>
          </form>

          {/* Access Policy Note */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isBn
                ? "বিজ্ঞাপনের বিস্তারিত দেখতে এবং বুকিং রিকোয়েস্ট পাঠাতে লগইন প্রয়োজন।"
                : "Login is required for full search results, direct messaging, and visit booking."}
            </span>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20" aria-labelledby="featured-heading">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "নির্বাচিত বাসা" : "Hand-Picked"}</span>
            </div>
            <h2
              id="featured-heading"
              className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
            >
              {isBn ? "খুলনার ভেরিফাইড নতুন বাসা ও মেস" : "Verified Listings in Khulna"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isBn
                ? "বাস্তব ছবি, নিশ্চিত ভাড়া এবং গ্রাউন্ড-লেভেল কমিউনিটি ইনফোসহ"
                : "Real photos, upfront rental rates, and student neighborhood reports"}
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span>{isBn ? "সকল প্রপার্টি দেখুন" : "Browse All Listings"}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredListings.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="border-t border-border bg-secondary/30 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {isBn ? "কেন ঠিকানায় বাসা খুঁজবেন?" : "Why Rent Through Thikana?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isBn
                ? "খুলনার শিক্ষার্থীদের ভোগান্তি দূর করতে আধুনিক সব ফিচার"
                : "Modern tools built specifically to solve student rental challenges in Bangladesh"}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-xs"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Landlord CTA Banner */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-surface border border-border p-8 text-center md:flex-row md:text-left md:p-12 shadow-md">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>{isBn ? "বাড়ির মালিকদের জন্য" : "For Khulna Landlords"}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {isBn
                ? "আপনার বাসা বা মেসের বিজ্ঞাপন দিন বিনামূল্যে"
                : "List Your Property & Connect with Verified Students"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isBn
                ? "সহজেই ৫টি ছবি আপলোড করুন, নিজস্ব সুবিধার তালিকা দিন এবং সরাসরি নির্ভরযোগ্য ভাড়াটিয়াদের ভিজিট রিকোয়েস্ট ম্যানেজ করুন।"
                : "Manage visits, control public contact privacy, and receive structured tenant requests without middleman fees."}
            </p>
          </div>
          <Link
            to={user?.role === "landlord" ? "/landlord/dashboard" : "/register"}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            <span>{isBn ? "বিজ্ঞাপন যোগ করুন" : "Add Property Listing"}</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
