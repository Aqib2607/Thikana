import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { tenantApi, type PropertyReviewItem } from "@/lib/api/tenant";
import { EmptyState } from "@/components/common/EmptyState";
import { Star, CheckCircle2, Building2, Calendar, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { toBnNumber } from "@/lib/i18n";

export function TenantReviewsPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const {
    data: reviews = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<PropertyReviewItem[]>({
    queryKey: ["tenantReviews"],
    queryFn: () => tenantApi.getReviews(),
  });

  const getStatusBadge = (status?: string) => {
    const norm = (status || "pending").toLowerCase();
    switch (norm) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <span>{isBn ? "অনুমোদিত" : "Approved"}</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            <span>{isBn ? "প্রত্যাখ্যাত" : "Rejected"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{isBn ? "অপেক্ষমান" : "Pending"}</span>
          </span>
        );
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      activeTab="reviews"
      title={t("dashboard.myReviews")}
      subtitle={t(
        "tenant.reviewsSubtitle",
        "Manage your submitted property ratings and verified experiences",
      )}
    >
      {isError && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isBn
                ? "মতামত তালিকা লোড করতে সমস্যা হয়েছে।"
                : "Failed to load reviews. Please try again."}
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-64 rounded-xl border border-border bg-surface p-5 animate-pulse space-y-4"
            >
              <div className="h-5 w-2/3 rounded bg-secondary/60" />
              <div className="h-4 w-1/3 rounded bg-secondary/60" />
              <div className="h-16 rounded bg-secondary/60" />
              <div className="h-4 w-1/2 rounded bg-secondary/60" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={t("tenant.noReviewsTitle")}
          description={t("tenant.noReviewsDesc")}
          actionLabel={t("tenant.exploreProperties")}
          actionHref="/properties"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("tenant.reviewsCount", { count: toBnNumber(reviews.length, i18n.language) })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Header: Property title & Status & Visited Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <Link
                        to="/properties/$propertyId"
                        params={{ propertyId: rev.propertyId }}
                        className="font-semibold text-foreground hover:text-primary hover:underline truncate text-sm sm:text-base"
                      >
                        {isBn ? `প্রপার্টি #${rev.propertyId}` : `Listing #${rev.propertyId}`}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(rev.status)}

                      {rev.visitedVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          <span>{t("properties.visitedBadge")}</span>
                        </span>
                      )}
                    </div>
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
                      {toBnNumber(rev.overallRating.toFixed(1), i18n.language)} / {toBnNumber("5.0", i18n.language)}
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
                        {t("tenant.accuracyRating")}:
                      </span>{" "}
                      {toBnNumber(rev.accuracyRating, i18n.language)}/৫
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {t("tenant.landlordRating")}:
                      </span>{" "}
                      {toBnNumber(rev.landlordBehaviorRating, i18n.language)}/৫
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {t("tenant.locationRating")}:
                      </span>{" "}
                      {toBnNumber(rev.locationRating, i18n.language)}/৫
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {t("tenant.experienceRating")}:
                      </span>{" "}
                      {toBnNumber(rev.overallExperienceRating, i18n.language)}/৫
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
                    {t("tenant.viewPropertyListing")} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
