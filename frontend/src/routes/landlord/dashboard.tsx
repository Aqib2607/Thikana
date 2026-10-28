import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import { toBnNumber } from "@/lib/i18n";
import type { LandlordStats } from "@/lib/api/landlord";
import {
  Building2,
  PlusCircle,
  FileText,
  MessageSquare,
  CalendarCheck,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user) {
      mockLandlordApi.getStats(user.id).then((data) => {
        if (active) {
          setStats(data);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  const cards = [
    {
      title: t("dashboard.myProperties"),
      desc: t("landlord.myPropertiesDesc"),
      icon: Building2,
      href: "/landlord/properties",
      badge: `${toBnNumber(stats.totalListings, i18n.language)} ${t("landlord.myListings")}`,
      cta: t("landlord.myPropertiesCta"),
    },
    {
      title: t("dashboard.newProperty"),
      desc: t("landlord.newPropertyDesc"),
      icon: PlusCircle,
      href: "/landlord/properties/new",
      badge: t("landlord.newPropertyBadge"),
      cta: t("landlord.newPropertyCta"),
    },
    {
      title: t("dashboard.contactRequests"),
      desc: t("landlord.contactRequestsDesc"),
      icon: FileText,
      href: "/landlord/contact-requests",
      badge:
        stats.pendingContactRequests > 0
          ? `${toBnNumber(stats.pendingContactRequests, i18n.language)} ${t("landlord.pendingApproval")}`
          : undefined,
      cta: t("landlord.contactRequestsCta"),
    },
    {
      title: t("dashboard.myMessages"),
      desc: t("landlord.myMessagesDesc"),
      icon: MessageSquare,
      href: "/landlord/messages",
      cta: t("landlord.myMessagesCta"),
    },
    {
      title: t("dashboard.myVisits"),
      desc: t("landlord.myVisitsDesc"),
      icon: CalendarCheck,
      href: "/landlord/visits",
      badge:
        stats.activeVisits > 0
          ? `${toBnNumber(stats.activeVisits, i18n.language)} ${t("landlord.activeBadge")}`
          : undefined,
      cta: t("landlord.myVisitsCta"),
    },
  ];

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
          <p className="font-semibold text-foreground">
            {t("landlord.privacyBannerTitle")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("landlord.privacyBannerDesc")}
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t("landlord.kpiTotalListings")}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : toBnNumber(stats.totalListings, i18n.language)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {t("landlord.kpiTotalDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-300">
            {t("landlord.kpiApproved")}
          </p>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {loading ? "..." : toBnNumber(stats.approvedListings, i18n.language)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("landlord.kpiApprovedDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300">
            {t("landlord.kpiPending")}
          </p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {loading ? "..." : toBnNumber(stats.pendingListings, i18n.language)}
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("landlord.kpiPendingDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t("landlord.kpiActiveVisits")}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : toBnNumber(stats.activeVisits, i18n.language)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {t("landlord.kpiVisitsDesc")}
          </span>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-primary">
            {t("landlord.kpiInquiries")}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : toBnNumber(stats.pendingContactRequests, i18n.language)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {t("landlord.kpiInquiriesDesc")}
          </span>
        </div>
      </div>

      {/* Action Navigation Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.href}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {c.badge && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {c.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60">
                <Link
                  to={c.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>{c.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </RoleLayout>
  );
}
