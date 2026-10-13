import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
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
  AlertCircle,
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
  const isBn = i18n.language === "bn";
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
      desc: isBn
        ? "আপনার প্রকাশিত ও খসড়া বাসাগুলোর তথ্য, ভাড়া এবং প্রাপ্যতা (Available, Reserved, Rented) নিয়ন্ত্রণ করুন।"
        : "Manage your property listings, approval states, and rental availability.",
      icon: Building2,
      href: "/landlord/properties",
      badge: `${stats.totalListings} ${isBn ? "লিস্টিং" : "Listings"}`,
      cta: isBn ? "লিস্টিং পরিচালনা করুন" : "Manage Listings",
    },
    {
      title: t("dashboard.newProperty"),
      desc: isBn
        ? "সর্বোচ্চ ৫টি ছবি, বিস্তারিত অবস্থান এবং সুবিধাসমূহ দিয়ে নতুন লিস্টিং অনুমোদনের জন্য জমা দিন।"
        : "Upload up to 5 photos, structured Khulna location, and submit for admin review.",
      icon: PlusCircle,
      href: "/landlord/properties/new",
      badge: isBn ? "নতুন যোগ" : "Create New",
      cta: isBn ? "নতুন বাসা যোগ করুন" : "Add Property",
    },
    {
      title: t("dashboard.contactRequests"),
      desc: isBn
        ? "ভাড়াটিয়াদের যোগাযোগের অনুরোধ পর্যালোচনা ও গ্রহণ করুন (মেসেজিং আনলক হবে)।"
        : "Review and approve tenant contact requests to unlock direct platform messaging.",
      icon: FileText,
      href: "/landlord/contact-requests",
      badge:
        stats.pendingContactRequests > 0
          ? `${stats.pendingContactRequests} ${isBn ? "অপেক্ষমাণ" : "Pending"}`
          : undefined,
      cta: isBn ? "অনুরোধ তালিকা দেখুন" : "View Inquiries",
    },
    {
      title: t("dashboard.myMessages"),
      desc: isBn
        ? "অনুমোদিত ভাড়াটিয়াদের সাথে বাসা সম্পর্কিত সরাসরি বার্তা আদান-প্রদান করুন।"
        : "Direct conversation inbox with approved prospective tenants.",
      icon: MessageSquare,
      href: "/landlord/messages",
      cta: isBn ? "বার্তা ইনবক্স" : "Open Inbox",
    },
    {
      title: t("dashboard.myVisits"),
      desc: isBn
        ? "ভাড়াটিয়ার বাসা পরিদর্শনের তারিখ অনুমোদন বা সম্পন্ন করুন (Pending, Accepted, Completed)।"
        : "Accept in-person visits and mark them completed to verify tenant reviews.",
      icon: CalendarCheck,
      href: "/landlord/visits",
      badge:
        stats.activeVisits > 0
          ? `${stats.activeVisits} ${isBn ? "সক্রিয় শিডিউল" : "Active"}`
          : undefined,
      cta: isBn ? "পরিদর্শন শিডিউল" : "Schedule Visits",
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
            {isBn ? "যোগাযোগ ও গোপনীয়তা নিয়ন্ত্রণ" : "Landlord Contact & Privacy Control"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isBn
              ? "বাড়িওয়ালা হিসেবে আপনি প্রতিটি প্রপার্টিতে নির্বাচন করতে পারবেন আপনার যোগাযোগের তথ্য (মোবাইল নম্বর) জনসম্মুখে সরাসরি প্রদর্শিত হবে কি না। লুকানো থাকলে ভাড়াটিয়ারা কেবল অনুমোদনের পরই যোগাযোগ করতে পারবে।"
              : "As a landlord, you control whether your phone number is publicly visible on your listing or protected behind contact request approval."}
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {isBn ? "মোট লিস্টিং" : "Total Listings"}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : stats.totalListings}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {isBn ? "আপনার অ্যাকাউন্টে" : "In your account"}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-300">
            {isBn ? "অনুমোদিত লিস্টিং" : "Approved"}
          </p>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {loading ? "..." : stats.approvedListings}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {isBn ? "অনুসন্ধানে সক্রিয়" : "Live on discovery"}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300">
            {isBn ? "অনুমোদনাধীন" : "Pending Review"}
          </p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {loading ? "..." : stats.pendingListings}
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 block flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isBn ? "অ্যাডমিন রিভিউ" : "Under review"}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {isBn ? "সক্রিয় পরিদর্শন" : "Active Visits"}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : stats.activeVisits}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {isBn ? "অনুমোদিত বা অপেক্ষমাণ" : "Upcoming schedule"}
          </span>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-primary">
            {isBn ? "অপেক্ষমাণ অনুরোধ" : "Inquiries"}
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : stats.pendingContactRequests}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {isBn ? "ভাড়াটিয়াদের আগ্রহ" : "Action needed"}
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
