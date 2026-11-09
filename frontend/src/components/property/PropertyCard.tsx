import { useState, useEffect, useContext, useRef, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { QueryClientContext } from "@tanstack/react-query";
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
  Loader2,
} from "lucide-react";
import type { PropertyItem } from "@/lib/api/properties";
import { USE_MOCK } from "@/lib/api/client";
import { tenantApi } from "@/lib/api/tenant";
import { translatePropertyType, translateRentalType, translateArea, toBnNumber } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

interface PropertyCardProps {
  property: PropertyItem;
  featured?: boolean;
  isFavorite?: boolean;
  isCompared?: boolean;
}

export function PropertyCard({
  property,
  featured,
  isFavorite: propIsFavorite,
  isCompared: propIsCompared,
}: PropertyCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useContext(QueryClientContext);
  const isBn = i18n.language === "bn";
  const isTenant = !!user && user.role === "tenant";

  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const isFavoriteMutatingRef = useRef(false);
  const isCompareMutatingRef = useRef(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  const [optimisticCompared, setOptimisticCompared] = useState<boolean | null>(null);

  // Standalone fallback: server state subscribed from QueryClient when prop is not supplied
  const [serverIsFavorite, setServerIsFavorite] = useState<boolean>(() => {
    if (!isTenant || !queryClient) return false;
    const favs = queryClient.getQueryData<PropertyItem[]>(["favorites"]);
    return Array.isArray(favs) ? favs.some((f) => String(f.id) === String(property.id)) : false;
  });

  const [serverIsCompared, setServerIsCompared] = useState<boolean>(() => {
    if (!isTenant || !queryClient) return false;
    const comps = queryClient.getQueryData<Array<{ propertyId?: string; id?: string }>>([
      "comparisons",
    ]);
    return Array.isArray(comps)
      ? comps.some((c) => String(c.propertyId || c.id) === String(property.id))
      : false;
  });

  // Guest-only localStorage state (hydrated in useEffect to avoid SSR mismatch)
  const [guestIsFavorite, setGuestIsFavorite] = useState<boolean>(false);
  const [guestIsCompared, setGuestIsCompared] = useState<boolean>(false);

  useEffect(() => {
    if (isTenant || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("thikana.favorites");
      const list: string[] = saved ? JSON.parse(saved) : [];
      setGuestIsFavorite(list.includes(property.id));
    } catch {
      // Ignore
    }
    try {
      const saved = localStorage.getItem("thikana.comparison");
      const list: string[] = saved ? JSON.parse(saved) : [];
      setGuestIsCompared(list.includes(property.id));
    } catch {
      // Ignore
    }
  }, [isTenant, property.id]);

  // Keep standalone server cache in sync if props are not supplied
  useEffect(() => {
    if (!isTenant || !queryClient) return;

    const updateFromCache = () => {
      const favs = queryClient.getQueryData<PropertyItem[]>(["favorites"]);
      if (Array.isArray(favs)) {
        setServerIsFavorite(favs.some((f) => String(f.id) === String(property.id)));
      }
      const comps = queryClient.getQueryData<Array<{ propertyId?: string; id?: string }>>([
        "comparisons",
      ]);
      if (Array.isArray(comps)) {
        setServerIsCompared(
          comps.some((c) => String(c.propertyId || c.id) === String(property.id)),
        );
      }
    };

    updateFromCache();

    // Standalone query fetch if cache is uninitialized
    if (propIsFavorite === undefined && !queryClient.getQueryData(["favorites"])) {
      tenantApi
        .getFavorites()
        .then((favs) => {
          queryClient.setQueryData(["favorites"], favs);
          setServerIsFavorite(favs.some((f) => String(f.id) === String(property.id)));
        })
        .catch(() => {});
    }

    if (propIsCompared === undefined && !queryClient.getQueryData(["comparisons"])) {
      tenantApi
        .getComparisons()
        .then((comps) => {
          queryClient.setQueryData(["comparisons"], comps);
          setServerIsCompared(
            comps.some((c) => String(c.propertyId || c.id) === String(property.id)),
          );
        })
        .catch(() => {});
    }

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const key = event?.query?.queryKey?.[0];
      if (key === "favorites" || key === "comparisons") {
        updateFromCache();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isTenant, queryClient, property.id, propIsFavorite, propIsCompared]);

  // Guest event listeners for localStorage synchronization
  useEffect(() => {
    if (isTenant) return;
    const handleFavUpdate = () => {
      try {
        const saved = localStorage.getItem("thikana.favorites");
        const list: string[] = saved ? JSON.parse(saved) : [];
        setGuestIsFavorite(list.includes(property.id));
      } catch {
        setGuestIsFavorite(false);
      }
    };
    const handleCompUpdate = () => {
      try {
        const saved = localStorage.getItem("thikana.comparison");
        const list: string[] = saved ? JSON.parse(saved) : [];
        setGuestIsCompared(list.includes(property.id));
      } catch {
        setGuestIsCompared(false);
      }
    };
    window.addEventListener("thikana.favorites.updated", handleFavUpdate);
    window.addEventListener("thikana.comparison.updated", handleCompUpdate);
    return () => {
      window.removeEventListener("thikana.favorites.updated", handleFavUpdate);
      window.removeEventListener("thikana.comparison.updated", handleCompUpdate);
    };
  }, [isTenant, property.id]);

  // Resolved display state
  const resolvedFavorite =
    propIsFavorite !== undefined ? propIsFavorite : isTenant ? serverIsFavorite : guestIsFavorite;
  const isFavorite = optimisticFavorite !== null ? optimisticFavorite : resolvedFavorite;

  const resolvedCompared =
    propIsCompared !== undefined ? propIsCompared : isTenant ? serverIsCompared : guestIsCompared;
  const isCompared = optimisticCompared !== null ? optimisticCompared : resolvedCompared;

  const toggleFavorite = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavoriteMutatingRef.current || isFavoriteLoading) return;
    isFavoriteMutatingRef.current = true;
    setIsFavoriteLoading(true);

    if (isTenant) {
      const willBeFavorite = !isFavorite;
      setOptimisticFavorite(willBeFavorite);

      const previousFavorites = queryClient?.getQueryData<PropertyItem[]>(["favorites"]) || [];

      // Optimistically update queryClient cache
      if (queryClient) {
        if (willBeFavorite) {
          queryClient.setQueryData<PropertyItem[]>(["favorites"], [...previousFavorites, property]);
        } else {
          queryClient.setQueryData<PropertyItem[]>(
            ["favorites"],
            previousFavorites.filter((f) => String(f.id) !== String(property.id)),
          );
        }
      }

      try {
        if (willBeFavorite) {
          await tenantApi.addFavorite(property.id);
        } else {
          await tenantApi.removeFavorite(property.id);
        }
        await queryClient?.invalidateQueries({ queryKey: ["favorites"] });
      } catch (err: unknown) {
        // Rollback state on error
        if (queryClient) {
          queryClient.setQueryData(["favorites"], previousFavorites);
        }
        setOptimisticFavorite(null);
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : t("common.networkError");
        alert(msg);
      } finally {
        setOptimisticFavorite(null);
        isFavoriteMutatingRef.current = false;
        setIsFavoriteLoading(false);
      }
    } else {
      // Guest behavior: isolate strictly in localStorage
      const willBeFavorite = !isFavorite;
      setGuestIsFavorite(willBeFavorite);
      try {
        const saved = localStorage.getItem("thikana.favorites");
        let list: string[] = saved ? JSON.parse(saved) : [];
        if (willBeFavorite) {
          if (!list.includes(property.id)) list.push(property.id);
        } else {
          list = list.filter((id) => id !== property.id);
        }
        localStorage.setItem("thikana.favorites", JSON.stringify(list));
        window.dispatchEvent(new Event("thikana.favorites.updated"));
      } catch {
        // Ignore storage error
      } finally {
        isFavoriteMutatingRef.current = false;
        setIsFavoriteLoading(false);
      }
    }
  };

  const toggleCompare = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompareMutatingRef.current || isCompareLoading) return;

    if (isTenant) {
      const willBeCompared = !isCompared;
      const previousComparisons =
        queryClient?.getQueryData<
          Array<{ id: string; propertyId: string; displayOrder: number; property: PropertyItem }>
        >(["comparisons"]) || [];

      if (willBeCompared && previousComparisons.length >= 3) {
        alert(t("tenant.comparisonMaxNotice"));
        return;
      }

      isCompareMutatingRef.current = true;
      setIsCompareLoading(true);
      setOptimisticCompared(willBeCompared);

      if (queryClient) {
        if (willBeCompared) {
          queryClient.setQueryData(
            ["comparisons"],
            [
              ...previousComparisons,
              {
                id: String(property.id),
                propertyId: String(property.id),
                displayOrder: previousComparisons.length + 1,
                property,
              },
            ],
          );
        } else {
          queryClient.setQueryData(
            ["comparisons"],
            previousComparisons.filter((c) => String(c.propertyId || c.id) !== String(property.id)),
          );
        }
      }

      try {
        if (willBeCompared) {
          await tenantApi.addComparison(property.id);
        } else {
          await tenantApi.removeComparison(property.id);
        }
        await queryClient?.invalidateQueries({ queryKey: ["comparisons"] });
      } catch (err: unknown) {
        if (queryClient) {
          queryClient.setQueryData(["comparisons"], previousComparisons);
        }
        setOptimisticCompared(null);
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : t("tenant.comparisonMaxNotice");
        alert(msg);
      } finally {
        setOptimisticCompared(null);
        isCompareMutatingRef.current = false;
        setIsCompareLoading(false);
      }
    } else {
      // Guest behavior in localStorage
      const willBeCompared = !isCompared;
      if (willBeCompared) {
        try {
          const saved = localStorage.getItem("thikana.comparison");
          const list: string[] = saved ? JSON.parse(saved) : [];
          if (list.length >= 3 && !list.includes(property.id)) {
            alert(t("tenant.comparisonMaxNotice"));
            return;
          }
        } catch {
          // Ignore storage error
        }
      }

      isCompareMutatingRef.current = true;
      setIsCompareLoading(true);
      setGuestIsCompared(willBeCompared);
      try {
        const saved = localStorage.getItem("thikana.comparison");
        let list: string[] = saved ? JSON.parse(saved) : [];
        if (willBeCompared) {
          if (!list.includes(property.id)) list.push(property.id);
        } else {
          list = list.filter((id) => id !== property.id);
        }
        localStorage.setItem("thikana.comparison", JSON.stringify(list));
        window.dispatchEvent(new Event("thikana.comparison.updated"));
      } catch {
        // Ignore storage error
      } finally {
        isCompareMutatingRef.current = false;
        setIsCompareLoading(false);
      }
    }
  };

  // Format currency with Bangla or English numerals
  const formatRent = (val: number) => {
    if (isBn) {
      return "৳" + val.toLocaleString("bn-BD");
    }
    return "৳" + val.toLocaleString("en-US");
  };

  // Server-side match score for authenticated tenants
  const match = property.match;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-surface hover-lift transition-all duration-240 ${
        featured ? "border-primary/60 ring-1 ring-primary/30" : "border-border/80"
      }`}
    >
      {/* Featured / Aspect Ratio Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        <img
          src={property.featuredImage}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-foreground/85 px-3 py-1 text-xs font-semibold text-background backdrop-blur-sm">
            {translatePropertyType(property.propertyType, i18n.language)}
          </span>
          {property.verifications.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm shadow-xs"
              title={t("properties.simulatedVerification")}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{t("properties.verified")}</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Favorite & Compare with Hover Micro-Tooltips */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-2 z-20">
          {/* Compare Button */}
          <div className="group/tip relative flex items-center justify-center">
            <button
              type="button"
              onClick={toggleCompare}
              disabled={isCompareLoading}
              aria-label={isCompared ? t("properties.removeCompare") : t("properties.addCompare")}
              title={isCompared ? t("properties.removeCompare") : t("properties.compareMax3")}
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-all duration-180 active:scale-90 hover:scale-105 disabled:opacity-70 cursor-pointer ${
                isCompared
                  ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                  : "border-black/10 bg-white/95 text-neutral-800 hover:bg-white dark:border-white/15 dark:bg-neutral-900/95 dark:text-neutral-100"
              }`}
            >
              {isCompareLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full mt-1.5 right-0 whitespace-nowrap rounded-md bg-neutral-900/95 px-2 py-0.5 text-[10px] font-medium text-white shadow-md opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 transition-opacity duration-150 z-30"
            >
              {isCompared ? t("properties.removeCompare") : t("properties.addCompare")}
            </span>
          </div>

          {/* Favorite Button */}
          <div className="group/tip relative flex items-center justify-center">
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              aria-label={
                isFavorite ? t("properties.removeFavorite") : t("properties.saveProperty")
              }
              title={isFavorite ? t("properties.saved") : t("properties.saveProperty")}
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-all duration-180 active:scale-90 hover:scale-105 disabled:opacity-70 cursor-pointer ${
                isFavorite
                  ? "border-destructive bg-destructive text-destructive-foreground animate-heart-pop shadow-destructive/20"
                  : "border-black/10 bg-white/95 text-neutral-800 hover:bg-white dark:border-white/15 dark:bg-neutral-900/95 dark:text-neutral-100"
              }`}
            >
              {isFavoriteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${
                    isFavorite ? "fill-current scale-110" : ""
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full mt-1.5 right-0 whitespace-nowrap rounded-md bg-neutral-900/95 px-2 py-0.5 text-[10px] font-medium text-white shadow-md opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 transition-opacity duration-150 z-30"
            >
              {isFavorite ? t("properties.saved") : t("properties.saveProperty")}
            </span>
          </div>
        </div>

        {/* Photo Count Pill */}
        <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-2.5 py-0.5 text-xs font-medium text-background backdrop-blur-sm">
          {isBn ? toBnNumber(property.images.length) : property.images.length}{" "}
          {isBn ? "ছবি" : "Photos"}
        </div>

        {/* Tenant Matching Score Badge */}
        {user?.role === "tenant" &&
          match &&
          match.hasTenantPreferences &&
          match.overallPercentage !== null && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              <Percent className="h-3 w-3" aria-hidden="true" />
              <span>
                {isBn ? toBnNumber(match.overallPercentage) : match.overallPercentage}%{" "}
                {t("properties.match")}
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
            <span className="ml-1 text-xs text-muted-foreground">/{t("properties.month")}</span>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {translateRentalType(property.rentalType, i18n.language)}
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
          <span>
            {translateArea(property.area, i18n.language)}, {t("common.khulna")}
          </span>
        </p>

        {/* Property Specs (Rooms, Baths, Area) */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isBn ? toBnNumber(property.rooms) : property.rooms} {t("properties.bedrooms")}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isBn ? toBnNumber(property.bathrooms) : property.bathrooms}{" "}
              {t("properties.bathrooms")}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isBn ? toBnNumber(property.size) : property.size} {t("properties.size")}
            </span>
          </span>
        </div>

        {/* Bottom CTA / View Details Link */}
        <div className="mt-4 pt-1">
          <Link
            to="/properties/$propertyId"
            params={{ propertyId: property.id }}
            className="group/btn inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs hover-lift-sm transition-all duration-200 hover:opacity-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span>{t("properties.viewDetails")}</span>
            <span
              className="inline-block transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
