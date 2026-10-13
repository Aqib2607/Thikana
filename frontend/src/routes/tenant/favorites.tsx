import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { PropertyCard } from "@/components/property/PropertyCard";
import { mockTenantApi, MOCK_PROPERTIES } from "@/lib/api/mock";
import type { PropertyItem } from "@/lib/api/properties";
import { Heart, Search } from "lucide-react";

export const Route = createFileRoute("/tenant/favorites")({
  head: () => ({
    meta: [
      { title: "Saved Properties — Thikana" },
      {
        name: "description",
        content: "View and manage your saved and favorited academic rental properties.",
      },
    ],
  }),
  component: TenantFavoritesPage,
});

function TenantFavoritesPage() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [favoriteProperties, setFavoriteProperties] = useState<PropertyItem[]>([]);

  const loadFavorites = () => {
    const ids = mockTenantApi.getFavoriteIds();
    const matched = MOCK_PROPERTIES.filter((p) => ids.includes(p.id));
    setFavoriteProperties(matched);
  };

  useEffect(() => {
    loadFavorites();
    const handleUpdate = () => loadFavorites();
    window.addEventListener("thikana.favorites.updated", handleUpdate);
    return () => window.removeEventListener("thikana.favorites.updated", handleUpdate);
  }, []);

  return (
    <RoleLayout
      requiredRole="tenant"
      title={isBn ? "সংরক্ষিত বাসা (Saved Properties)" : "Saved Favorites"}
      subtitle={
        isBn
          ? "আপনার পছন্দের বাসাগুলো সংরক্ষিত রয়েছে। সহজে তুলনা বা পরিদর্শনের আবেদন করুন।"
          : "Keep track of listings you are interested in. Schedule visits or compare anytime."
      }
      activeTab="favorites"
    >
      {favoriteProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-foreground">
            {isBn ? "কোনো বাসা সংরক্ষিত নেই" : "No Saved Properties Yet"}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
            {isBn
              ? "বাসা খোঁজার পেজে গিয়ে যেকোনো প্রপার্টি কার্ডের হার্ট আইকনে ক্লিক করে ফেভারিট লিস্টে যোগ করুন।"
              : "Explore listings and click the heart icon on any property to save it to your dashboard."}
          </p>
          <div className="mt-6">
            <Link
              to="/properties"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:scale-[1.02]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{isBn ? "বাসা খুঁজুন" : "Browse Properties"}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {isBn
              ? `মোট ${favoriteProperties.length}টি বাসা সংরক্ষিত আছে:`
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
