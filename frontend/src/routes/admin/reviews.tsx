import { createFileRoute } from "@tanstack/react-router";
import { AdminReviewsPage } from "@/components/admin/AdminReviewsPage";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Review Moderation — Admin Thikana" },
      {
        name: "description",
        content: "Moderate tenant reviews, ratings, and visited badges on Thikana.",
      },
    ],
  }),
  component: AdminReviewsPage,
});
