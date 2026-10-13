import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
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
  const { t } = useTranslation();
  const { user } = useAuth();

  const cards = [
    {
      title: t("dashboard.myPreferences"),
      desc: "লোকেশন (৩০%), বাজেট (২৫%), ধরন (১৫%), রুম (১০%), সুবিধা (১৫%), প্রাপ্যতা (৫%) অনুযায়ী ম্যাচিং স্কোর দেখুন।",
      icon: Sliders,
      href: "/tenant/preferences",
      cta: "পছন্দসমূহ সম্পাদনা করুন",
    },
    {
      title: t("dashboard.myFavorites"),
      desc: "আপনার পছন্দের বাসাগুলো সংরক্ষিত রাখুন এবং দ্রুত দেখুন।",
      icon: Heart,
      href: "/tenant/favorites",
      cta: "সংরক্ষিত বাসা দেখুন",
    },
    {
      title: t("dashboard.myComparisons"),
      desc: "একসাথে সর্বোচ্চ ৩টি প্রপার্টির ভাড়া, অগ্রিম, সুবিধা ও অবস্থান পাশাপাশি তুলনা করুন।",
      icon: Columns3,
      href: "/tenant/comparison",
      cta: "তুলনা শুরু করুন",
    },
    {
      title: t("dashboard.myVisits"),
      desc: "বাড়িওয়ালার সাথে বাসা পরিদর্শনের তারিখ ও সময় নির্ধারণ এবং স্ট্যাটাস ট্র্যাক করুন।",
      icon: CalendarCheck,
      href: "/tenant/visits",
      cta: "অনুরোধ তালিকা দেখুন",
    },
    {
      title: t("dashboard.myMessages"),
      desc: "যোগাযোগের অনুমোদনের পর বাড়িওয়ালার সাথে অভ্যন্তরীণ বার্তা আদান-প্রদান করুন।",
      icon: MessageSquare,
      href: "/tenant/messages",
      cta: "ইনবক্স খুলুন",
    },
    {
      title: t("dashboard.searchProperties"),
      desc: "খুলনা ও অন্যান্য অঞ্চলের অনুমোদিত ও যাচাইকৃত ভাড়ার বাসা খুঁজুন।",
      icon: Search,
      href: "/properties",
      cta: "বাসা অনুসন্ধান করুন",
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
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">প্ল্যাটফর্ম যাচাইকরণ নির্দেশিকা</p>
          <p className="mt-0.5 text-muted-foreground">
            ঠিকানায় প্রদর্শিত যাচাইকরণ প্রতীকগুলো প্ল্যাটফর্ম-স্তরের সিমুলেটেড তথ্য যাচাই (মালিক
            পরিচয়, ফোন ও প্রাপ্যতা)। এগুলো কোনো সরকারি সনদপত্র নয়।
          </p>
        </div>
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
