import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import { toBnNumber } from "@/lib/i18n";
import type { AdminStats } from "@/lib/api/admin";
import {
  AlertTriangle,
  Building2,
  Users,
  ShieldCheck,
  Star,
  FileSpreadsheet,
  BarChart3,
  ScrollText,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    mockAdminApi.getDashboardStats().then((data) => {
      if (mounted) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    {
      title: t("dashboard.pendingApprovals"),
      desc: t("admin.pendingApprovalsDesc"),
      icon: AlertTriangle,
      href: "/admin/properties/pending",
      cta: t("admin.pendingApprovalsCta"),
      badge: stats
        ? `${toBnNumber(stats.pendingProperties, i18n.language)} ${t("landlord.pendingApproval")}`
        : undefined,
      highlight: stats ? stats.pendingProperties > 0 : false,
    },
    {
      title: t("dashboard.allProperties"),
      desc: t("admin.allPropertiesDesc"),
      icon: Building2,
      href: "/admin/properties",
      cta: t("admin.allPropertiesCta"),
      badge: stats
        ? `${toBnNumber(stats.totalProperties, i18n.language)} ${t("properties.allProperties")}`
        : undefined,
    },
    {
      title: t("dashboard.userManagement"),
      desc: t("admin.userManagementDesc"),
      icon: Users,
      href: "/admin/users",
      cta: t("admin.userManagementCta"),
      badge: stats
        ? `${toBnNumber(stats.totalUsers, i18n.language)} ${t("admin.totalUsers")}`
        : undefined,
    },
    {
      title: t("dashboard.verifications"),
      desc: t("admin.verificationsDesc"),
      icon: ShieldCheck,
      href: "/admin/verifications",
      cta: t("admin.verificationsCta"),
    },
    {
      title: t("dashboard.reportsModeration"),
      desc: t("admin.reportsDesc"),
      icon: AlertTriangle,
      href: "/admin/reports",
      cta: t("admin.reportsCta"),
      badge:
        stats && stats.pendingReports > 0
          ? `${toBnNumber(stats.pendingReports, i18n.language)} ${t("admin.unresolvedReports")}`
          : undefined,
      highlight: stats ? stats.pendingReports > 0 : false,
    },
    {
      title: t("dashboard.reviewsModeration"),
      desc: t("admin.reviewsDesc"),
      icon: Star,
      href: "/admin/reviews",
      cta: t("admin.reviewsCta"),
      badge: stats
        ? `${toBnNumber(stats.totalReviews, i18n.language)} ${t("admin.reviewsCta")}`
        : undefined,
    },
    {
      title: t("dashboard.communityManagement"),
      desc: t("admin.communityDesc"),
      icon: FileSpreadsheet,
      href: "/admin/community",
      cta: t("admin.communityCta"),
    },
    {
      title: t("dashboard.analytics"),
      desc: t("admin.analyticsDesc"),
      icon: BarChart3,
      href: "/admin/analytics",
      cta: t("admin.analyticsCta"),
    },
    {
      title: t("dashboard.auditLogs"),
      desc: t("admin.auditLogsDesc"),
      icon: ScrollText,
      href: "/admin/audit-logs",
      cta: t("admin.auditLogsCta"),
      badge: stats
        ? `${toBnNumber(stats.auditLogsCount, i18n.language)} ${t("admin.colActionLog")}`
        : undefined,
    },
  ];

  return (
    <RoleLayout
      requiredRole="admin"
      title={`${t("dashboard.welcome")}, ${user?.name || ""}`}
      subtitle={t("dashboard.adminTitle")}
      activeTab="dashboard"
    >
      {/* Prominent Disclaimer Banner */}
      <div
        role="alert"
        className="mb-8 rounded-2xl border border-warning/40 bg-warning/10 p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t("admin.disclaimerBanner")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("admin.disclaimerDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("dashboard.pendingApprovals")}
            </span>
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : toBnNumber(stats?.pendingProperties ?? 0, i18n.language)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.listingsPending")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("admin.approvedProperties")}
            </span>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : toBnNumber(stats?.approvedProperties ?? 0, i18n.language)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.outOfTotal")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("admin.totalUsers")}
            </span>
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : toBnNumber(stats?.totalUsers ?? 0, i18n.language)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats
              ? t("admin.userStatsFormat", {
                  tenants: toBnNumber(stats.tenantUsers, i18n.language),
                  landlords: toBnNumber(stats.landlordUsers, i18n.language),
                })
              : "..."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t("admin.unresolvedReports")}
            </span>
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : toBnNumber(stats?.pendingReports ?? 0, i18n.language)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.moderationNeeded")}</p>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">
        {t("admin.adminControlPanel")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.href}
              className={`flex flex-col justify-between rounded-2xl border bg-surface p-6 shadow-sm transition-all hover:border-border-strong hover:shadow-md ${
                c.highlight ? "border-warning/60 ring-1 ring-warning/30" : "border-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {c.badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.highlight
                          ? "bg-warning/20 text-warning-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {c.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
              <div className="mt-6 border-t border-border pt-4">
                <Link
                  to={c.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-link"
                >
                  <span>{c.cta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </RoleLayout>
  );
}
