import { redirect } from "next/navigation";

export default async function TutorCourseRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const query = tab ? `?tab=${tab}` : "";
  redirect(`/admin/courses/${id}${query}`);
}
