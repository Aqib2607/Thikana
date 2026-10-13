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
import { mockProperties } from "@/lib/api/mock/properties";
import { PropertyFilterSchema, type PropertyFilter } from "@/lib/api/properties";

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
    queryFn: () => mockProperties.list(currentFilters),
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
                  {isBn ? "হোম" : "Home"}
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-foreground">
                {isBn ? "খুলনার প্রপার্টি তালিকা" : "Properties in Khulna"}
              </li>
            </ol>
          </nav>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {isBn ? "খুলনায় ভাড়ার বাসা ও মেস সন্ধান" : "Explore Rental Properties in Khulna"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {total} {isBn ? "টি প্রপার্টি পাওয়া গেছে" : "verified properties available"}
                {currentFilters.area ? ` in ${currentFilters.area}` : ""}
              </p>
            </div>

            {/* Keyword Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <input
                name="q"
                defaultValue={currentFilters.search || ""}
                placeholder={isBn ? "এলাকা বা বাসার নাম..." : "Search title or road..."}
                className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
              <Search
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Main Discovery Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Control Bar: Sorting & View Switcher */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "ফিল্টার" : "Filters"}</span>
            </button>

            {/* Sort Dropdown */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">{isBn ? "সাজান:" : "Sort by:"}</span>
              <select
                value={currentFilters.sortBy || "newest"}
                onChange={(e) =>
                  updateFilters({
                    ...currentFilters,
                    sortBy: e.target.value as PropertyFilter["sortBy"],
                  })
                }
                className="h-9 rounded-lg border border-input bg-surface px-2.5 text-xs font-medium text-foreground"
              >
                <option value="newest">{isBn ? "সর্বশেষ যুক্ত" : "Newest Listings"}</option>
                <option value="price_asc">
                  {isBn ? "ভাড়া: কম থেকে বেশি" : "Rent: Low to High"}
                </option>
                <option value="price_desc">
                  {isBn ? "ভাড়া: বেশি থেকে কম" : "Rent: High to Low"}
                </option>
                <option value="rating">{isBn ? "রেটিং অনুযায়ী" : "Highest Rated"}</option>
              </select>
            </label>
          </div>

          {/* View Mode Toggle (Grid vs Map vs Split) */}
          <div
            className="flex items-center rounded-lg border border-border bg-surface p-0.5 shadow-2xs"
            role="group"
            aria-label="View layout switch"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              title="Grid View"
              className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isBn ? "লিস্ট ভিউ" : "List"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              title="Map View"
              className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isBn ? "ম্যাপ ভিউ" : "Map"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("split")}
              aria-pressed={viewMode === "split"}
              title="Split View"
              className={`hidden md:flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                viewMode === "split"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "স্প্লিট ভিউ" : "Split"}</span>
            </button>
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
                  {isBn ? "প্রপার্টি লোড করা যায়নি" : "Failed to load properties"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isBn
                    ? "নেটওয়ার্ক কানেকশন পরীক্ষা করুন এবং পুনরায় চেষ্টা করুন।"
                    : "Please check your network and retry."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
                >
                  {isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && properties.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-12 text-center">
                <Home className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {isBn ? "কোনো প্রপার্টি পাওয়া যায়নি" : "No properties matched your criteria"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isBn
                    ? "অনুগ্রহ করে আপনার ফিল্টার বা বাজেটের সীমা পরিবর্তন করে পুনরায় চেষ্টা করুন।"
                    : "Try adjusting your budget, location, or clearing some amenity filters."}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{isBn ? "ফিল্টার রিসেট করুন" : "Clear All Filters"}</span>
                </button>
              </div>
            )}

            {/* Success States */}
            {!isLoading && !isError && properties.length > 0 && (
              <>
                {/* 1. Grid Mode */}
                {viewMode === "grid" && (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {properties.map((prop) => (
                      <PropertyCard key={prop.id} property={prop} />
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
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      <span>{isBn ? "পূর্ববর্তী" : "Previous"}</span>
                    </button>

                    <span className="text-xs text-muted-foreground">
                      {isBn
                        ? `পৃষ্ঠা ${currentPage} এর ${totalPages}`
                        : `Page ${currentPage} of ${totalPages}`}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => updateFilters({ ...currentFilters, page: currentPage + 1 })}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                      <span>{isBn ? "পরবর্তী" : "Next"}</span>
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
