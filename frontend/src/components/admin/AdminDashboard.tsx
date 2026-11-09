import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { adminApi } from "@/lib/api/admin";
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
    adminApi.getDashboardStats().then((data) => {
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

      {/* KPI Overview Grid - Interactive Operational Summaries */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          to="/admin/properties/pending"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-warning/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-warning">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              {t("dashboard.pendingApprovals")}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {loading ? "..." : toBnNumber(stats?.pendingProperties ?? 0, i18n.language)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.listingsPending")}</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-warning">
            <span>{t("common.viewDetails")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          to="/admin/properties"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              {t("admin.approvedProperties")}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {loading ? "..." : toBnNumber(stats?.approvedProperties ?? 0, i18n.language)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.outOfTotal")}</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{t("common.viewDetails")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              {t("admin.totalUsers")}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {loading ? "..." : toBnNumber(stats?.totalUsers ?? 0, i18n.language)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {stats
                ? t("admin.userStatsFormat", {
                    tenants: toBnNumber(stats.tenantUsers, i18n.language),
                    landlords: toBnNumber(stats.landlordUsers, i18n.language),
                  })
                : "..."}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-primary">
            <span>{t("common.viewDetails")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-destructive/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              {t("admin.unresolvedReports")}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {loading ? "..." : toBnNumber(stats?.pendingReports ?? 0, i18n.language)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.moderationNeeded")}</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-destructive">
            <span>{t("common.viewDetails")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>
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
                c.highlight ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {c.badge && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-tight shadow-2xs ${
                        c.highlight
                          ? "border border-amber-500/40 bg-amber-500 text-white dark:bg-amber-600 dark:text-white"
                          : "border border-border/80 bg-surface text-foreground font-semibold"
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-xs"
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
