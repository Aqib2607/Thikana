import { createFileRoute } from "@tanstack/react-router";
import { AdminAnalyticsPage } from "@/components/admin/AdminAnalyticsPage";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Rental Analytics — Admin Thikana" },
      {
        name: "description",
        content: "Khulna academic rental demand, student preference ratios, and inquiry trends.",
      },
    ],
  }),
  component: AdminAnalyticsPage,
});
