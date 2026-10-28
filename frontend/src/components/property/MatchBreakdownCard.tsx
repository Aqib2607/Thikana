import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Percent,
  MapPin,
  CircleDollarSign,
  Building,
  Bed,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import type { MatchBreakdown } from "@/lib/api/properties";
import { useAuth } from "@/lib/auth";

interface MatchBreakdownCardProps {
  breakdown: MatchBreakdown;
}

export function MatchBreakdownCard({ breakdown }: MatchBreakdownCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Percent className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isBn ? "ভাড়াটিয়া ম্যাচিং স্কোর" : "Tenant Match Score"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn
                  ? "আপনার জন্য এই বাড়িটি কতটা উপযোগী তা দেখতে লগইন করুন।"
                  : "Log in as a tenant to see your personalized match percentage and breakdown."}
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isBn ? "লগইন করে ম্যাচ দেখুন" : "Log In to View Match ↗"}
          </Link>
        </div>
      </div>
    );
  }

  if (!breakdown.hasTenantPreferences) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isBn ? "পছন্দ তালিকা সেট করুন" : "Set Rental Preferences"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn
                  ? "আপনার ড্যাশবোর্ডে পছন্দের এলাকা, বাজেট ও রিকোয়ারমেন্ট সেট করুন।"
                  : "Save your preferred area, budget, and requirements to unlock match calculation."}
              </p>
            </div>
          </div>
          <Link
            to="/tenant/dashboard"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-secondary border border-border px-4 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-colors"
          >
            {isBn ? "পছন্দ সেট করতে যান" : "Configure Preferences ↗"}
          </Link>
        </div>
      </div>
    );
  }

  const dimensions = [
    {
      label: isBn ? "লোকেশন ও এলাকা" : "Location Match",
      weight: "30%",
      score: breakdown.locationScore,
      max: 30,
      icon: MapPin,
    },
    {
      label: isBn ? "বাজেট সামঞ্জস্য" : "Budget Affordability",
      weight: "25%",
      score: breakdown.budgetScore,
      max: 25,
      icon: CircleDollarSign,
    },
    {
      label: isBn ? "প্রপার্টির ধরন" : "Property Type",
      weight: "15%",
      score: breakdown.propertyTypeScore,
      max: 15,
      icon: Building,
    },
    {
      label: isBn ? "সুযোগ-সুবিধা (Amenities)" : "Amenities Match",
      weight: "15%",
      score: breakdown.amenitiesScore,
      max: 15,
      icon: CheckCircle2,
    },
    {
      label: isBn ? "রুম ও বাথরুম সংখ্যা" : "Rooms & Bathrooms",
      weight: "10%",
      score: breakdown.roomsAndBathsScore,
      max: 10,
      icon: Bed,
    },
    {
      label: isBn ? "উপলব্ধতা (Availability)" : "Availability",
      weight: "5%",
      score: breakdown.availabilityScore,
      max: 5,
      icon: CalendarCheck,
    },
  ];

  return (
    <div
      aria-labelledby="match-breakdown-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 id="match-breakdown-heading" className="text-lg font-bold text-foreground">
            {isBn ? "ভাড়াটিয়া ম্যাচিং স্কোর অ্যানালাইসিস" : "Tenant Matching Breakdown"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isBn
              ? "অ্যালগরিদম ওয়েটেড অ্যানালাইসিস (১০০% ভিত্তিক)"
              : "Rule-based weighted formula based on your saved preferences"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-primary/10 px-4 py-2 text-primary">
          <Percent className="h-5 w-5" aria-hidden="true" />
          <span className="text-2xl font-black">{breakdown.overallPercentage}%</span>
        </div>
      </div>

      <div className="mt-5 space-y-3.5">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          const pct = Math.round((dim.score / dim.max) * 100);
          return (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>{dim.label}</span>
                  <span className="text-xs text-muted-foreground">({dim.weight})</span>
                </span>
                <span className="font-semibold text-foreground">
                  {dim.score}/{dim.max}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
