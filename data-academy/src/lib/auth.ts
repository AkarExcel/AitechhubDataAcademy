import { getCurrentUser } from "@/lib/permissions";

/**
 * Universal Server Session accessor powered by Supabase SSR.
 * Retains full compatibility with NextAuth signature:
 * const session = await auth();
 */
export async function auth() {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    },
  };
}
