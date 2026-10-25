import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TestimonialsAdminClient from "./TestimonialsAdminClient";

export const metadata = {
  title: "Testimonials Management | Data Academy Admin",
  description: "Manage, review, edit and feature student testimonials on the home page.",
};

export const instant = false;

export default async function AdminTestimonialsPage() {
  await requireAdmin({ redirectUrl: "/unauthorized?required=ADMIN" });

  const [rawTestimonials, courses] = await Promise.all([
    prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const testimonials = [...rawTestimonials].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <TestimonialsAdminClient
        initialTestimonials={JSON.parse(JSON.stringify(testimonials))}
        courses={courses}
      />
    </div>
  );
}
