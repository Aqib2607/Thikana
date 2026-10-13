import { createFileRoute } from "@tanstack/react-router";
import { AdminCommunityPage } from "@/components/admin/AdminCommunityPage";

export const Route = createFileRoute("/admin/community")({
  head: () => ({
    meta: [
      { title: "Community Management — Admin Thikana" },
      {
        name: "description",
        content:
          "Manage Khulna area community data: Transport, waterlogging, internet, noise, and safety.",
      },
    ],
  }),
  component: AdminCommunityPage,
});
