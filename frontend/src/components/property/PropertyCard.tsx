import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Percent,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";
import type { PropertyItem } from "@/lib/api/properties";
import { calculateMatchBreakdown } from "@/lib/api/mock/properties";
import { useAuth } from "@/lib/auth";

interface PropertyCardProps {
  property: PropertyItem;
  featured?: boolean;
}

export function PropertyCard({ property, featured }: PropertyCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

  // Favorites & comparison local persistence
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const saved = localStorage.getItem("thikana.favorites");
      const list: string[] = saved ? JSON.parse(saved) : [];
      return list.includes(property.id);
    } catch {
      return false;
    }
  });

  const [isCompared, setIsCompared] = useState(() => {
    try {
      const saved = localStorage.getItem("thikana.comparison");
      const list: string[] = saved ? JSON.parse(saved) : [];
      return list.includes(property.id);
    } catch {
      return false;
    }
  });

  const toggleFavorite = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("thikana.favorites");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(property.id)) {
        list = list.filter((id) => id !== property.id);
        setIsFavorite(false);
      } else {
        list.push(property.id);
        setIsFavorite(true);
      }
      localStorage.setItem("thikana.favorites", JSON.stringify(list));
      window.dispatchEvent(new Event("thikana.favorites.updated"));
    } catch {
      // Ignore storage error
    }
  };

  const toggleCompare = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("thikana.comparison");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(property.id)) {
        list = list.filter((id) => id !== property.id);
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
        list.push(property.id);
        setIsCompared(true);
      }
      localStorage.setItem("thikana.comparison", JSON.stringify(list));
      window.dispatchEvent(new Event("thikana.comparison.updated"));
    } catch {
      // Ignore storage error
    }
  };

  // Format currency with Bangla or English numerals
  const formatRent = (val: number) => {
    if (isBn) {
      return "৳" + val.toLocaleString("bn-BD");
    }
    return "৳" + val.toLocaleString("en-US");
  };

  // Mock student preference score if tenant
  const tenantPrefs =
    user?.role === "tenant" ? { maxBudget: 10000, preferredArea: property.area } : null;
  const match = calculateMatchBreakdown(property, tenantPrefs);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-surface hover-lift ${
        featured ? "border-primary/60 ring-1 ring-primary/30" : "border-border/80"
      }`}
    >
      {/* Featured / Aspect Ratio Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        <img
          src={property.featuredImage}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-foreground/85 px-3 py-1 text-xs font-semibold text-background backdrop-blur-sm">
            {property.propertyType}
          </span>
          {property.verifications.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm shadow-xs"
              title="Platform Simulated Verification"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{isBn ? "ভেরিফাইড" : "Verified"}</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Favorite & Compare */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleCompare}
            aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
            title={isCompared ? "Remove from comparison" : "Compare (max 3)"}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              isCompared
                ? "bg-primary text-primary-foreground"
                : "bg-surface/85 text-foreground hover:bg-surface"
            }`}
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Save property"}
            title={isFavorite ? "Saved" : "Save property"}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              isFavorite
                ? "bg-destructive text-destructive-foreground"
                : "bg-surface/85 text-foreground hover:bg-surface"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
          </button>
        </div>

        {/* Photo Count Pill */}
        <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-2.5 py-0.5 text-xs font-medium text-background backdrop-blur-sm">
          {property.images.length} {isBn ? "ছবি" : "Photos"}
        </div>

        {/* Tenant Matching Score Badge */}
        {user?.role === "tenant" && match.hasTenantPreferences && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <Percent className="h-3 w-3" aria-hidden="true" />
            <span>
              {match.overallPercentage}% {isBn ? "ম্যাচ" : "Match"}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Rent & Rental Type */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {formatRent(property.rent)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">/{isBn ? "মাস" : "month"}</span>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {property.rentalType}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2.5 line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
          <Link
            to="/properties/$propertyId"
            params={{ propertyId: property.id }}
            className="focus-visible:outline-hidden focus-visible:underline"
          >
            {isBn && property.banglaTitle ? property.banglaTitle : property.title}
          </Link>
        </h3>

        {/* Location Preview */}
        <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground line-clamp-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{property.area}, Khulna</span>
        </p>

        {/* Property Specs (Rooms, Baths, Area) */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {property.rooms} {isBn ? "রুম" : "Bed"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {property.bathrooms} {isBn ? "বাথ" : "Bath"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {property.size} {isBn ? "বর্গফুট" : "sqft"}
            </span>
          </span>
        </div>

        {/* Bottom CTA / View Details Link */}
        <div className="mt-4 pt-1">
          <Link
            to="/properties/$propertyId"
            params={{ propertyId: property.id }}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-ring"
          >
            {isBn ? "বিস্তারিত দেখুন ↗" : "View Details ↗"}
          </Link>
        </div>
      </div>
    </article>
  );
}
