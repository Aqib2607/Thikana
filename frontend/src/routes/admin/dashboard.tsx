import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
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
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Thikana" },
      {
        name: "description",
        content: "Platform moderation, listing approvals, and simulated verifications.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const cards = [
    {
      title: t("dashboard.pendingApprovals"),
      desc: "নতুন জমা পড়া বাসাগুলো যাচাই করে অনুমোদন অথবা কারণসহ বাতিল করুন।",
      icon: AlertTriangle,
      href: "/admin/properties/pending",
      cta: "অপেক্ষমাণ তালিকা দেখুন",
    },
    {
      title: t("dashboard.allProperties"),
      desc: "প্ল্যাটফর্মের সকল সক্রিয়, সংরক্ষিত ও ভাড়া দেওয়া বাসার তালিকা পরিচালনা।",
      icon: Building2,
      href: "/admin/properties",
      cta: "সকল প্রপার্টি",
    },
    {
      title: t("dashboard.userManagement"),
      desc: "ভাড়াটিয়া ও বাড়িওয়ালাদের অ্যাকাউন্ট সক্রিয়করণ ও তথ্য তদারকি।",
      icon: Users,
      href: "/admin/users",
      cta: "ব্যবহারকারী তালিকা",
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
    },
    {
      title: t("dashboard.myReviews"),
      desc: "ভাড়াটিয়াদের দেয়া রিভিউ ও রেটিং পর্যবেক্ষণ ও মডারেশন।",
      icon: Star,
      href: "/admin/reviews",
      cta: "রিভিউসমূহ",
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
    },
  ];

  return (
    <RoleLayout
      requiredRole="admin"
      title={`${t("dashboard.welcome")}, ${user?.name || ""}`}
      subtitle={t("dashboard.adminTitle")}
      activeTab="dashboard"
    >
      {/* Admin oversight notice */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">প্রশাসনিক প্ল্যাটফর্ম নির্দেশিকা</p>
        <p className="mt-1 text-sm text-muted-foreground">
          অ্যাডমিন হিসেবে প্রতিটি অনুমোদন ও সিদ্ধান্ত অডিট ট্রেইলে সংরক্ষিত থাকে। যাচাইকরণের
          ক্ষেত্রে মনে রাখবেন এটি প্ল্যাটফর্ম সিমুলেশন, সরকারি অনুমোদন নয়।
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.href}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
            >
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
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
