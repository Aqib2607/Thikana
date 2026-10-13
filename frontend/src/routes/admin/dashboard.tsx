import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Thikana" },
      {
        name: "description",
        content: "Platform moderation, listing approvals, simulated verifications, and audit logs.",
      },
    ],
  }),
  component: AdminDashboard,
});
