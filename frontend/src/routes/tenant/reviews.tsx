import { createFileRoute } from "@tanstack/react-router";
import { TenantReviewsPage } from "@/components/tenant/TenantReviewsPage";

export const Route = createFileRoute("/tenant/reviews")({
  component: TenantReviewsPage,
});
