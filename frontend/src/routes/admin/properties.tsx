import { createFileRoute } from "@tanstack/react-router";
import { AdminPropertiesPage } from "@/components/admin/AdminPropertiesPage";

export const Route = createFileRoute("/admin/properties")({
  head: () => ({
    meta: [
      { title: "Manage Properties — Admin Thikana" },
      {
        name: "description",
        content: "Review, approve, and manage all rental property listings on Thikana.",
      },
    ],
  }),
  component: AdminPropertiesPage,
});
