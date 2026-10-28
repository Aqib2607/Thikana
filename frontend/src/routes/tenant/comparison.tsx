import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { ComparisonTable } from "@/components/tenant/ComparisonTable";
import { mockTenantApi, MOCK_PROPERTIES } from "@/lib/api/mock";
import type { PropertyItem } from "@/lib/api/properties";
import { Trash2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/tenant/comparison")({
  head: () => ({
    meta: [
      { title: "Property Comparison — Thikana" },
      {
        name: "description",
        content: "Compare up to 3 academic rental properties side-by-side across 14 spec fields.",
      },
    ],
  }),
  component: TenantComparisonPage,
});

function TenantComparisonPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [comparedProperties, setComparedProperties] = useState<PropertyItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCompared = () => {
    const ids = mockTenantApi.getComparisonIds();
    const matched = MOCK_PROPERTIES.filter((p) => ids.includes(p.id));
    setComparedProperties(matched.slice(0, 3));
  };

  useEffect(() => {
    loadCompared();
    const handleUpdate = () => loadCompared();
    window.addEventListener("thikana.comparison.updated", handleUpdate);
    return () => window.removeEventListener("thikana.comparison.updated", handleUpdate);
  }, []);

  const handleRemove = (propertyId: string) => {
    mockTenantApi.toggleComparison(propertyId);
    loadCompared();
  };

  const handleClearAll = () => {
    localStorage.removeItem("thikana.comparison");
    window.dispatchEvent(new Event("thikana.comparison.updated"));
    loadCompared();
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.comparisonTitle")}
      subtitle={t("tenant.comparisonMaxNotice")}
      activeTab="comparison"
    >
      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

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
    </RoleLayout>
  );
}
