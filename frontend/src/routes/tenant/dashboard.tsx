import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockTenantApi } from "@/lib/api/mock";
import type { TenantPreferencesData } from "@/lib/api/tenant";
import {
  Search,
  Sliders,
  Heart,
  Columns3,
  CalendarCheck,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/tenant/dashboard")({
  head: () => ({
    meta: [
      { title: "Tenant Dashboard — Thikana" },
      {
        name: "description",
        content: "Manage your rental preferences, saved homes, and landlord communications.",
      },
    ],
  }),
  component: TenantDashboard,
});

function TenantDashboard() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { user } = useAuth();

  const [favoritesCount, setFavoritesCount] = useState(0);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [prefs, setPrefs] = useState<TenantPreferencesData | null>(null);

  useEffect(() => {
    setFavoritesCount(mockTenantApi.getFavoriteIds().length);
    setComparisonCount(mockTenantApi.getComparisonIds().length);
    mockTenantApi.getVisits().then((v) => setVisitsCount(v.length));
    mockTenantApi.getConversations().then((c) => setConvCount(c.length));
    mockTenantApi.getPreferences().then((p) => setPrefs(p));
  }, []);

  const stats = [
    {
      label: isBn ? "সংরক্ষিত বাসা" : "Saved Listings",
      value: favoritesCount,
      href: "/tenant/favorites",
    },
    {
      label: isBn ? "তুলনায় নির্বাচিত" : "Comparing (Max 3)",
      value: `${comparisonCount}/3`,
      href: "/tenant/comparison",
    },
    {
      label: isBn ? "নির্ধারিত পরিদর্শন" : "Scheduled Visits",
      value: visitsCount,
      href: "/tenant/visits",
    },
    {
      label: isBn ? "বার্তা কথোপকথন" : "Conversations",
      value: convCount,
      href: "/tenant/messages",
    },
  ];

  const cards = [
    {
      title: t("dashboard.myPreferences"),
      desc: isBn
        ? "লোকেশন (৩০%), বাজেট (২৫%), ধরন (১৫%), রুম (১০%), সুবিধা (১৫%), প্রাপ্যতা (৫%) অনুযায়ী ম্যাচিং স্কোর দেখুন।"
        : "Define your preferred area, budget and amenities to calculate your transparent 6-factor match score.",
      icon: Sliders,
      href: "/tenant/preferences",
      cta: isBn ? "পছন্দসমূহ সম্পাদনা করুন" : "Edit Preferences",
    },
    {
      title: t("dashboard.myFavorites"),
      desc: isBn
        ? "আপনার পছন্দের বাসাগুলো সংরক্ষিত রাখুন এবং দ্রুত দেখুন।"
        : "Bookmark listings you love and access them quickly across any device.",
      icon: Heart,
      href: "/tenant/favorites",
      cta: isBn ? "সংরক্ষিত বাসা দেখুন" : "View Saved",
    },
    {
      title: t("dashboard.myComparisons"),
      desc: isBn
        ? "একসাথে সর্বোচ্চ ৩টি প্রপার্টির ভাড়া, অগ্রিম, সুবিধা ও অবস্থান পাশাপাশি তুলনা করুন।"
        : "Inspect up to 3 listings side-by-side across 14 specifications without mobile overflow.",
      icon: Columns3,
      href: "/tenant/comparison",
      cta: isBn ? "তুলনা শুরু করুন" : "Open Comparison",
    },
    {
      title: t("dashboard.myVisits"),
      desc: isBn
        ? "বাড়িওয়ালার সাথে বাসা পরিদর্শনের তারিখ ও সময় নির্ধারণ এবং স্ট্যাটাস ট্র্যাক করুন।"
        : "Schedule physical room walkthroughs and track pending, accepted, or completed visits.",
      icon: CalendarCheck,
      href: "/tenant/visits",
      cta: isBn ? "অনুরোধ তালিকা দেখুন" : "View Schedule",
    },
    {
      title: t("dashboard.myMessages"),
      desc: isBn
        ? "যোগাযোগের অনুমোদনের পর বাড়িওয়ালার সাথে অভ্যন্তরীণ বার্তা আদান-প্রদান করুন।"
        : "Direct API-based messaging with verified landlords after contact request approval.",
      icon: MessageSquare,
      href: "/tenant/messages",
      cta: isBn ? "ইনবক্স খুলুন" : "Open Inbox",
    },
    {
      title: t("dashboard.searchProperties"),
      desc: isBn
        ? "খুলনা ও অন্যান্য অঞ্চলের অনুমোদিত ও যাচাইকৃত ভাড়ার বাসা খুঁজুন।"
        : "Search Khulna student hubs (KUET Gate, Gallamari, Sonadanga, Boyra) with real exact addresses.",
      icon: Search,
      href: "/properties",
      cta: isBn ? "বাসা অনুসন্ধান করুন" : "Search Listings",
    },
  ];

  return (
    <RoleLayout
      requiredRole="tenant"
      title={`${t("dashboard.welcome")}, ${user?.name || ""}`}
      subtitle={t("dashboard.tenantTitle")}
      activeTab="dashboard"
    >
      {/* Platform notice */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="text-xs">
          <p className="font-semibold text-foreground">
            {isBn ? "প্ল্যাটফর্ম যাচাইকরণ নির্দেশিকা" : "Platform Simulated Verification Notice"}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {isBn
              ? "ঠিকানায় প্রদর্শিত যাচাইকরণ প্রতীকগুলো প্ল্যাটফর্ম-স্তরের সিমুলেটেড তথ্য যাচাই (মালিক পরিচয়, ফোন ও প্রাপ্যতা)। এগুলো কোনো সরকারি সনদপত্র নয়।"
              : "Badges shown on Thikana represent platform-level simulated identity & availability checks, not government certifications."}
          </p>
        </div>
      </div>

      {/* Quick Statistics Bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.href}
            to={s.href}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
          >
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>
          </Link>
        ))}
      </div>

      {/* Preferences Preview Card */}
      {prefs && (
        <div className="mb-6 rounded-2xl border border-border bg-secondary/30 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {isBn ? "আপনার বর্তমান সক্রিয় পছন্দসমূহ" : "Active Matching Criteria"}
              </h2>
            </div>
            <Link
              to="/tenant/preferences"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {isBn ? "পরিবর্তন করুন" : "Edit"}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-foreground">
              {isBn ? "পছন্দের এলাকা: " : "Area: "}
              <strong>{prefs.preferredArea || (isBn ? "যেকোনো" : "Any")}</strong>
            </span>
            <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-foreground">
              {isBn ? "বাজেট: " : "Budget: "}
              <strong>৳{(prefs.maxBudget || 10000).toLocaleString()}</strong>
            </span>
            <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-foreground">
              {isBn ? "ধরন: " : "Type: "}
              <strong>{prefs.preferredPropertyType || (isBn ? "যেকোনো" : "Any")}</strong>
            </span>
            <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-foreground">
              {isBn ? "রুম: " : "Min Rooms: "}
              <strong>{prefs.minRooms || 1}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Grid of Navigation Cards */}
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
                <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{c.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  to={c.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-link"
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
