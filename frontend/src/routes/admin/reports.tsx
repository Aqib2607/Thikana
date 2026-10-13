import { createFileRoute } from "@tanstack/react-router";
import { AdminReportsPage } from "@/components/admin/AdminReportsPage";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports Moderation — Admin Thikana" },
      {
        name: "description",
        content: "Moderate and resolve reported listings and tenant disputes on Thikana.",
      },
    ],
  }),
  component: AdminReportsPage,
});
