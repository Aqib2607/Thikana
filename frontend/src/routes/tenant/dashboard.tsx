import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import {
  tenantApi,
  type TenantDashboardStats,
  type VisitRequestItem,
  type ConversationItem,
} from "@/lib/api/tenant";
import { propertyApi, type PropertyItem } from "@/lib/api/properties";
import { PropertyCard } from "@/components/property/PropertyCard";
import { translateArea, translatePropertyType, toBnNumber } from "@/lib/i18n";
import {
  Sliders,
  Heart,
  Columns3,
  CalendarCheck,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/tenant/dashboard")({
  head: () => ({
    meta: [
      { title: "Tenant Dashboard — Thikana" },
      {
        name: "description",
        content: "Manage your rental preferences, saved homes, and landlord communications.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: TenantDashboard,
});

export function TenantDashboard() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { user } = useAuth();

  // 1. Dashboard live metrics & preferences
  const { data, isLoading, isError, refetch, isFetching } = useQuery<TenantDashboardStats>({
    queryKey: ["tenantDashboardStats"],
    queryFn: () => tenantApi.getDashboardStats(),
  });

  // 2. Latest matching properties
  const {
    data: matchingData,
    isLoading: isLoadingMatching,
    isError: isErrorMatching,
    refetch: refetchMatching,
  } = useQuery<{ data: PropertyItem[] }>({
    queryKey: ["tenantMatchingProperties"],
    queryFn: () => propertyApi.list({ limit: 3, sortBy: "match" }),
  });

  // 3. Recent visit requests
  const {
    data: visits = [],
    isLoading: isLoadingVisits,
    isError: isErrorVisits,
    refetch: refetchVisits,
  } = useQuery<VisitRequestItem[]>({
    queryKey: ["tenantVisits"],
    queryFn: () => tenantApi.getVisits(),
  });

  // 4. Recent conversations
  const {
    data: conversations = [],
    isLoading: isLoadingConvs,
    isError: isErrorConvs,
    refetch: refetchConvs,
  } = useQuery<ConversationItem[]>({
    queryKey: ["conversations"],
    queryFn: () => tenantApi.getConversations(),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  const favoritesCount = data?.favoritesCount ?? 0;
  const comparisonCount = data?.comparisonCount ?? 0;
  const visitsCount = data?.visitsCount ?? 0;
  const convCount = data?.conversationsCount ?? 0;
  const prefs = data?.preferences ?? null;

  const stats = [
    {
      label: t("tenant.savedProperties"),
      value: favoritesCount,
      href: "/tenant/favorites",
      icon: Heart,
    },
    {
      label: t("tenant.comparingProperties"),
      value: `${comparisonCount}/3`,
      href: "/tenant/comparison",
      icon: Columns3,
    },
    {
      label: t("tenant.visitRequests"),
      value: visitsCount,
      href: "/tenant/visits",
      icon: CalendarCheck,
    },
    {
      label: t("tenant.activeChats"),
      value: convCount,
      href: "/tenant/messages",
      icon: MessageSquare,
    },
  ];

  const matchingProperties = matchingData?.data ?? [];
  const recentVisits = visits.slice(0, 3);
  const recentConversations = conversations.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return (
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            {t("tenant.statusAccepted")}
          </span>
        );
      case "Completed":
        return (
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            {t("tenant.statusCompleted")}
          </span>
        );
      case "Pending":
        return (
          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {t("tenant.statusPending")}
          </span>
        );
      case "Rejected":
        return (
          <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-2xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            {t("tenant.statusRejected")}
          </span>
        );
      case "Cancelled":
        return (
          <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-2xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            {t("tenant.statusCancelled")}
          </span>
        );
      default:
        return (
          <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-2xs font-semibold text-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("dashboard.tenantTitle")}
      subtitle={`${t("dashboard.welcome")}, ${user?.name || (isBn ? "ভাড়াটিয়া" : "Tenant")}`}
    >
      {/* Platform Verification Guidance Notice - Compact Design */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <div>
          <span className="font-semibold text-foreground">
            {isBn ? "প্ল্যাটফর্ম যাচাইকরণ নির্দেশিকা: " : "Platform Simulated Verification Notice: "}
          </span>
          <span className="text-muted-foreground">
            {isBn
              ? "ঠিকানায় প্রদর্শিত যাচাইকরণ প্রতীকগুলো প্ল্যাটফর্ম-স্তরের সিমুলেটেড তথ্য যাচাই (মালিক পরিচয়, ফোন ও প্রাপ্যতা)। এগুলো কোনো সরকারি সনদপত্র নয়।"
              : "Badges shown on Thikana represent platform-level simulated identity & availability checks, not government certifications."}
          </span>
        </div>
      </div>

      {/* Error State Notice with Retry */}
      {isError && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isBn
                ? "ড্যাশবোর্ড তথ্য লোড করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
                : "Failed to load dashboard statistics. Please try again."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-destructive/30 bg-surface px-3 py-1 font-medium text-foreground transition-all hover:bg-destructive/20 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}</span>
          </button>
        </div>
      )}

      {/* Quick Statistics Bar - Compact & High-Density */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              to={s.href}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {s.label}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted/60" aria-hidden="true" />
                ) : isError ? (
                  <span className="text-sm font-normal text-muted-foreground">—</span>
                ) : (
                  s.value
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Preferences Preview Card - Sentence Case & Action Grouped */}
      {prefs && (
        <div className="mb-8 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("tenant.savedPreferences")}
              </h2>
            </div>
            <Link
              to="/tenant/preferences"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-secondary hover:underline"
            >
              <span>{t("tenant.edit")}</span>
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-surface border border-border px-2.5 py-1 text-foreground shadow-2xs">
              <span className="text-muted-foreground">{t("tenant.areaLabel")}</span>{" "}
              <strong>{prefs.preferredArea ? translateArea(prefs.preferredArea, i18n.language) : t("tenant.any")}</strong>
            </span>
            <span className="rounded-md bg-surface border border-border px-2.5 py-1 text-foreground shadow-2xs">
              <span className="text-muted-foreground">{t("tenant.budgetLabel")}</span>{" "}
              <strong>৳{toBnNumber((prefs.maxBudget || 10000).toLocaleString(), i18n.language)}</strong>
            </span>
            <span className="rounded-md bg-surface border border-border px-2.5 py-1 text-foreground shadow-2xs">
              <span className="text-muted-foreground">{t("tenant.typeLabel")}</span>{" "}
              <strong>{prefs.preferredPropertyType ? translatePropertyType(prefs.preferredPropertyType, i18n.language) : t("tenant.any")}</strong>
            </span>
            <span className="rounded-md bg-surface border border-border px-2.5 py-1 text-foreground shadow-2xs">
              <span className="text-muted-foreground">{t("tenant.roomsLabel")}</span>{" "}
              <strong>{toBnNumber(prefs.minRooms || 1, i18n.language)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Real Summary Section: Latest Matching Properties */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("dashboard.matchingHomes")}
            </h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
          >
            <span>{t("dashboard.browseAll")}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {isLoadingMatching ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 animate-pulse rounded-2xl border border-border bg-surface p-4"
                aria-hidden="true"
              >
                <div className="h-40 rounded-xl bg-muted/60" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted/60" />
                <div className="mt-2 h-4 w-1/2 rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : isErrorMatching ? (
          <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            <span>{isBn ? "প্রপার্টি তালিকা লোড করা যায়নি।" : "Failed to load matching properties."}</span>
            <button
              type="button"
              onClick={() => refetchMatching()}
              className="font-medium underline hover:opacity-80"
            >
              {isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}
            </button>
          </div>
        ) : matchingProperties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">{t("dashboard.noMatchingHomes")}</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              {t("dashboard.noMatchingHomesDesc")}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to="/tenant/preferences"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("dashboard.setPreferences")}</span>
              </Link>
              <Link
                to="/properties"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <span>{t("dashboard.browseAll")}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Two-Column Grid: Recent Visit Requests & Recent Conversations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Recent Visit Requests */}
        <section className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("dashboard.recentVisits")}
              </h2>
            </div>
            <Link
              to="/tenant/visits"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{t("dashboard.viewAllVisits")}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {isLoadingVisits ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : isErrorVisits ? (
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <span>{isBn ? "পরিদর্শনের তালিকা লোড করা যায়নি।" : "Failed to load visit requests."}</span>
              <button
                type="button"
                onClick={() => refetchVisits()}
                className="font-medium underline hover:opacity-80"
              >
                {isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}
              </button>
            </div>
          ) : recentVisits.length === 0 ? (
            <div className="my-auto py-8 text-center">
              <Calendar className="mx-auto h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-2 text-xs font-medium text-foreground">{t("dashboard.noVisitsYet")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("tenant.noVisitsDesc")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {visit.propertyTitle}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {translateArea(visit.propertyArea, i18n.language)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {visit.visitDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {visit.visitTimeSlot}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(visit.status)}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Recent Conversations */}
        <section className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("dashboard.recentMessages")}
              </h2>
            </div>
            <Link
              to="/tenant/messages"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{t("dashboard.viewAllMessages")}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {isLoadingConvs ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : isErrorConvs ? (
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <span>{isBn ? "বার্তার তালিকা লোড করা যায়নি।" : "Failed to load conversations."}</span>
              <button
                type="button"
                onClick={() => refetchConvs()}
                className="font-medium underline hover:opacity-80"
              >
                {isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}
              </button>
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="my-auto py-8 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-2 text-xs font-medium text-foreground">{t("dashboard.noMessagesYet")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("dashboard.noMessagesDesc")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  to="/tenant/messages"
                  className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {conv.landlordName}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-2xs text-muted-foreground shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-muted-foreground truncate">{conv.propertyTitle}</p>
                  <p className="mt-0.5 text-xs text-foreground/80 line-clamp-1 italic">
                    "{conv.lastMessage || (isBn ? "বার্তা নেই" : "No messages yet")}"
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </RoleLayout>
  );
}
