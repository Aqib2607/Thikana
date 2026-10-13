import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Building,
  ShieldCheck,
  Calendar,
  Layers,
  Heart,
  Scale,
  MessageSquare,
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Lock,
  ArrowLeft,
  Share2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ImageGallery } from "@/components/property/ImageGallery";
import { CommunityInfoCard } from "@/components/property/CommunityInfoCard";
import { MatchBreakdownCard } from "@/components/property/MatchBreakdownCard";
import { mockProperties, calculateMatchBreakdown } from "@/lib/api/mock/properties";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "Property Details — Thikana" },
      {
        name: "description",
        content:
          "View verified rental details, exact public address, and community reports in Khulna.",
      },
    ],
  }),
  component: PropertyDetailsPage,
});

function PropertyDetailsPage() {
  const { propertyId } = useParams({ from: "/properties/$propertyId" });
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [visitRequested, setVisitRequested] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => mockProperties.getById(propertyId),
  });

  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const saved = localStorage.getItem("thikana.favorites");
      const list: string[] = saved ? JSON.parse(saved) : [];
      return list.includes(propertyId);
    } catch {
      return false;
    }
  });

  const [isCompared, setIsCompared] = useState(() => {
    try {
      const saved = localStorage.getItem("thikana.comparison");
      const list: string[] = saved ? JSON.parse(saved) : [];
      return list.includes(propertyId);
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem("thikana.favorites");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(propertyId)) {
        list = list.filter((id) => id !== propertyId);
        setIsFavorite(false);
      } else {
        list.push(propertyId);
        setIsFavorite(true);
      }
      localStorage.setItem("thikana.favorites", JSON.stringify(list));
      window.dispatchEvent(new Event("thikana.favorites.updated"));
    } catch {
      // Ignore
    }
  };

  const toggleCompare = () => {
    try {
      const saved = localStorage.getItem("thikana.comparison");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(propertyId)) {
        list = list.filter((id) => id !== propertyId);
        setIsCompared(false);
      } else {
        if (list.length >= 3) {
          alert(
            isBn
              ? "সর্বোচ্চ ৩টি প্রপার্টি একসাথে তুলনা করা যায়।"
              : "You can compare up to 3 properties at a time.",
          );
          return;
        }
        list.push(propertyId);
        setIsCompared(true);
      }
      localStorage.setItem("thikana.comparison", JSON.stringify(list));
      window.dispatchEvent(new Event("thikana.comparison.updated"));
    } catch {
      // Ignore
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/40" />
        </div>
      </AppShell>
    );
  }

  if (isError || !property) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {isBn ? "প্রপার্টি খুঁজে পাওয়া যায়নি" : "Property Not Found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isBn
              ? "এই প্রপার্টিটি হয়তো মুছে ফেলা হয়েছে বা লিঙ্কটি ভুল।"
              : "The listing may have been rented or removed by the landlord."}
          </p>
          <Link
            to="/properties"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{isBn ? "সকল প্রপার্টিতে ফিরে যান" : "Back to All Listings"}</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Matching Score calculation
  const tenantPrefs =
    user?.role === "tenant" ? { maxBudget: 10000, preferredArea: property.area } : null;
  const matchBreakdown = calculateMatchBreakdown(property, tenantPrefs);

  return (
    <AppShell>
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-border bg-secondary/10 py-3.5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              {isBn ? "হোম" : "Home"}
            </Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-foreground">
              {isBn ? "প্রপার্টি তালিকা" : "Properties"}
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-foreground">{property.area}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Title Header with Action Badges */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-foreground/90 px-3 py-1 text-xs font-semibold text-background">
                {property.propertyType}
              </span>
              <span className="rounded-pill bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                {property.rentalType}
              </span>
              <span
                className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                  property.availability === "Available"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {property.availability}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {isBn && property.banglaTitle ? property.banglaTitle : property.title}
            </h1>

            {/* Public Exact Address per Prompt Specification */}
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong>{isBn ? "সরাসরি ঠিকানা:" : "Exact Address:"}</strong>{" "}
                {property.exactAddress}
              </span>
            </p>
          </div>

          {/* Action Buttons: Compare, Favorite, Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCompare}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                isCompared
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-secondary"
              }`}
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              <span>
                {isCompared
                  ? isBn
                    ? "তুলনায় যুক্ত"
                    : "Comparing"
                  : isBn
                    ? "তুলনা করুন"
                    : "Compare"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                isFavorite
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-border bg-surface text-foreground hover:bg-secondary"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
              <span>{isFavorite ? (isBn ? "সেভড" : "Saved") : isBn ? "পছন্দ" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* 5-Image Gallery */}
        <div className="mt-6">
          <ImageGallery images={property.images} title={property.title} />
        </div>

        {/* Two-Column Layout: Details Specs vs Sidebar Booking Box */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Main Info Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Quick Specs Highlight Bar */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Bed className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "বেডরুম" : "Bedrooms"}
                  </span>
                  <span className="text-sm font-bold text-foreground">{property.rooms}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Bath className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "বাথরুম" : "Bathrooms"}
                  </span>
                  <span className="text-sm font-bold text-foreground">{property.bathrooms}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Maximize2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "আয়তন" : "Size"}
                  </span>
                  <span className="text-sm font-bold text-foreground">{property.size} sqft</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "ফ্লোর" : "Floor"}
                  </span>
                  <span className="text-sm font-bold text-foreground">{property.floor}</span>
                </div>
              </div>
            </div>

            {/* Financial Details (Advance, Bills, Utility) */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h2 className="text-lg font-bold text-foreground">
                {isBn ? "ভাড়া ও আর্থিক শর্তাবলী" : "Financial Terms & Deposits"}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "মাসিক ভাড়া" : "Monthly Rent"}
                  </span>
                  <span className="mt-1 block text-xl font-bold text-foreground">
                    ৳{property.rent.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "অগ্রিম / জামানত" : "Advance Deposit"}
                  </span>
                  <span className="mt-1 block text-xl font-bold text-foreground">
                    ৳{property.advance.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
                  <span className="block text-xs text-muted-foreground">
                    {isBn ? "সার্ভিস ও ইউটিলিটি" : "Additional Service"}
                  </span>
                  <span className="mt-1 block text-xl font-bold text-foreground">
                    ৳{property.additionalCharges.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <span className="text-xs font-semibold text-foreground">
                  {isBn ? "ভাড়ার সাথে অন্তর্ভুক্ত বিল:" : "Bills Included in Rent:"}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {property.billsIncluded.map((bill) => (
                    <span
                      key={bill}
                      className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{bill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h2 className="text-lg font-bold text-foreground">
                {isBn ? "উপলব্ধ সুযোগ-সুবিধাসমূহ" : "Available Amenities"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/20 p-2.5 text-xs font-medium text-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Verifications Box with Clear Platform Label */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground">
                  {isBn
                    ? "ঠিকানা ভেরিফিকেশন রিপোর্ট (সিমুলেটেড)"
                    : "Platform Simulated Verifications"}
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isBn
                  ? "সতর্কতা: এটি ঠিকানা প্ল্যাটফর্মের অভ্যন্তরীণ সিমুলেটেড ডেটা, সরকারি প্রত্যয়ন নয়।"
                  : "Note: These represent platform-level simulated identity checks, not government certifications."}
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {property.verifications.map((v) => (
                  <div
                    key={v}
                    className="flex items-center gap-2 rounded-lg bg-surface border border-border/80 px-3 py-2 text-xs font-semibold text-foreground shadow-2xs"
                  >
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Intelligence Section */}
            <CommunityInfoCard community={property.community} areaName={property.area} />

            {/* Match Breakdown Card */}
            <MatchBreakdownCard breakdown={matchBreakdown} />
          </div>

          {/* Sticky Action Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Rent & Action Card */}
            <div className="sticky top-20 rounded-2xl border border-border bg-surface p-6 shadow-md">
              <div className="flex items-baseline justify-between border-b border-border pb-4">
                <div>
                  <span className="text-2xl font-black text-foreground md:text-3xl">
                    ৳{property.rent.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    /{isBn ? "মাস" : "month"}
                  </span>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {property.availability}
                </span>
              </div>

              {/* Action Buttons: Visit Request & Contact */}
              <div className="mt-5 space-y-3">
                {visitRequested ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-center text-xs font-medium text-primary">
                    <CheckCircle className="mx-auto mb-1 h-5 w-5" aria-hidden="true" />
                    <span>
                      {isBn
                        ? "ভিজিট রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে (Pending)"
                        : "Visit Request Submitted (Pending)"}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        alert(
                          isBn
                            ? "ভিজিট রিকোয়েস্ট পাঠাতে দয়া করে লগইন করুন।"
                            : "Please log in to request a visit.",
                        );
                        return;
                      }
                      setVisitRequested(true);
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                  >
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{isBn ? "সরাসরি ভিজিটের আবেদন" : "Schedule a Visit"}</span>
                  </button>
                )}

                {contactRequested ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-center text-xs font-medium text-primary">
                    <CheckCircle className="mx-auto mb-1 h-5 w-5" aria-hidden="true" />
                    <span>{isBn ? "যোগাযোগের আবেদন পাঠানো হয়েছে" : "Contact Request Sent"}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        alert(
                          isBn
                            ? "মালিককে মেসেজ করতে দয়া করে লগইন করুন।"
                            : "Please log in to send a contact request.",
                        );
                        return;
                      }
                      setContactRequested(true);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isBn ? "যোগাযোগের আবেদন (Contact Request)" : "Send Contact Request"}
                    </span>
                  </button>
                )}
              </div>

              {/* Landlord Profile & Privacy Setting */}
              <div className="mt-6 border-t border-border pt-5">
                <span className="text-xs font-semibold text-foreground">
                  {isBn ? "বাড়ির মালিকের তথ্য" : "Landlord Overview"}
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={property.landlord.avatar}
                    alt={property.landlord.name}
                    className="h-11 w-11 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{property.landlord.name}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {isBn
                        ? `সদস্য: ${property.landlord.memberSince}`
                        : `Member since: ${property.landlord.memberSince}`}
                    </span>
                  </div>
                </div>

                {/* Respect Landlord Contact Privacy Setting */}
                <div className="mt-4 rounded-xl border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  {property.landlord.publicContactVisible ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span>{property.landlord.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>{property.landlord.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Lock
                        className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {isBn
                          ? "মালিক সরাসরি নম্বর গোপন রেখেছেন। যোগাযোগের আবেদন অনুমোদন হলে মেসেজিং আনলক হবে।"
                          : "Contact details hidden by landlord. Messaging unlocks upon contact request approval."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
