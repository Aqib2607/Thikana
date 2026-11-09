import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
  RotateCcw,
  AlertCircle,
  Home,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { PropertyMap } from "@/components/property/PropertyMap";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { useAuth } from "@/lib/auth";
import { propertyApi } from "@/lib/api/properties";
import { tenantApi } from "@/lib/api/tenant";
import { PropertyFilterSchema, type PropertyFilter } from "@/lib/api/properties";
import { translateArea, toBnNumber } from "@/lib/i18n";

const SearchParamsSchema = z.object({
  search: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.any().optional(),
  rentalType: z.any().optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  rooms: z.number().optional(),
  bathrooms: z.number().optional(),
  furnishedStatus: z.any().optional(),
  verifiedOnly: z.boolean().optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "match", "rating"]).optional(),
  page: z.number().optional(),
  view: z.enum(["grid", "map", "split"]).optional(),
});

export const Route = createFileRoute("/properties/")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Browse Rental Properties in Khulna — Thikana" },
      {
        name: "description",
        content:
          "Find verified apartments, bachelor rooms, messes, and sublets in Khulna with exact public addresses and interactive map.",
      },
    ],
  }),
  component: PropertiesDiscoveryPage,
});

function PropertiesDiscoveryPage() {
  const { t, i18n } = useTranslation();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const isBn = i18n.language === "bn";
  const { user, ready } = useAuth();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | undefined>();

  const closeMobileFilter = () => {
    setIsFilterClosing(true);
    setTimeout(() => {
      setMobileFilterOpen(false);
      setIsFilterClosing(false);
    }, 240);
  };

  const toggleMobileFilter = () => {
    if (mobileFilterOpen) {
      closeMobileFilter();
    } else {
      setMobileFilterOpen(true);
    }
  };

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileFilter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileFilterOpen]);

  useEffect(() => {
    if (ready && !user) {
      const returnUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/properties";
      navigate({
        to: "/login",
        search: { redirect: returnUrl },
      });
    }
  }, [ready, user, navigate]);

  // Filter state synchronized with TanStack router search params
  const currentFilters: PropertyFilter = useMemo(
    () => ({
      search: searchParams.search,
      area: searchParams.area,
      propertyType: searchParams.propertyType,
      rentalType: searchParams.rentalType,
      minRent: searchParams.minRent,
      maxRent: searchParams.maxRent,
      rooms: searchParams.rooms,
      bathrooms: searchParams.bathrooms,
      furnishedStatus: searchParams.furnishedStatus,
      verifiedOnly: searchParams.verifiedOnly,
      sortBy: searchParams.sortBy || "newest",
      page: searchParams.page || 1,
      limit: 9,
    }),
    [searchParams],
  );

  const viewMode = searchParams.view || "grid";

  // TanStack Query for property discovery server state
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["properties", currentFilters],
    queryFn: () => propertyApi.list(currentFilters),
  });

  const { data: areasData } = useQuery({
    queryKey: ["propertyAreas"],
    queryFn: () => propertyApi.getAreas(),
    staleTime: 1000 * 60 * 60,
  });

  const { data: amenitiesData } = useQuery({
    queryKey: ["propertyAmenities"],
    queryFn: () => propertyApi.getAmenities(),
    staleTime: 1000 * 60 * 60,
  });

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

  const updateFilters = (next: PropertyFilter) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...next,
        page: next.page || 1,
      }),
    });
  };

  const handleResetFilters = () => {
    navigate({
      search: () => ({
        view: viewMode,
        page: 1,
      }),
    });
  };

  const setViewMode = (mode: "grid" | "map" | "split") => {
    navigate({
      search: (prev) => ({
        ...prev,
        view: mode,
      }),
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string) || "";
    navigate({
      search: (prev) => ({
        ...prev,
        search: q.trim() || undefined,
        page: 1,
      }),
    });
  };

  const properties = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = currentFilters.page || 1;

  if (!ready) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">{t("home.loginNote")}</p>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    const returnUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/properties";
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {t("dashboard.unauthorizedTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.unauthorizedDesc")}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              search={{ redirect: returnUrl }}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-secondary"
            >
              {t("dashboard.backHome")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="animate-page-enter">
        <div className="bg-secondary/20 py-6 md:py-8 border-b border-border transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-foreground transition-colors duration-150">
                    {t("common.home")}
                  </Link>
                </li>
                <li>/</li>
                <li className="font-semibold text-foreground">{t("properties.exploreTitle")}</li>
              </ol>
            </nav>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {t("properties.exploreTitle")}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {toBnNumber(total, i18n.language)} {t("properties.propertiesAvailable")}
                  {currentFilters.area
                    ? ` (${translateArea(currentFilters.area, i18n.language)})`
                    : ""}
                </p>
              </div>

              {/* Keyword Quick Search Bar - Prominent & Accessible */}
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative flex items-center w-full md:w-96 lg:w-[420px] shrink-0"
              >
                <label htmlFor="property-keyword-search" className="sr-only">
                  {t("properties.searchPlaceholder")}
                </label>
                <Search
                  className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground transition-colors"
                  aria-hidden="true"
                />
                <input
                  id="property-keyword-search"
                  name="q"
                  type="search"
                  defaultValue={currentFilters.search || ""}
                  placeholder={t("properties.searchPlaceholder")}
                  className="h-11 w-full rounded-full border border-border/90 bg-surface pl-10 pr-24 text-xs font-medium text-foreground placeholder:text-muted-foreground shadow-xs transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all duration-180 hover:opacity-95 active:scale-95 cursor-pointer"
                >
                  <span>{t("home.search")}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Discovery Body */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Top Control Bar: Sorting & View Switcher (Aligned 36px Baseline) */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
            {/* Mobile Filter Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMobileFilter}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border/80 bg-surface px-3.5 text-xs font-semibold text-foreground shadow-xs transition-all duration-180 hover:bg-secondary active:scale-[0.97] lg:hidden cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("properties.filters")}</span>
              </button>
            </div>

            {/* Grouped Presentation Controls: Sort + View Toggles together */}
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              {/* Sort Dropdown */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline font-semibold text-foreground">
                  {t("properties.sortBy")}
                </span>
                <select
                  value={currentFilters.sortBy || "newest"}
                  onChange={(e) =>
                    updateFilters({
                      ...currentFilters,
                      sortBy: e.target.value as PropertyFilter["sortBy"],
                    })
                  }
                  className="h-9 rounded-full border border-border/90 bg-surface px-3.5 text-xs font-medium text-foreground transition-all duration-180 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus-visible:outline-none cursor-pointer"
                >
                  <option value="newest">{t("properties.sortNewest")}</option>
                  <option value="price_asc">{t("properties.sortPriceAsc")}</option>
                  <option value="price_desc">{t("properties.sortPriceDesc")}</option>
                  <option value="rating">{t("properties.sortRating")}</option>
                </select>
              </label>

              {/* View Mode Toggle (Grid vs Map vs Split) */}
              <div
                className="flex h-9 items-center rounded-full border border-border/80 bg-surface p-0.5 shadow-xs"
                role="group"
                aria-label={t("properties.viewLayoutSwitch")}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title={t("properties.viewList")}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow-xs scale-100"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("properties.viewList")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  aria-pressed={viewMode === "map"}
                  title={t("properties.viewMap")}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                    viewMode === "map"
                      ? "bg-primary text-primary-foreground shadow-xs scale-100"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("properties.viewMap")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  aria-pressed={viewMode === "split"}
                  title={t("properties.splitView")}
                  className={`hidden md:flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                    viewMode === "split"
                      ? "bg-primary text-primary-foreground shadow-xs scale-100"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("properties.viewSplit")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Layout Grid: Sidebar Filters + Main View Content */}
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Mobile Filter Drawer (With Backdrop & Animated Entrance/Exit) */}
            {mobileFilterOpen && (
              <div
                className={`fixed inset-0 z-50 lg:hidden flex justify-end ${
                  isFilterClosing
                    ? "animate-out fade-out duration-200"
                    : "animate-in fade-in duration-200"
                }`}
              >
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                  onClick={closeMobileFilter}
                  aria-hidden="true"
                />
                {/* Drawer Container */}
                <div
                  className={`relative z-10 w-full max-w-xs h-full bg-surface p-5 overflow-y-auto shadow-2xl border-l border-border ${
                    isFilterClosing
                      ? "animate-out slide-out-to-right duration-240 ease-in"
                      : "animate-in slide-in-from-right duration-280 ease-out"
                  }`}
                  role="dialog"
                  aria-modal="true"
                  aria-label={t("properties.filters")}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <span className="font-bold text-sm text-foreground">
                      {t("properties.filters")}
                    </span>
                    <button
                      type="button"
                      onClick={closeMobileFilter}
                      className="p-1.5 rounded-full hover:bg-secondary text-foreground transition-colors cursor-pointer"
                      aria-label="Close filters"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <PropertyFilters
                    filters={currentFilters}
                    onChange={updateFilters}
                    onReset={() => {
                      handleResetFilters();
                      closeMobileFilter();
                    }}
                    availableAreas={areasData || data?.areas}
                    availableAmenities={amenitiesData}
                  />
                </div>
              </div>
            )}

            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <PropertyFilters
                filters={currentFilters}
                onChange={updateFilters}
                onReset={handleResetFilters}
                availableAreas={areasData || data?.areas}
                availableAmenities={amenitiesData}
              />
            </div>

            {/* Main Results Canvas */}
            <div className="lg:col-span-3">
              {/* Loading Skeleton State */}
              {isLoading && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-xs"
                    >
                      <div className="aspect-[16/10] w-full bg-secondary/60 skeleton-shimmer" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 w-2/5 rounded-full bg-secondary/80 skeleton-shimmer" />
                        <div className="h-4 w-4/5 rounded-full bg-secondary/60 skeleton-shimmer" />
                        <div className="h-3 w-3/5 rounded-full bg-secondary/40 skeleton-shimmer" />
                        <div className="pt-3 border-t border-border/60 flex justify-between">
                          <div className="h-3 w-16 rounded-full bg-secondary/50 skeleton-shimmer" />
                          <div className="h-3 w-16 rounded-full bg-secondary/50 skeleton-shimmer" />
                          <div className="h-3 w-16 rounded-full bg-secondary/50 skeleton-shimmer" />
                        </div>
                        <div className="h-11 w-full rounded-full bg-secondary/70 skeleton-shimmer mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div className="rounded-3xl border border-destructive bg-surface p-8 text-center animate-in fade-in duration-300">
                  <AlertCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
                  <h3 className="mt-3 text-lg font-bold text-foreground">
                    {t("properties.loadError")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("properties.loadErrorDesc")}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {t("common.retry")}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !isError && properties.length === 0 && (
                <div className="rounded-3xl border border-border bg-surface p-12 text-center animate-in fade-in zoom-in-95 duration-300">
                  <Home
                    className="mx-auto h-12 w-12 text-muted-foreground animate-bounce duration-1000"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    {t("properties.noPropertiesFound")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("properties.noPropertiesFoundDesc")}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover-lift-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>{t("properties.resetFilters")}</span>
                  </button>
                </div>
              )}

              {/* Success States */}
              {!isLoading && !isError && properties.length > 0 && (
                <>
                  {/* 1. Grid Mode */}
                  {viewMode === "grid" && (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {properties.map((prop, idx) => (
                        <MotionReveal
                          key={prop.id}
                          variant="fadeUp"
                          staggerIndex={idx % 9}
                          duration={450}
                        >
                          <PropertyCard
                            property={prop}
                            isFavorite={isTenant ? favoriteIds.has(String(prop.id)) : undefined}
                            isCompared={isTenant ? comparisonIds.has(String(prop.id)) : undefined}
                          />
                        </MotionReveal>
                      ))}
                    </div>
                  )}

                  {/* 2. Map Mode */}
                  {viewMode === "map" && (
                    <PropertyMap
                      properties={properties}
                      selectedId={selectedMapPropertyId}
                      onSelectProperty={(id) => setSelectedMapPropertyId(id)}
                    />
                  )}

                  {/* 3. Split Mode */}
                  {viewMode === "split" && (
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                        {properties.map((prop) => (
                          <PropertyCard
                            key={prop.id}
                            property={prop}
                            isFavorite={isTenant ? favoriteIds.has(String(prop.id)) : undefined}
                            isCompared={isTenant ? comparisonIds.has(String(prop.id)) : undefined}
                          />
                        ))}
                      </div>
                      <div className="sticky top-20 h-[600px]">
                        <PropertyMap
                          properties={properties}
                          selectedId={selectedMapPropertyId}
                          onSelectProperty={(id) => setSelectedMapPropertyId(id)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-between border-t border-border pt-4">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => updateFilters({ ...currentFilters, page: currentPage - 1 })}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3.5 text-xs font-semibold text-foreground transition-all duration-180 hover:bg-secondary hover-lift-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        <span>{t("common.previous")}</span>
                      </button>

                      <span className="text-xs text-muted-foreground">
                        {t("common.pageOf", {
                          current: toBnNumber(currentPage, i18n.language),
                          total: toBnNumber(totalPages, i18n.language),
                        })}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => updateFilters({ ...currentFilters, page: currentPage + 1 })}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3.5 text-xs font-semibold text-foreground transition-all duration-180 hover:bg-secondary hover-lift-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <span>{t("common.next")}</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
