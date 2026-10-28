import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { adminApi } from "@/lib/api/admin";
import { toBnNumber } from "@/lib/i18n";
import type { AuditLogItem } from "@/lib/api/admin";
import { ScrollText, Search, ShieldCheck, Clock, X } from "lucide-react";

export function AdminAuditLogsPage() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState<
    "ALL" | "property" | "user" | "report" | "review" | "community"
  >("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    adminApi.getAuditLogs().then((data) => {
      if (mounted) {
        setLogs(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = logs.filter((log) => {
    const matchesType = targetTypeFilter === "ALL" ? true : log.targetType === targetTypeFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    if (
      action.includes("APPROVED") ||
      action.includes("ACTIVATED") ||
      action.includes("RESOLVED")
    ) {
      return "bg-success/15 text-success";
    }
    if (action.includes("REJECTED") || action.includes("SUSPENDED") || action.includes("DELETED")) {
      return "bg-destructive/15 text-destructive";
    }
    if (action.includes("VERIFICATION") || action.includes("COMMUNITY")) {
      return "bg-primary/15 text-primary";
    }
    return "bg-secondary text-foreground";
  };

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.auditLogs")}
      subtitle={t("admin.auditLogsSubtitle")}
      activeTab="audit"
    >
      {/* Integrity Notice */}
      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {t("admin.immutableBannerTitle")}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t("admin.immutableBannerDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Target Type Filter */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1">
          {(["ALL", "property", "user", "report", "review", "community"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTargetTypeFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                targetTypeFilter === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {type === "ALL"
                ? t("admin.allLogsTab")
                : type === "property"
                  ? t("admin.propertyTab")
                  : type === "user"
                    ? t("admin.userTab")
                    : type === "report"
                      ? t("admin.reportTab")
                      : type === "review"
                        ? t("admin.reviewTab")
                        : t("admin.communityTab")}
              <span className="ml-1 opacity-75">
                (
                {toBnNumber(
                  type === "ALL" ? logs.length : logs.filter((l) => l.targetType === type).length,
                  i18n.language,
                )}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.auditSearchPlaceholder")}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {t("admin.loadingAudit")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-semibold text-foreground">
              {t("admin.noAuditTitle")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                    {t("admin.colTimestamp")}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t("admin.colActor")}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t("admin.colActionLog")}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t("admin.colTarget")}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t("admin.colDetails")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {new Date(log.timestamp).toLocaleString(
                            i18n.language.startsWith("bn") ? "bn-BD" : "en-US",
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/75 font-mono">
                        {log.id}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <div className="font-semibold text-foreground">{log.actorName}</div>
                      <div className="text-[11px] text-muted-foreground">{log.actorId}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold ${getActionBadgeColor(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold text-foreground capitalize">
                        {log.targetType}
                      </span>
                      <div className="mt-0.5 text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                        {log.targetId}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-foreground">
                      <p className="leading-relaxed">{log.details}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
