import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import { PropertyForm } from "@/components/landlord/PropertyForm";
import type { PropertyItem } from "@/lib/api/properties";
import type { PropertyFormData } from "@/lib/api/landlord";

export const Route = createFileRoute("/landlord/properties/$propertyId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Property Listing — Landlord Portal — Thikana" },
      {
        name: "description",
        content: "Modify rental listing details, pricing, amenities, and availability.",
      },
    ],
  }),
  component: EditPropertyPage,
});

function EditPropertyPage() {
  const { t } = useTranslation();
  const { propertyId } = useParams({ from: "/landlord/properties/$propertyId/edit" });
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    mockLandlordApi.getPropertyById(propertyId).then((data) => {
      if (active) {
        setProperty(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [propertyId]);

  const handleUpdate = async (data: PropertyFormData) => {
    await mockLandlordApi.updateProperty(propertyId, data);
    navigate({ to: "/landlord/properties" });
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("landlord.editPropertyTitle")}
      subtitle={t("landlord.editPropertySubtitle")}
      activeTab="properties"
    >
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("landlord.loadingProperty")}
            </p>
          </div>
        ) : !property ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">
            {t("landlord.propertyNotFound")}
          </div>
        ) : (
          <PropertyForm
            initialData={property}
            onSubmit={handleUpdate}
            onCancel={() => navigate({ to: "/landlord/properties" })}
            isEditing={true}
          />
        )}
      </div>
    </RoleLayout>
  );
}
