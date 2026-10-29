import { requireAdmin } from "@/lib/permissions";
import { getAllSupportTickets } from "@/lib/support-feedback";
import SupportAdminClient from "./SupportAdminClient";

export const instant = false;

export const metadata = {
  title: "Support Tickets Management | Admin Console",
  description: "Review, assign, and resolve student and tutor support inquiries.",
};

export default async function AdminSupportPage() {
  await requireAdmin({ redirectUrl: "/unauthorized?required=ADMIN" });

  const initialData = await getAllSupportTickets({});

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3rem" }}>
      <SupportAdminClient
        initialTickets={initialData.tickets}
        initialStats={initialData.stats}
      />
    </div>
  );
}

