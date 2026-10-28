import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import {
  toBnNumber,
  translatePropertyType,
  translateRentalType,
  translateFurnished,
  translateTenantPreference,
} from "@/lib/i18n";
import type { PropertyItem } from "@/lib/api/properties";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function AdminPendingPropertiesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [pendingList, setPendingList] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject dialog
  const [rejectingItem, setRejectingItem] = useState<PropertyItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const all = await mockAdminApi.getProperties("Pending Approval");
      setPendingList(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (p: PropertyItem) => {
    if (!user) return;
    setProcessingId(p.id);
    try {
      await mockAdminApi.approveProperty(p.id, user.id, user.name || "Admin");
      setPendingList((prev) => prev.filter((item) => item.id !== p.id));
      setNotice(`'${p.title}' — ${t("landlord.approved")}`);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!user || !rejectingItem) return;
    setProcessingId(rejectingItem.id);
    try {
      await mockAdminApi.rejectProperty(
        rejectingItem.id,
        rejectReason.trim() || "Policy mismatch or unverified details.",
        user.id,
        user.name || "Admin",
      );
      setPendingList((prev) => prev.filter((item) => item.id !== rejectingItem.id));
      setNotice(`'${rejectingItem.title}' — ${t("landlord.rejected")}`);
      setRejectingItem(null);
      setRejectReason("");
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.pendingApprovals")}
      subtitle={t("admin.pendingSubtitle")}
      activeTab="pending"
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

      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning-foreground">
              {toBnNumber(pendingList.length, i18n.language)}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {t("admin.pendingReviewHeader")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.pendingReviewNotice")}
          </p>
        </div>
        <Link
          to="/admin/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-link"
        >
          <span>{t("admin.viewAllProperties")}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          {t("admin.loadingListings")}
        </div>
      ) : pendingList.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {t("admin.allPendingReviewedTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.allPendingReviewedDesc")}
          </p>
          <div className="mt-6">
            <Link
              to="/admin/properties"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Building2 className="h-4 w-4" />
              <span>{t("admin.manageAllPropertiesCta")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingList.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-warning/40 bg-surface shadow-sm ring-1 ring-warning/20 transition-all hover:shadow-md"
            >
              <div className="grid gap-6 p-6 sm:grid-cols-12">
                {/* Images Preview */}
                <div className="sm:col-span-4">
                  <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border">
                    <img
                      src={p.featuredImage || p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-warning/90 px-2 py-0.5 text-[10px] font-bold text-black">
                      {t("landlord.pendingApproval")}
                    </span>
                  </div>
                  {p.images.length > 1 && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                      {p.images.slice(1, 5).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Thumbnail ${i + 2}`}
                          className="h-12 w-16 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="flex flex-col justify-between sm:col-span-8">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          {translatePropertyType(p.propertyType, i18n.language)} · {translateRentalType(p.rentalType, i18n.language)}
                        </span>
                        <h2 className="mt-1 text-lg font-bold text-foreground">
                          {i18n.language.startsWith("bn") && p.banglaTitle ? p.banglaTitle : p.title}
                        </h2>
                        {p.banglaTitle && !i18n.language.startsWith("bn") && (
                          <p className="text-sm font-medium text-muted-foreground">
                            {p.banglaTitle}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{p.exactAddress}</span>
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-2xl font-bold text-foreground">
                          ৳{toBnNumber(p.rent.toLocaleString(), i18n.language)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /{t("properties.month")}
                        </span>
                      </div>
                    </div>

                    {/* Specs Tags */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-secondary px-2.5 py-1 font-medium text-foreground">
                        {toBnNumber(p.rooms, i18n.language)} {t("properties.rooms")} · {toBnNumber(p.bathrooms, i18n.language)} {t("properties.baths")}
                      </span>
                      <span className="rounded-lg bg-secondary px-2.5 py-1 font-medium text-foreground">
                        {toBnNumber(p.size, i18n.language)} {t("properties.sqft")}
                      </span>
                      <span className="rounded-lg bg-secondary px-2.5 py-1 font-medium text-foreground">
                        {translateFurnished(p.furnishedStatus, i18n.language)}
                      </span>
                      <span className="rounded-lg bg-secondary px-2.5 py-1 font-medium text-foreground">
                        {t("admin.advanceDepositLabel")}: ৳{toBnNumber(p.advance?.toLocaleString() || 0, i18n.language)}
                      </span>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                        {t("admin.preferredTenantLabel")}: {translateTenantPreference(p.preferredTenant, i18n.language)}
                      </span>
                    </div>

                    {/* Landlord Info Box */}
                    <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">
                            {t("admin.colLandlord")}: {p.landlord.name}
                          </p>
                          <p className="text-muted-foreground">
                            {p.landlord.email} · {p.landlord.phone || t("admin.noPhone")}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {p.landlord.publicContactVisible
                            ? t("admin.publicContactOn")
                            : t("admin.publicContactOff")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingItem(p);
                        setRejectReason("");
                      }}
                      disabled={processingId === p.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t("admin.rejectAndSendReason")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(p)}
                      disabled={processingId === p.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t("admin.approveAndGoLive")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Reject with Reason Dialog */}
      {rejectingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t("admin.rejectConfirmTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">{rejectingItem.title}</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("admin.rejectConfirmDesc")}
            </p>

            <div className="mt-3">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("admin.rejectReasonPlaceholder")}
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {t("landlord.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingId === rejectingItem.id}
                className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {processingId === rejectingItem.id
                  ? t("admin.processing")
                  : t("admin.confirmRejectBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
