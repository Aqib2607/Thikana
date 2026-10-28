import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { landlordApi } from "@/lib/api/landlord";
import { PropertyForm } from "@/components/landlord/PropertyForm";
import type { PropertyFormData } from "@/lib/api/landlord";

export const Route = createFileRoute("/landlord/properties/new")({
  head: () => ({
    meta: [
      { title: "Add New Property Listing — Landlord Portal — Thikana" },
      {
        name: "description",
        content:
          "Submit a new rental property listing for administrative review and publication in Khulna.",
      },
    ],
  }),
  component: CreatePropertyPage,
});

function CreatePropertyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (data: PropertyFormData) => {
    if (!user) return;
    await landlordApi.createProperty(user.id, data, {
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
    navigate({ to: "/landlord/properties" });
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("landlord.addNewTitle")}
      subtitle={t("landlord.addNewSubtitle")}
      activeTab="new"
    >
      <div className="max-w-4xl mx-auto">
        <PropertyForm
          onSubmit={handleCreate}
          onCancel={() => navigate({ to: "/landlord/properties" })}
          isEditing={false}
        />
      </div>
    </RoleLayout>
  );
}
