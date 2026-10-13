import { createFileRoute } from "@tanstack/react-router";
import { AdminPendingPropertiesPage } from "@/components/admin/AdminPendingPropertiesPage";

export const Route = createFileRoute("/admin/properties/pending")({
  head: () => ({
    meta: [
      { title: "Pending Approvals Queue — Admin Thikana" },
      {
        name: "description",
        content: "Queue for verifying and approving new student rooms and flats in Khulna.",
      },
    ],
  }),
  component: AdminPendingPropertiesPage,
});
