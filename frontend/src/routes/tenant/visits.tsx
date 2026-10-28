import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { tenantApi, VISIT_STATUSES, type VisitRequestItem, type VisitStatus } from "@/lib/api/tenant";
import { translateArea, toBnNumber } from "@/lib/i18n";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  ExternalLink,
  Ban,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/tenant/visits")({
  head: () => ({
    meta: [
      { title: "My Visits — Thikana" },
      {
        name: "description",
        content: "Track and manage your scheduled property visits and approvals.",
      },
    ],
  }),
  component: TenantVisitsPage,
});

function TenantVisitsPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [visits, setVisits] = useState<VisitRequestItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadVisits = async () => {
    try {
      const list = await tenantApi.getVisits();
      setVisits(list);
    } catch {
      // In live or mock mode, keep visits resilient
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleCancel = async (visitId: string) => {
    if (
      !confirm(
        isBn
          ? "আপনি কি নিশ্চিতভাবে এই পরিদর্শনের অনুরোধ বাতিল করতে চান?"
          : "Are you sure you want to cancel this visit request?",
      )
    ) {
      return;
    }
    try {
      await tenantApi.cancelVisit(visitId);
      setActionSuccess(
        t("tenant.visitCancelledSuccess"),
      );
      loadVisits();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      alert(msg || (isBn ? "অনুরোধ বাতিল করতে সমস্যা হয়েছে।" : "Failed to cancel visit request."));
    }
  };

  const filteredVisits = visits.filter((v) => {
    if (selectedFilter === "All") return true;
    return v.status === selectedFilter;
  });

  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{t("tenant.statusPending")}</span>
          </span>
        );
      case "Accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            <span>{t("tenant.statusAccepted")}</span>
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            <span>{t("tenant.statusCompleted")}</span>
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            <span>{t("tenant.statusRejected")}</span>
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <Ban className="h-3 w-3" aria-hidden="true" />
            <span>{t("tenant.statusCancelled")}</span>
          </span>
        );
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.visitsTitle")}
      subtitle={
        isBn
          ? "বাড়িওয়ালার সাথে বাসা পরিদর্শনের তারিখ, সময় ও অনুমোদনের স্ট্যাটাস ট্র্যাক করুন।"
          : "Keep track of physical property visits, landlord decisions, and verified visits."
      }
      activeTab="visits"
    >
      {actionSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {["All", ...VISIT_STATUSES].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setSelectedFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {st === "All" ? t("tenant.allFilter") : st}
          </button>
        ))}
      </div>

      {filteredVisits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-foreground">
            {t("tenant.noVisitsInCategory")}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
            {isBn
              ? "যেকোনো প্রপার্টির বিস্তারিত পেজে গিয়ে 'পরিদর্শনের সময় নির্ধারণ' বাটনে ক্লিক করে আবেদন করুন।"
              : "Find a property and request a scheduled visit to inspect water supply, lighting, and rooms in person."}
          </p>
          <div className="mt-6">
            <Link
              to="/properties"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:scale-[1.02]"
            >
              {t("tenant.exploreProperties")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const isFutureDate = new Date(visit.visitDate + "T00:00:00") > new Date(new Date().toDateString());
            const canCancel = (visit.status === "Pending" || visit.status === "Accepted") && isFutureDate;

            return (
              <div
                key={visit.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={visit.propertyImage}
                    alt=""
                    className="h-20 w-24 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {visit.propertyTitle}
                      </h3>
                      {getStatusBadge(visit.status)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                      <span>{translateArea(visit.propertyArea, i18n.language)}</span>
                      <span className="font-semibold text-foreground ml-2">
                        ৳{toBnNumber(visit.propertyRent.toLocaleString(), i18n.language)}/{t("properties.month")}
                      </span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span>{visit.visitDate}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>{visit.visitTimeSlot}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>{visit.landlordName}</span>
                      </span>
                    </div>

                    {visit.note && (
                      <p className="mt-2 rounded-lg bg-secondary/40 p-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {t("tenant.noteLabel")} 
                        </span>
                        {visit.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:flex-col sm:items-end">
                  <Link
                    to="/properties/$propertyId"
                    params={{ propertyId: visit.propertyId }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <span>{t("tenant.viewProperty")}</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(visit.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t("tenant.cancelRequest")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </RoleLayout>
  );
}
