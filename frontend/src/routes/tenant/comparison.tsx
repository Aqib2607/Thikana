import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { ComparisonTable } from "@/components/tenant/ComparisonTable";
import { tenantApi } from "@/lib/api/tenant";
import type { PropertyItem } from "@/lib/api/properties";
import { Trash2, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/tenant/comparison")({
  head: () => ({
    meta: [
      { title: "Property Comparison — Thikana" },
      {
        name: "description",
        content: "Compare up to 3 academic rental properties side-by-side across 14 spec fields.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: TenantComparisonPage,
});

export function TenantComparisonPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: comparisons = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["comparisons"],
    queryFn: () => tenantApi.getComparisons(),
  });

  const comparedProperties: PropertyItem[] = comparisons
    .map((c) => c.property)
    .filter((p): p is PropertyItem => Boolean(p))
    .slice(0, 3);

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
    };
    window.addEventListener("thikana.comparison.updated", handleUpdate);
    return () => window.removeEventListener("thikana.comparison.updated", handleUpdate);
  }, [queryClient]);

  const handleRemove = async (propertyId: string) => {
    setActionError(null);
    try {
      await tenantApi.removeComparison(propertyId);
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["tenantDashboardStats"] });
      window.dispatchEvent(new Event("thikana.comparison.updated"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setActionError(
        msg ||
          (isBn
            ? "তুলনা তালিকা থেকে সরাতে সমস্যা হয়েছে।"
            : "Failed to remove property from comparison."),
      );
    }
  };

  const handleClearAll = async () => {
    setActionError(null);
    try {
      await tenantApi.clearComparisons();
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["tenantDashboardStats"] });
      window.dispatchEvent(new Event("thikana.comparison.updated"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setActionError(
        msg ||
          (isBn
            ? "তুলনা তালিকা খালি করতে সমস্যা হয়েছে।"
            : "Failed to clear comparisons. Please try again."),
      );
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.comparisonTitle")}
      subtitle={t("tenant.comparisonMaxNotice")}
      activeTab="comparison"
    >
      {(isError || actionError) && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {actionError ||
                (isBn
                  ? "তুলনা তালিকা লোড করতে সমস্যা হয়েছে।"
                  : "Failed to load comparisons. Please try again.")}
            </span>
          </div>
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "পুনরায় চেষ্টা" : "Retry"}</span>
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="h-96 rounded-2xl border border-border bg-surface p-6 animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-secondary/60" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-64 rounded-xl bg-secondary/60" />
            <div className="h-64 rounded-xl bg-secondary/60" />
            <div className="h-64 rounded-xl bg-secondary/60" />
          </div>
        </div>
      ) : (
        <>
          {comparedProperties.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isBn
                  ? `নির্বাচিত ${comparedProperties.length}টি প্রপার্টির বিস্তারিত তুলনা:`
                  : `Showing comparison for ${comparedProperties.length} selected properties:`}
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isBn ? "তালিকা খালি করুন" : "Clear Comparison"}</span>
              </button>
            </div>
          )}

          <ComparisonTable properties={comparedProperties} onRemove={handleRemove} />
        </>
      )}
    </RoleLayout>
  );
}
