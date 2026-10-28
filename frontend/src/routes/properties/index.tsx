import { useState, useMemo } from "react";
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
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { PropertyMap } from "@/components/property/PropertyMap";
import { MotionReveal } from "@/components/motion/MotionReveal";
import { propertyApi } from "@/lib/api/properties";
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

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | undefined>();

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

  return (
    <AppShell>
      <div className="bg-secondary/20 py-6 md:py-8 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link to="/" className="hover:text-foreground">
                  {t("common.home")}
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-foreground">
                {t("properties.exploreTitle")}
              </li>
            </ol>
          </nav>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t("properties.exploreTitle")}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {toBnNumber(total, i18n.language)} {t("properties.propertiesAvailable")}
                {currentFilters.area ? ` (${translateArea(currentFilters.area, i18n.language)})` : ""}
              </p>
            </div>

            {/* Keyword Quick Search Bar - Connected with header */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 shrink-0">
              <input
                name="q"
                defaultValue={currentFilters.search || ""}
                placeholder={t("properties.searchPlaceholder")}
                className="h-11 w-full rounded-full border border-input bg-surface pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground shadow-xs focus-visible:outline-2 focus-visible:outline-ring"
              />
              <Search
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Main Discovery Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Control Bar: Sorting & View Switcher (Grouped without dead space) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
          {/* Mobile Filter Trigger Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary lg:hidden cursor-pointer"
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
                className="h-10 rounded-full border border-input bg-surface px-4 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
              >
                <option value="newest">{t("properties.sortNewest")}</option>
                <option value="price_asc">{t("properties.sortPriceAsc")}</option>
                <option value="price_desc">{t("properties.sortPriceDesc")}</option>
                <option value="rating">{t("properties.sortRating")}</option>
              </select>
            </label>

            {/* View Mode Toggle (Grid vs Map vs Split) */}
            <div
              className="flex items-center rounded-full border border-border/80 bg-surface p-1 shadow-xs"
              role="group"
              aria-label={t("properties.viewLayoutSwitch")}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title={t("properties.gridView")}
                className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-xs"
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
                title={t("properties.mapView")}
                className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground shadow-xs"
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
                className={`hidden md:flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "split"
                    ? "bg-primary text-primary-foreground shadow-xs"
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
          {/* Desktop Filter Sidebar */}
          <div
            className={`lg:block ${mobileFilterOpen ? "block" : "hidden lg:block"} lg:col-span-1`}
          >
            <PropertyFilters
              filters={currentFilters}
              onChange={updateFilters}
              onReset={handleResetFilters}
              availableAreas={data?.areas}
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
                    className="h-80 animate-pulse rounded-2xl border border-border bg-secondary/40"
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="rounded-2xl border border-destructive bg-surface p-8 text-center">
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
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer"
                >
                  {t("common.retry")}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && properties.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-12 text-center">
                <Home className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {t("properties.noPropertiesFound")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("properties.noPropertiesFoundDesc")}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
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
                      <MotionReveal key={prop.id} variant="fadeUp" delay={Math.min(idx * 60, 360)}>
                        <PropertyCard property={prop} />
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
                        <PropertyCard key={prop.id} property={prop} />
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
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      <span>{t("common.previous")}</span>
                    </button>

                    <span className="text-xs text-muted-foreground">
                      {t("common.pageOf", { current: toBnNumber(currentPage, i18n.language), total: toBnNumber(totalPages, i18n.language) })}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => updateFilters({ ...currentFilters, page: currentPage + 1 })}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50 cursor-pointer"
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
    </AppShell>
  );
}
