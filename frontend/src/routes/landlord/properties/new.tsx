import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
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
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (data: PropertyFormData) => {
    if (!user) return;
    await mockLandlordApi.createProperty(user.id, data, {
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
    navigate({ to: "/landlord/properties" });
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={isBn ? "নতুন বাসা লিস্টিং যোগ করুন" : "Add New Property Listing"}
      subtitle={
        isBn
          ? "সঠিক তথ্য ও ছবি দিয়ে লিস্টিং জমা দিন। অ্যাডমিন পর্যালোচনার পর এটি অনুসন্ধান ফলাফলে প্রদর্শিত হবে।"
          : "Provide property specifications and photos. Listings go live after administrative review."
      }
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
