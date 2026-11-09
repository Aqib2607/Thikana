import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { PropertyCard } from "@/components/property/PropertyCard";
import { tenantApi } from "@/lib/api/tenant";
import type { PropertyItem } from "@/lib/api/properties";
import { toBnNumber } from "@/lib/i18n";
import { Heart, Search, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/tenant/favorites")({
  head: () => ({
    meta: [
      { title: "Saved Properties — Thikana" },
      {
        name: "description",
        content: "View and manage your saved and favorited academic rental properties.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: TenantFavoritesPage,
});

export function TenantFavoritesPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const queryClient = useQueryClient();

  const {
    data: favoriteProperties = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<PropertyItem[]>({
    queryKey: ["favorites"],
    queryFn: () => tenantApi.getFavorites(),
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    };
    window.addEventListener("thikana.favorites.updated", handleUpdate);
    return () => window.removeEventListener("thikana.favorites.updated", handleUpdate);
  }, [queryClient]);

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.favoritesTitle")}
      subtitle={
        isBn
          ? "আপনার পছন্দের বাসাগুলো সংরক্ষিত রয়েছে। সহজে তুলনা বা পরিদর্শনের আবেদন করুন।"
          : "Keep track of listings you are interested in. Schedule visits or compare anytime."
      }
      activeTab="favorites"
    >
      {isError && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isBn
                ? "পছন্দের বাসাগুলোর তালিকা লোড করতে সমস্যা হয়েছে।"
                : "Failed to load saved properties. Please try again."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isBn ? "পুনরায় চেষ্টা" : "Retry"}</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl border border-border bg-surface p-4 animate-pulse space-y-4"
            >
              <div className="h-44 rounded-xl bg-secondary/60" />
              <div className="h-4 w-3/4 rounded bg-secondary/60" />
              <div className="h-4 w-1/2 rounded bg-secondary/60" />
              <div className="h-8 rounded bg-secondary/60" />
            </div>
          ))}
        </div>
      ) : favoriteProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-foreground">
            {t("tenant.noFavoritesTitle")}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
            {t("tenant.noFavoritesDesc")}
          </p>
          <div className="mt-6">
            <Link
              to="/properties"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:scale-[1.02]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{t("tenant.exploreProperties")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {isBn
              ? `মোট ${toBnNumber(favoriteProperties.length, i18n.language)}টি বাসা সংরক্ষিত আছে:`
              : `Total ${favoriteProperties.length} properties saved:`}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
