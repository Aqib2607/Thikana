import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { landlordApi } from "@/lib/api/landlord";
import { toBnNumber } from "@/lib/i18n";
import type { VisitRequestItem, VisitStatus } from "@/lib/api/tenant";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/landlord/visits")({
  head: () => ({
    meta: [
      { title: "Manage Visits — Landlord Portal — Thikana" },
      {
        name: "description",
        content: "Manage and update property visit requests from prospective tenants.",
      },
    ],
  }),
  component: LandlordVisitsPage,
});

function LandlordVisitsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [visits, setVisits] = useState<VisitRequestItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadVisits = useCallback(async () => {
    if (!user) return;
    try {
      const data = await landlordApi.getVisits(user.id);
      setVisits(data);
    } catch {
      // In live or mock mode, keep visits resilient
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const handleUpdateStatus = async (visitId: string, status: Exclude<VisitStatus, "Pending">) => {
    try {
      await landlordApi.updateVisitStatus(visitId, status);
      setActionNotice(
        status === "Accepted"
          ? t("landlord.visitAcceptedMsg")
          : status === "Completed"
            ? t("landlord.visitCompletedMsg")
            : status === "Rejected"
              ? t("landlord.visitRejectedMsg")
              : t("landlord.visitCancelledMsg"),
      );
      loadVisits();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      alert(msg || (i18n.language === "bn" ? "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।" : "Failed to update visit status."));
    }
  };

  const filteredVisits = visits.filter((v) => {
    if (filter === "ALL") return true;
    return v.status === filter;
  });

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("landlord.visitsTitle")}
      subtitle={t("landlord.visitsSubtitle")}
      activeTab="visits"
    >
      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" aria-hidden="true" />
        {["ALL", "Pending", "Accepted", "Completed", "Rejected", "Cancelled"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {st === "ALL"
              ? t("landlord.allVisitsTab")
              : st === "Pending"
                ? t("landlord.pendingApproval")
                : st === "Accepted"
                  ? t("landlord.approved")
                  : st === "Completed"
                    ? t("tenant.statusCompleted")
                    : st === "Rejected"
                      ? t("landlord.rejected")
                      : t("tenant.statusCancelled")}
          </button>
        ))}
      </div>

      {actionNotice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-semibold hover:underline"
          >
            {t("landlord.dismiss")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("landlord.loadingVisits")}
          </p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("landlord.noVisitsTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {t("landlord.noVisitsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((v) => {
            const isPending = v.status === "Pending";
            const isAccepted = v.status === "Accepted";
            const isCompleted = v.status === "Completed";
            const isRejected = v.status === "Rejected";
            const isCancelled = v.status === "Cancelled";

            return (
              <article
                key={v.id}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={v.propertyImage}
                      alt={v.propertyTitle}
                      className="h-16 w-20 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div>
                      <h4 className="font-bold text-foreground text-base">{v.propertyTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" aria-hidden="true" />
                        <span>{v.propertyArea}</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          ৳{toBnNumber(v.propertyRent.toLocaleString(), i18n.language)}/{t("properties.month")}
                        </span>
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 font-semibold text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          <span>{v.visitDate}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          <span>{v.visitTimeSlot}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.pendingApproval")}</span>
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.approved")}</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("tenant.statusCompleted")}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.rejected")}</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("tenant.statusCancelled")}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tenant Note */}
                {v.note && (
                  <div className="mt-3.5 rounded-xl bg-secondary/50 p-3 text-xs text-foreground italic border border-border/50">
                    <span className="font-semibold not-italic text-muted-foreground mr-1">
                      {t("landlord.tenantNote")}
                    </span>
                    "{v.note}"
                  </div>
                )}

                {/* Action Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(v.id, "Rejected")}
                        className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                      >
                        {t("landlord.rejectVisit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(v.id, "Accepted")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.acceptVisit")}</span>
                      </button>
                    </>
                  )}

                  {isAccepted && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(v.id, "Completed")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {t("landlord.markVisitCompleted")}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </RoleLayout>
  );
}
