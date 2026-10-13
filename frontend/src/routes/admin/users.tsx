import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Admin Thikana" },
      {
        name: "description",
        content:
          "Manage registered tenant and landlord accounts, verifications, and suspension states.",
      },
    ],
  }),
  component: AdminUsersPage,
});
