import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { landlordApi } from "@/lib/api/landlord";
import { toBnNumber } from "@/lib/i18n";
import type { LandlordStats } from "@/lib/api/landlord";
import type { ContactRequestItem, VisitRequestItem } from "@/lib/api/tenant";
import {
  Building2,
  FileText,
  MessageSquare,
  CalendarCheck,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/landlord/dashboard")({
  head: () => ({
    meta: [
      { title: "Landlord Dashboard — Thikana" },
      {
        name: "description",
        content: "Manage your rental listings, incoming inquiries, and property visits.",
      },
    ],
  }),
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState<LandlordStats>({
    totalListings: 0,
    approvedListings: 0,
    pendingListings: 0,
    activeVisits: 0,
    pendingContactRequests: 0,
  });
  const [contactRequests, setContactRequests] = useState<ContactRequestItem[]>([]);
  const [visits, setVisits] = useState<VisitRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user) {
      Promise.all([
        landlordApi.getStats(user.id).catch(() => ({
          totalListings: 0,
          approvedListings: 0,
          pendingListings: 0,
          activeVisits: 0,
          pendingContactRequests: 0,
        })),
        landlordApi.getContactRequests(user.id).catch(() => []),
        landlordApi.getVisits(user.id).catch(() => []),
      ]).then(([statsData, requestsData, visitsData]) => {
        if (active) {
          setStats(statsData);
          setContactRequests(requestsData);
          setVisits(visitsData);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  const pendingRequests = contactRequests.filter((r) => r.status === "Pending").slice(0, 3);
  const upcomingVisits = visits
    .filter((v) => v.status === "Accepted" || v.status === "Pending")
    .slice(0, 3);

  return (
    <RoleLayout
      requiredRole="landlord"
      title={`${t("dashboard.welcome")}, ${user?.name || ""}`}
      subtitle={t("dashboard.landlordTitle")}
      activeTab="dashboard"
    >
      {/* Privacy & Governance notice banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">{t("landlord.privacyBannerTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("landlord.privacyBannerDesc")}</p>
        </div>
      </div>

      {/* KPI Stats Bar - Harmonious 3-tier typographic hierarchy */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">
            {t("landlord.kpiTotalListings")}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            {loading ? "..." : toBnNumber(stats.totalListings, i18n.language)}
          </p>
          <span className="text-xs font-medium text-muted-foreground mt-1 block">
            {t("landlord.kpiTotalDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t("landlord.kpiApproved")}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            {loading ? "..." : toBnNumber(stats.approvedListings, i18n.language)}
          </p>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("landlord.kpiApprovedDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {t("landlord.kpiPending")}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            {loading ? "..." : toBnNumber(stats.pendingListings, i18n.language)}
          </p>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("landlord.kpiPendingDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">
            {t("landlord.kpiActiveVisits")}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            {loading ? "..." : toBnNumber(stats.activeVisits, i18n.language)}
          </p>
          <span className="text-xs font-medium text-muted-foreground mt-1 block">
            {t("landlord.kpiVisitsDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <p className="text-sm font-semibold text-primary">{t("landlord.kpiInquiries")}</p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            {loading ? "..." : toBnNumber(stats.pendingContactRequests, i18n.language)}
          </p>
          <span className="text-xs font-medium text-muted-foreground mt-1 block">
            {t("landlord.kpiInquiriesDesc")}
          </span>
        </div>
      </div>

      {/* Operational Activity Modules (Replaces redundant 5-card navigation grid) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols on lg): Recent Inquiries & Scheduled Visits Activity Feeds */}
        <div className="space-y-6 lg:col-span-2">
          {/* Feed 1: Pending Inbound Inquiries */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">
                  {t("landlord.recentInquiriesTitle")}
                </h2>
                {stats.pendingContactRequests > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-bold text-primary">
                    {toBnNumber(stats.pendingContactRequests, i18n.language)}
                  </span>
                )}
              </div>
              <Link
                to="/landlord/contact-requests"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span>{t("landlord.viewAllInquiries")}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-6 text-center">
                <FileText className="mx-auto h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
                <p className="mt-2 text-xs font-medium text-foreground">
                  {t("landlord.noInquiriesYet")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("landlord.contactRequestsDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/20 p-3.5 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {req.tenantName}
                        </span>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:text-amber-400">
                          {t("landlord.pendingApproval")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {req.propertyTitle}
                      </p>
                      {req.message && (
                        <p className="mt-1 text-xs text-foreground/80 italic line-clamp-1">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                    <Link
                      to="/landlord/contact-requests"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
                    >
                      <span>{t("landlord.contactRequestsCta")}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Feed 2: Scheduled In-Person Visits */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">
                  {t("landlord.upcomingVisitsTitle")}
                </h2>
                {stats.activeVisits > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-bold text-emerald-700 dark:text-emerald-400">
                    {toBnNumber(stats.activeVisits, i18n.language)}
                  </span>
                )}
              </div>
              <Link
                to="/landlord/visits"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span>{t("landlord.viewAllVisitsLink")}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="py-6 text-center">
                <Calendar className="mx-auto h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
                <p className="mt-2 text-xs font-medium text-foreground">
                  {t("landlord.noUpcomingVisits")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("landlord.myVisitsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/20 p-3.5 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {visit.propertyTitle}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
                            visit.status === "Accepted"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {visit.status === "Accepted"
                            ? t("landlord.approved")
                            : t("landlord.pendingApproval")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {visit.visitDate} • {visit.visitTimeSlot}
                      </p>
                    </div>
                    <Link
                      to="/landlord/visits"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
                    >
                      <span>{t("landlord.myVisitsCta")}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1 col on lg): Portfolio Status & Fast Action Module */}
        <div className="space-y-6 lg:col-span-1">
          {/* Portfolio Status Summary */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("landlord.portfolioOverviewTitle")}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t("landlord.portfolioOverviewDesc")}
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    {t("landlord.kpiApproved")}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {toBnNumber(stats.approvedListings, i18n.language)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    {t("landlord.kpiPending")}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {toBnNumber(stats.pendingListings, i18n.language)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    {t("dashboard.myMessages")}
                  </span>
                </div>
                <Link
                  to="/landlord/messages"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("landlord.openInboxLink")}
                </Link>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/80">
              <Link
                to="/landlord/properties"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 px-4 text-xs font-bold text-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span>{t("landlord.manageAllProperties")}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Landlord Best Practice / Guideline Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-xs font-bold text-foreground">{t("landlord.guidelineTitle")}</h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("landlord.guidelineDesc")}
            </p>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
