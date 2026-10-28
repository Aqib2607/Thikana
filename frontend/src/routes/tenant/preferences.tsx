import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { PreferencesForm } from "@/components/tenant/PreferencesForm";

export const Route = createFileRoute("/tenant/preferences")({
  head: () => ({
    meta: [
      { title: "Rental Preferences — Thikana" },
      {
        name: "description",
        content: "Set your academic rental budget, locations, and amenities for tailored matching.",
      },
    ],
  }),
  component: TenantPreferencesPage,
});

function TenantPreferencesPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.preferencesTitle")}
      subtitle={
        isBn
          ? "আপনার বাজেট, এলাকা ও প্রয়োজনীয় সুবিধার ভিত্তিতে প্রতিটি প্রপার্টির জন্য নির্ভুল ম্যাচিং স্কোর তৈরি হয়।"
          : "Customize your search criteria to enable transparent 6-factor matching across Khulna listings."
      }
      activeTab="preferences"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <PreferencesForm />
      </div>
    </RoleLayout>
  );
}
