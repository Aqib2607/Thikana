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
  Flag,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ImageGallery } from "@/components/property/ImageGallery";
import { CommunityInfoCard } from "@/components/property/CommunityInfoCard";
import { MatchBreakdownCard } from "@/components/property/MatchBreakdownCard";
import { VisitRequestModal } from "@/components/tenant/VisitRequestModal";
import { ReviewFormModal } from "@/components/tenant/ReviewFormModal";
import { ReportPropertyModal } from "@/components/tenant/ReportPropertyModal";
import { mockTenantApi } from "@/lib/api/mock";
import { mockProperties, calculateMatchBreakdown } from "@/lib/api/mock/properties";
import { translatePropertyType, translateRentalType, translateAvailability, translateArea, translateBill, translateAmenity, translateVerification, toBnNumber } from "@/lib/i18n";
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visitRequested, setVisitRequested] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

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
          alert(t("properties.compareMax3"));
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
            {t("properties.propertyNotFound")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("properties.propertyNotFoundDesc")}
          </p>
          <Link
            to="/properties"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t("properties.backToAllListings")}</span>
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
      <div className="border-b border-border bg-secondary/10 pt-5 pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              {t("common.home")}
            </Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-foreground">
              {t("properties.title")}
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-foreground">{translateArea(property.area, i18n.language)}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Title Header with Action Badges */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                {translatePropertyType(property.propertyType, i18n.language)}
              </span>
              {property.rentalType &&
                property.rentalType.toLowerCase() !== property.propertyType.toLowerCase() && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                    {translateRentalType(property.rentalType, i18n.language)}
                  </span>
                )}
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  property.availability === "Available"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {translateAvailability(property.availability, i18n.language)}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {isBn && property.banglaTitle ? property.banglaTitle : property.title}
            </h1>

            {/* Public Exact Address per Prompt Specification */}
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong>{t("properties.exactAddress")}</strong>{" "}
                {property.exactAddress}
              </span>
            </p>
          </div>

          {/* Action Buttons: Compare, Favorite - Aligned with Title */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={toggleCompare}
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-all ${
                isCompared
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-surface text-foreground hover:bg-secondary"
              }`}
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              <span>
                {isCompared
                  ? t("properties.comparing")
                  : t("properties.compare")}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-all ${
                isFavorite
                  ? "border-destructive bg-destructive text-destructive-foreground shadow-xs"
                  : "border-border bg-surface text-foreground hover:bg-secondary"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
              <span>{isFavorite ? t("properties.saved") : t("properties.saveProperty")}</span>
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
                    {t("properties.bedrooms")}
                  </span>
                  <span className="text-sm font-bold text-foreground">{toBnNumber(property.rooms, i18n.language)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Bath className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.bathrooms")}
                  </span>
                  <span className="text-sm font-bold text-foreground">{toBnNumber(property.bathrooms, i18n.language)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Maximize2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.size")}
                  </span>
                  <span className="text-sm font-bold text-foreground">{toBnNumber(property.size, i18n.language)} {t("properties.sqft")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.floor")}
                  </span>
                  <span className="text-sm font-bold text-foreground">{toBnNumber(property.floor, i18n.language)}</span>
                </div>
              </div>
            </div>

            {/* Financial Details (Advance, Bills, Utility) */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h2 className="text-lg font-bold text-foreground">
                {t("properties.financialTerms")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.monthlyRent")}
                  </span>
                  <span className="mt-0.5 block text-lg sm:text-xl font-bold text-foreground">
                    ৳{toBnNumber(property.rent.toLocaleString(), i18n.language)}
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.advanceDeposit")}
                  </span>
                  <span className="mt-0.5 block text-lg sm:text-xl font-bold text-foreground">
                    ৳{toBnNumber(property.advance.toLocaleString(), i18n.language)}
                  </span>
                </div>

                <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                  <span className="block text-xs text-muted-foreground">
                    {t("properties.additionalService")}
                  </span>
                  <span className="mt-0.5 block text-lg sm:text-xl font-bold text-foreground">
                    ৳{toBnNumber(property.additionalCharges.toLocaleString(), i18n.language)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <span className="text-xs font-semibold text-foreground">
                  {t("properties.billsIncludedInRent")}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {property.billsIncluded.map((bill) => (
                    <span
                      key={bill}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{translateBill(bill, i18n.language)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <h2 className="text-lg font-bold text-foreground">
                {t("properties.availableAmenities")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/20 p-2.5 text-xs font-medium text-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span>{translateAmenity(amenity, i18n.language)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Verifications Box with Clear Platform Label */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground">
                  {t("properties.simulatedReportTitle")}
                </h2>
              </div>
              <p className="mt-1.5 text-xs font-medium text-foreground/85 leading-relaxed">
                {t("properties.simulatedReportDisclaimer")}
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {property.verifications.map((v) => (
                  <div
                    key={v}
                    className="flex items-center gap-2 rounded-lg bg-surface border border-border/80 px-3 py-2 text-xs font-semibold text-foreground shadow-2xs"
                  >
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span>{translateVerification(v, i18n.language)}</span>
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
                    ৳{toBnNumber(property.rent.toLocaleString(), i18n.language)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    /{t("properties.month")}
                  </span>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {translateAvailability(property.availability, i18n.language)}
                </span>
              </div>

              {/* Action Buttons: Visit Request & Contact */}
              <div className="mt-5 space-y-3">
                {visitRequested ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-center text-xs font-medium text-primary">
                    <CheckCircle className="mx-auto mb-1 h-5 w-5" aria-hidden="true" />
                    <span>
                      {t("properties.visitRequestSubmitted")}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        alert(
                          t("properties.loginToScheduleVisit"),
                        );
                        return;
                      }
                      setVisitModalOpen(true);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.99]"
                  >
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{t("properties.scheduleVisitBtn")}</span>
                  </button>
                )}

                {contactRequested ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-center text-xs font-medium text-primary">
                    <CheckCircle className="mx-auto mb-1 h-5 w-5" aria-hidden="true" />
                    <span>{t("properties.contactRequestSent")}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={contactSubmitting}
                    onClick={async () => {
                      if (!user) {
                        alert(
                          t("properties.loginToSendContact"),
                        );
                        return;
                      }
                      setContactSubmitting(true);
                      try {
                        await mockTenantApi.sendContactRequest({
                          propertyId: property.id,
                          message: `Hello ${property.landlord.name}, I am interested in renting this listing.`,
                        });
                        setContactRequested(true);
                      } finally {
                        setContactSubmitting(false);
                      }
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {contactSubmitting
                        ? t("properties.sending")
                        : t("properties.sendContactRequest")}
                    </span>
                  </button>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        alert(t("properties.loginToWriteReview"));
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-surface text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    <span>{t("properties.writeReview")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        alert(
                          t("properties.loginToReport"),
                        );
                        return;
                      }
                      setReportModalOpen(true);
                    }}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("properties.reportListing")}</span>
                  </button>
                </div>
              </div>

              {/* Landlord Profile & Privacy Setting */}
              <div className="mt-8 border-t border-border pt-6">
                <span className="text-xs font-semibold text-foreground">
                  {t("properties.landlordOverview")}
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={property.landlord.avatar}
                    alt={property.landlord.name}
                    className="h-11 w-11 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{property.landlord.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {t("properties.memberSince", { date: toBnNumber(property.landlord.memberSince, i18n.language) })}
                    </span>
                  </div>
                </div>

                {/* Respect Landlord Contact Privacy Setting */}
                <div className="mt-4 rounded-xl border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  {property.landlord.publicContactVisible ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                        <a
                          href={`tel:${property.landlord.phone}`}
                          className="hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-xs"
                        >
                          {property.landlord.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <a
                          href={`mailto:${property.landlord.email}`}
                          className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-xs"
                        >
                          {property.landlord.email}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Lock
                        className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {t("properties.contactDetailsHiddenNotice")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {property && (
        <>
          <VisitRequestModal
            property={property}
            isOpen={visitModalOpen}
            onClose={() => setVisitModalOpen(false)}
            onSuccess={() => setVisitRequested(true)}
          />
          <ReviewFormModal
            property={property}
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
          />
          <ReportPropertyModal
            property={property}
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
          />
        </>
      )}
    </AppShell>
  );
}
