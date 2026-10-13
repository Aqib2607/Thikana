import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { mockAdminApi } from "@/lib/api/mock/admin";
import type { AreaDemandStat } from "@/lib/api/admin";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  CalendarCheck,
  MapPin,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Rental Analytics — Admin Thikana" },
      {
        name: "description",
        content: "Khulna academic rental demand, student preference ratios, and inquiry trends.",
      },
    ],
  }),
  component: AdminAnalyticsPage,
});

export function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<{
    areaDemand: AreaDemandStat[];
    propertyTypeDistribution: Record<string, number>;
    studentPreferenceRatio: { studentsOnly: number; any: number; familyOnly: number };
    totalVisitsCompleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    mockAdminApi.getAnalytics().then((res) => {
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const maxInquiries = data ? Math.max(...data.areaDemand.map((d) => d.inquiryCount), 1) : 1;
  const totalStudentPref = data
    ? data.studentPreferenceRatio.studentsOnly +
      data.studentPreferenceRatio.any +
      data.studentPreferenceRatio.familyOnly
    : 1;

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.analytics")}
      subtitle="খুলনার বিভিন্ন এলাকার শিক্ষার্থী ভাড়া চাহিদা, গড় ভাড়া ও লিস্টিং পরিসংখ্যান"
      activeTab="analytics"
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          অ্যানালিটিক্স লোড হচ্ছে...
        </div>
      ) : !data ? null : (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  শীর্ষ চাহিদা এলাকা
                </span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {data.areaDemand[0]?.area.split("/")[0] || "KUET Gate"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">সর্বোচ্চ শিক্ষার্থী অনুসন্ধান</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  গড় শিক্ষার্থী ভাড়া
                </span>
                <Building2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">৳ ৫,৮০০</p>
              <p className="mt-1 text-xs text-muted-foreground">রুম/সিট প্রতি মাসিক</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">ছাত্র অগ্রাধিকার</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {Math.round((data.studentPreferenceRatio.studentsOnly / totalStudentPref) * 100)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">লিস্টিংয়ে সরাসরি উল্লেখ</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">সম্পন্ন ভিজিট</span>
                <CalendarCheck className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">{data.totalVisitsCompleted}</p>
              <p className="mt-1 text-xs text-muted-foreground">যাচাইকৃত পরিদর্শন</p>
            </div>
          </div>

          {/* Area Demand & Inquiries Chart / Table */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  এলাকাভিত্তিক লিস্টিং ও অনুসন্ধানের চাহিদা (Area Demand)
                </h2>
                <p className="text-xs text-muted-foreground">
                  খুলনার বিভিন্ন ক্যাম্পাসের আশেপাশের এলাকার সক্রিয় লিস্টিং এবং অনুসন্ধান প্রবণতা
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {data.areaDemand.map((item) => {
                const percentage = Math.round((item.inquiryCount / maxInquiries) * 100);
                return (
                  <div key={item.area} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{item.area}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>গড় ভাড়া: ৳{item.avgRent.toLocaleString()}</span>
                        <span className="font-bold text-foreground">
                          {item.listingCount} লিস্টিং · {item.inquiryCount} অনুসন্ধান
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Insights: Property Type & Tenant Preferences */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Property Types */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground">প্রপার্টি ধরনের বণ্টন</h2>
              <p className="text-xs text-muted-foreground">
                প্ল্যাটফর্মে ফ্ল্যাট, রুম, মেস ও হোস্টেলের অনুপাত
              </p>

              <div className="mt-6 space-y-3">
                {Object.entries(data.propertyTypeDistribution).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 text-xs"
                  >
                    <span className="font-semibold text-foreground">{type}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                      {count} টি লিস্টিং
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Preferences Breakdown */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground">
                বাড়িওয়ালাদের পছন্দ (ভাড়াটিয়া ধরণ)
              </h2>
              <p className="text-xs text-muted-foreground">
                ছাত্র, ফ্যামিলি এবং যে কারো জন্য উন্মুক্ত বাসার অনুপাত
              </p>

              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">শুধুমাত্র শিক্ষার্থী (Students Only)</span>
                    <span className="text-primary font-bold">
                      {data.studentPreferenceRatio.studentsOnly} টি (
                      {Math.round(
                        (data.studentPreferenceRatio.studentsOnly / totalStudentPref) * 100,
                      )}
                      %)
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          (data.studentPreferenceRatio.studentsOnly / totalStudentPref) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">যেকোনো ভাড়াটিয়া (Any)</span>
                    <span className="text-foreground font-bold">
                      {data.studentPreferenceRatio.any} টি (
                      {Math.round((data.studentPreferenceRatio.any / totalStudentPref) * 100)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          (data.studentPreferenceRatio.any / totalStudentPref) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">শুধুমাত্র পরিবার (Family Only)</span>
                    <span className="text-foreground font-bold">
                      {data.studentPreferenceRatio.familyOnly} টি (
                      {Math.round(
                        (data.studentPreferenceRatio.familyOnly / totalStudentPref) * 100,
                      )}
                      %)
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          (data.studentPreferenceRatio.familyOnly / totalStudentPref) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
