import { requireAdmin } from "@/lib/permissions";
import { getAllFeedback } from "@/lib/support-feedback";
import FeedbackAdminClient from "./FeedbackAdminClient";

export const instant = false;

export const metadata = {
  title: "Feedback & Reviews Management | Admin Console",
  description: "Review community feedback, monitor ratings, and feature student testimonials.",
};

export default async function AdminFeedbackPage() {
  await requireAdmin({ redirectUrl: "/unauthorized?required=ADMIN" });

  const initialData = await getAllFeedback({});

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3rem" }}>
      <FeedbackAdminClient
        initialFeedback={initialData.feedback}
        initialStats={initialData.stats}
      />
    </div>
  );
}

