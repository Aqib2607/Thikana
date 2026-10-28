import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { mockAdminApi } from "@/lib/api/mock/admin";
import type { AreaDemandStat } from "@/lib/api/admin";
import { translateArea, translatePropertyType, toBnNumber } from "@/lib/i18n";
import {
  TrendingUp,
  Building2,
  Users,
  CalendarCheck,
  MapPin,
} from "lucide-react";

export function AdminAnalyticsPage() {
  const { t, i18n } = useTranslation();
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
      subtitle={t("admin.analyticsSubtitle")}
      activeTab="analytics"
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          {t("admin.analyticsLoading")}
        </div>
      ) : !data ? null : (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("admin.topDemandArea")}
                </span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {translateArea(data.areaDemand[0]?.area || "KUET Gate / Teligati", i18n.language).split("/")[0]?.trim()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.highestStudentInquiries")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("admin.avgStudentRent")}
                </span>
                <Building2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                ৳ {toBnNumber("5,800", i18n.language)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.perRoomSeat")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("admin.studentPriority")}
                </span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {toBnNumber(Math.round((data.studentPreferenceRatio.studentsOnly / totalStudentPref) * 100), i18n.language)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.explicitListingMention")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("admin.completedVisits")}
                </span>
                <CalendarCheck className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                {toBnNumber(data.totalVisitsCompleted, i18n.language)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.verifiedVisits")}
              </p>
            </div>
          </div>

          {/* Area Demand & Inquiries Chart / Table */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {t("admin.areaDemandHeading")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("admin.areaDemandDescription")}
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
                        <span>{translateArea(item.area, i18n.language)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>
                          {t("admin.avgRentLabel", { rent: toBnNumber(item.avgRent.toLocaleString(), i18n.language) })}
                        </span>
                        <span className="font-bold text-foreground">
                          {t("admin.listingAndInquiryFormat", {
                            listings: toBnNumber(item.listingCount, i18n.language),
                            inquiries: toBnNumber(item.inquiryCount, i18n.language),
                          })}
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
              <h2 className="text-base font-bold text-foreground">
                {t("admin.propertyTypeDistribution")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("admin.propertyTypeDistributionDesc")}
              </p>

              <div className="mt-6 space-y-3">
                {Object.entries(data.propertyTypeDistribution).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 text-xs"
                  >
                    <span className="font-semibold text-foreground">
                      {translatePropertyType(type, i18n.language)}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                      {t("admin.listingCountBadge", { count: toBnNumber(count, i18n.language) })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Preferences Breakdown */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground">
                {t("admin.tenantPreferenceDistribution")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("admin.tenantPreferenceDistributionDesc")}
              </p>

              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">{t("tenantPreferences.studentsOnly")}</span>
                    <span className="text-primary font-bold">
                      {t("admin.countWithPercentage", {
                        count: toBnNumber(data.studentPreferenceRatio.studentsOnly, i18n.language),
                        percentage: toBnNumber(Math.round((data.studentPreferenceRatio.studentsOnly / totalStudentPref) * 100), i18n.language),
                      })}
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
                    <span className="text-foreground">{t("tenantPreferences.any")}</span>
                    <span className="text-foreground font-bold">
                      {t("admin.countWithPercentage", {
                        count: toBnNumber(data.studentPreferenceRatio.any, i18n.language),
                        percentage: toBnNumber(Math.round((data.studentPreferenceRatio.any / totalStudentPref) * 100), i18n.language),
                      })}
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
                    <span className="text-foreground">{t("tenantPreferences.familyOnly")}</span>
                    <span className="text-foreground font-bold">
                      {t("admin.countWithPercentage", {
                        count: toBnNumber(data.studentPreferenceRatio.familyOnly, i18n.language),
                        percentage: toBnNumber(Math.round((data.studentPreferenceRatio.familyOnly / totalStudentPref) * 100), i18n.language),
                      })}
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
