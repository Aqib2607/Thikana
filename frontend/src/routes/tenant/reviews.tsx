import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import { mockPropertyApi } from "@/lib/api/mock/properties";
import type { PropertyReviewItem } from "@/lib/api/tenant";
import type { Property } from "@/lib/api/properties";
import { EmptyState } from "@/components/common/EmptyState";
import { Star, CheckCircle2, Building2, Calendar } from "lucide-react";

export const Route = createFileRoute("/tenant/reviews")({
  component: TenantReviewsPage,
});

export function TenantReviewsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isBn = i18n.language === "bn";

  const [reviews, setReviews] = useState<PropertyReviewItem[]>([]);
  const [propertiesMap, setPropertiesMap] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allReviews = await mockAdminApi.getReviews();
        // Filter reviews created by this tenant
        const userReviews = allReviews.filter(
          (r) =>
            r.tenantId === user?.id ||
            r.tenantId === "u-tenant" ||
            r.tenantName.toLowerCase() === user?.name?.toLowerCase(),
        );
        setReviews(userReviews);

        // Fetch property titles
        const allProps = await mockPropertyApi.getAll();
        const map: Record<string, Property> = {};
        for (const p of allProps) {
          map[p.id] = p;
        }
        setPropertiesMap(map);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  return (
    <RoleLayout
      requiredRole="tenant"
      activeTab="reviews"
      title={t("dashboard.myReviews", "My Reviews")}
      subtitle={t(
        "tenant.reviewsSubtitle",
        "Manage your submitted property ratings and verified experiences",
      )}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={t("tenant.noReviewsTitle", "No reviews submitted yet")}
          description={t(
            "tenant.noReviewsDesc",
            "After completing a property visit, share your honest feedback with the Khulna student community.",
          )}
          actionLabel={t("tenant.exploreProperties", "Explore Properties")}
          actionHref="/properties"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("tenant.reviewsCount", "Showing {{count}} reviews", { count: reviews.length })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((rev) => {
              const prop = propertiesMap[rev.propertyId];
              const propTitle =
                isBn && prop?.banglaTitle ? prop.banglaTitle : prop?.title || rev.propertyId;

              return (
                <div
                  key={rev.id}
                  className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Property title & Visited Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <Link
                          to="/properties/$propertyId"
                          params={{ propertyId: rev.propertyId }}
                          className="font-semibold text-foreground hover:text-primary hover:underline truncate text-sm sm:text-base"
                        >
                          {propTitle}
                        </Link>
                      </div>

                      {rev.visitedVerified && (
                        <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          <span>{t("properties.visitedBadge", "Visited / পরিদর্শিত")}</span>
                        </span>
                      )}
                    </div>

                    {/* Overall Rating Stars */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rev.overallRating
                                ? "fill-amber-500 text-amber-500"
                                : "text-border"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {rev.overallRating}.0 / 5.0
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="mt-3 text-sm text-foreground/90 leading-relaxed italic bg-secondary/30 p-3 rounded-lg border border-border/50">
                      "{rev.comment}"
                    </p>

                    {/* Detailed sub-ratings */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border pt-3">
                      <div>
                        <span className="font-medium text-foreground">
                          {t("tenant.accuracyRating", "Accuracy")}:
                        </span>{" "}
                        {rev.accuracyRating}/5
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {t("tenant.landlordRating", "Landlord")}:
                        </span>{" "}
                        {rev.landlordBehaviorRating}/5
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {t("tenant.locationRating", "Location")}:
                        </span>{" "}
                        {rev.locationRating}/5
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {t("tenant.experienceRating", "Experience")}:
                        </span>{" "}
                        {rev.overallExperienceRating}/5
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {new Date(rev.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Link
                      to="/properties/$propertyId"
                      params={{ propertyId: rev.propertyId }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t("tenant.viewPropertyListing", "View Property")} &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
