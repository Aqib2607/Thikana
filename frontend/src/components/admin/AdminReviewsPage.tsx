import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import { toBnNumber } from "@/lib/i18n";
import type { PropertyReviewItem } from "@/lib/api/tenant";
import {
  Star,
  Trash2,
  ShieldCheck,
  Search,
  MessageSquare,
  Clock,
  X,
} from "lucide-react";

export function AdminReviewsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PropertyReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await mockAdminApi.getReviews();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (review: PropertyReviewItem) => {
    if (!user) return;
    const ok = window.confirm(
      t("admin.deleteReviewConfirm", { name: review.tenantName }),
    );
    if (!ok) return;

    setDeletingId(review.id);
    try {
      await mockAdminApi.deleteReview(review.id, user.id, user.name || "Admin");
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setNotice(t("admin.deleteReviewBtn"));
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      r.tenantName.toLowerCase().includes(q) ||
      r.propertyId.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q)
    );
  });

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.reviewsModeration")}
      subtitle={t("admin.reviewsSubtitle")}
      activeTab="reviews"
    >
      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      {/* Search Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {t("admin.totalReviewsHeader", { count: toBnNumber(reviews.length, i18n.language) })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("admin.reviewsHeaderDesc")}
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.reviewSearchPlaceholder")}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          {t("admin.loadingReviews")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-3 text-base font-bold text-foreground">
            {t("admin.noReviewsTitle")}
          </h2>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{r.tenantName}</span>
                    {r.visitedVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{t("tenant.visitedBadge")}</span>
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ID: {r.propertyId}
                    </span>
                  </div>

                  {/* Stars Rating Display */}
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= r.overallRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1 text-xs font-bold text-foreground">
                      {toBnNumber(r.overallRating, i18n.language)}.0
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-foreground">"{r.comment}"</p>

                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span>{t("admin.accuracyRatingLabel")} {toBnNumber(r.accuracyRating, i18n.language)}/5</span>
                    <span>{t("admin.landlordRatingLabel")} {toBnNumber(r.landlordBehaviorRating, i18n.language)}/5</span>
                    <span>{t("admin.locationRatingLabel")} {toBnNumber(r.locationRating, i18n.language)}/5</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Delete Action */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t("admin.deleteReviewBtn")}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </RoleLayout>
  );
}
