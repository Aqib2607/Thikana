import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import { toBnNumber } from "@/lib/i18n";
import type { ListingReportItem } from "@/lib/api/tenant";
import {
  CheckCircle2,
  XCircle,
  Search,
  X,
  ShieldCheck,
  Clock,
} from "lucide-react";

export function AdminReportsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState<ListingReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Pending Review" | "Resolved" | "Dismissed"
  >("ALL");
  const [search, setSearch] = useState("");

  // Resolution modal state
  const [activeReport, setActiveReport] = useState<ListingReportItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"Resolved" | "Dismissed">("Resolved");
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await mockAdminApi.getReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleOpenModal = (report: ListingReportItem, status: "Resolved" | "Dismissed") => {
    setActiveReport(report);
    setTargetStatus(status);
    setResolutionNote("");
  };

  const handleConfirmResolve = async () => {
    if (!user || !activeReport) return;
    setSubmitting(true);
    try {
      const updated = await mockAdminApi.resolveReport(
        activeReport.id,
        targetStatus,
        resolutionNote.trim(),
        user.id,
        user.name || "Admin",
      );
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice(
        `Report ${activeReport.id} — ${targetStatus === "Resolved" ? t("admin.resolvedTab") : t("admin.dismissedTab")}`,
      );
      setActiveReport(null);
      setResolutionNote("");
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.propertyTitle.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.reportsModeration")}
      subtitle={t("admin.reportsSubtitle")}
      activeTab="reports"
    >
      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      {/* Control Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1">
          {(["ALL", "Pending Review", "Resolved", "Dismissed"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab === "ALL"
                ? t("admin.allReportsTab")
                : tab === "Pending Review"
                  ? t("admin.pendingReviewTab")
                  : tab === "Resolved"
                    ? t("admin.resolvedTab")
                    : t("admin.dismissedTab")}
              <span className="ml-1.5 opacity-75">
                (
                {toBnNumber(
                  tab === "ALL"
                    ? reports.length
                    : reports.filter((r) => r.status === tab).length,
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
            placeholder={t("admin.reportSearchPlaceholder")}
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

      {/* Reports Grid */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          {t("admin.loadingReports")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-success" />
          <h2 className="mt-3 text-base font-bold text-foreground">
            {t("admin.noReportsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.noReportsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <article
              key={r.id}
              className={`rounded-2xl border bg-surface p-6 shadow-sm transition-all ${
                r.status === "Pending Review"
                  ? "border-warning/50 ring-1 ring-warning/20"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                      {r.reason}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === "Pending Review"
                          ? "bg-warning/20 text-warning-foreground"
                          : r.status === "Resolved"
                            ? "bg-success/15 text-success"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r.status === "Pending Review"
                        ? t("admin.reviewNeeded")
                        : r.status === "Resolved"
                          ? t("admin.resolvedTab")
                          : t("admin.dismissedTab")}
                    </span>
                    <span className="text-xs text-muted-foreground">ID: {r.id}</span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-foreground">
                    {t("admin.colProperty")}: {r.propertyTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground bg-secondary/30 p-3 rounded-xl border border-border">
                    "{r.details}"
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{t("admin.reporter")} {r.reporterId}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {r.status === "Pending Review" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(r, "Resolved")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{t("admin.resolveBtn")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(r, "Dismissed")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>{t("admin.dismissBtn")}</span>
                      </button>
                    </>
                  )}
                  {r.status !== "Pending Review" && (
                    <span className="text-xs font-medium text-muted-foreground italic">
                      {t("admin.reportResolvedAlready")}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      {activeReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">
              {targetStatus === "Resolved" ? t("admin.resolveModalTitle") : t("admin.dismissModalTitle")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.colProperty")}: {activeReport.propertyTitle}
            </p>

            <div className="mt-4">
              <label
                htmlFor="resolutionNote"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                {t("admin.resolutionNoteLabel")}
              </label>
              <textarea
                id="resolutionNote"
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder={t("admin.resolutionNotePlaceholder")}
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {t("landlord.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={submitting}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 ${
                  targetStatus === "Resolved" ? "bg-success" : "bg-destructive"
                }`}
              >
                {submitting ? t("admin.processing") : t("admin.confirmAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
