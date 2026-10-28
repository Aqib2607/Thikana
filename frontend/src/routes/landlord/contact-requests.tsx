import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import type { ContactRequestItem } from "@/lib/api/tenant";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  User,
  Building2,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/landlord/contact-requests")({
  head: () => ({
    meta: [
      { title: "Contact Requests — Landlord Portal — Thikana" },
      {
        name: "description",
        content: "Review and approve inbound contact inquiries from prospective tenants.",
      },
    ],
  }),
  component: LandlordContactRequestsPage,
});

function LandlordContactRequestsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ContactRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      const data = await mockLandlordApi.getContactRequests(user.id);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleUpdateStatus = async (requestId: string, newStatus: "Accepted" | "Rejected") => {
    try {
      await mockLandlordApi.updateContactRequestStatus(requestId, newStatus);
      setActionNotice(
        newStatus === "Accepted"
          ? t("landlord.requestAcceptedMsg")
          : t("landlord.requestRejectedMsg"),
      );
      loadRequests();
    } catch {
      // Ignore
    }
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("landlord.contactRequestsTitle")}
      subtitle={t("landlord.contactRequestsSubtitle")}
      activeTab="requests"
    >
      {/* Notice Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">
            {t("landlord.policyTitle")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("landlord.policyDesc")}
          </p>
        </div>
      </div>

      {actionNotice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-semibold hover:underline"
          >
            {t("landlord.dismiss")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("landlord.loadingRequests")}
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("landlord.noRequestsTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {t("landlord.noRequestsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isPending = req.status === "Pending";
            const isAccepted = req.status === "Accepted";
            const isRejected = req.status === "Rejected";

            return (
              <article
                key={req.id}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h4 className="font-bold text-foreground text-base">{req.tenantName}</h4>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {req.tenantPhone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{req.propertyTitle}</span>
                      <span>•</span>
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.pendingApproval")}</span>
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.approved")}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.rejected")}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tenant Message */}
                <div className="mt-4 rounded-xl bg-secondary/50 p-4 border border-border/60">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    {t("landlord.tenantMessage")}
                  </p>
                  <p className="text-sm text-foreground italic">"{req.message}"</p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, "Rejected")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("landlord.rejectRequest")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, "Accepted")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {t("landlord.acceptRequest")}
                        </span>
                      </button>
                    </>
                  )}

                  {isAccepted && (
                    <Link
                      to="/landlord/messages"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 border border-border transition-all"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span>{t("landlord.openConversation")}</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </RoleLayout>
  );
}
