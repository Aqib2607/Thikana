import { createFileRoute } from "@tanstack/react-router";
import { AdminAuditLogsPage } from "@/components/admin/AdminAuditLogsPage";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Admin Thikana" },
      {
        name: "description",
        content: "Immutable audit log trail of administrative moderation actions on Thikana.",
      },
    ],
  }),
  component: AdminAuditLogsPage,
});
