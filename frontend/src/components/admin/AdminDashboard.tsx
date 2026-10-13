import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
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
  const { t } = useTranslation();
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
      desc: "নতুন জমা পড়া বাসাগুলো যাচাই করে অনুমোদন অথবা কারণসহ বাতিল করুন।",
      icon: AlertTriangle,
      href: "/admin/properties/pending",
      cta: "অপেক্ষমাণ তালিকা দেখুন",
      badge: stats ? `${stats.pendingProperties} Pending` : undefined,
      highlight: stats ? stats.pendingProperties > 0 : false,
    },
    {
      title: t("dashboard.allProperties"),
      desc: "প্ল্যাটফর্মের সকল সক্রিয়, সংরক্ষিত ও ভাড়া দেওয়া বাসার তালিকা পরিচালনা।",
      icon: Building2,
      href: "/admin/properties",
      cta: "সকল প্রপার্টি",
      badge: stats ? `${stats.totalProperties} Total` : undefined,
    },
    {
      title: t("dashboard.userManagement"),
      desc: "ভাড়াটিয়া ও বাড়িওয়ালাদের অ্যাকাউন্ট সক্রিয়করণ ও তথ্য তদারকি।",
      icon: Users,
      href: "/admin/users",
      cta: "ব্যবহারকারী তালিকা",
      badge: stats ? `${stats.totalUsers} Users` : undefined,
    },
    {
      title: t("dashboard.verifications"),
      desc: "মালিক পরিচয়, ফোন, প্রাপ্যতা এবং নথি সংক্রান্ত প্ল্যাটফর্ম-স্তরের সিমুলেটেড যাচাইকরণ।",
      icon: ShieldCheck,
      href: "/admin/verifications",
      cta: "যাচাইকরণ প্যানেল",
    },
    {
      title: t("dashboard.reportsModeration"),
      desc: "ভাড়াটিয়াদের পাঠানো অভিযোগ (ভুয়া লিস্টিং, ভুল তথ্য) পর্যালোচনা ও ব্যবস্থা গ্রহণ।",
      icon: AlertTriangle,
      href: "/admin/reports",
      cta: "রিপোর্ট ম্যানেজমেন্ট",
      badge: stats && stats.pendingReports > 0 ? `${stats.pendingReports} Unresolved` : undefined,
      highlight: stats ? stats.pendingReports > 0 : false,
    },
    {
      title: t("dashboard.reviewsModeration"),
      desc: "ভাড়াটিয়াদের দেয়া রিভিউ ও রেটিং পর্যবেক্ষণ ও অনুপযুক্ত মন্তব্য অপসারণ।",
      icon: Star,
      href: "/admin/reviews",
      cta: "রিভিউসমূহ",
      badge: stats ? `${stats.totalReviews} Reviews` : undefined,
    },
    {
      title: t("dashboard.communityManagement"),
      desc: "খুলনার বিভিন্ন এলাকার যাতায়াত, জলাবদ্ধতা, ইন্টারনেট, নিরাপত্তা সম্পর্কিত তথ্য ব্যবস্থাপনা।",
      icon: FileSpreadsheet,
      href: "/admin/community",
      cta: "কমিউনিটি ডাটা",
    },
    {
      title: t("dashboard.analytics"),
      desc: "অনুসন্ধান প্রবণতা, এলাকাভিত্তিক চাহিদা এবং লিস্টিং পরিসংখ্যান।",
      icon: BarChart3,
      href: "/admin/analytics",
      cta: "অ্যানালিটিক্স দেখুন",
    },
    {
      title: t("dashboard.auditLogs"),
      desc: "প্রশাসনিক অনুমোদন, পরিবর্তন ও মডারেশন কাজের অপরিবর্তনীয় অডিট লগ।",
      icon: ScrollText,
      href: "/admin/audit-logs",
      cta: "অডিট লগ দেখুন",
      badge: stats ? `${stats.auditLogsCount} Logs` : undefined,
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
            {loading ? "..." : (stats?.pendingProperties ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">লিস্টিং অপেক্ষমাণ</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">অনুমোদিত প্রপার্টি</span>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : (stats?.approvedProperties ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">মোট প্রপার্টির মধ্যে</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">মোট ব্যবহারকারী</span>
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : (stats?.totalUsers ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? `${stats.tenantUsers} ভাড়াটিয়া · ${stats.landlordUsers} বাড়িওয়ালা` : "..."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">অমীমাংসিত অভিযোগ</span>
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {loading ? "..." : (stats?.pendingReports ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">মডারেশন প্রয়োজন</p>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">
        প্রশাসনিক কন্ট্রোল প্যানেল
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
