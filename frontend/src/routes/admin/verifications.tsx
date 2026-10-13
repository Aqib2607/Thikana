import { createFileRoute } from "@tanstack/react-router";
import { AdminVerificationsPage } from "@/components/admin/AdminVerificationsPage";

export const Route = createFileRoute("/admin/verifications")({
  head: () => ({
    meta: [
      { title: "Simulated Verifications — Admin Thikana" },
      {
        name: "description",
        content:
          "Platform simulated verification controls: Owner identity, phone, availability, and documents.",
      },
    ],
  }),
  component: AdminVerificationsPage,
});
