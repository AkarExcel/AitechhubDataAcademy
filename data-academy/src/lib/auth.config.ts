import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;

      const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");
      const isDashboardRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/learn") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/profile");
      const isTutorRoute =
        pathname.startsWith("/tutor") || pathname.startsWith("/instructor");
      const isAdminRoute = pathname.startsWith("/admin");

      // 1. Redirect already logged-in users away from /login and /register
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // 2. Protect Admin routes (ADMIN role strictly required)
      if (isAdminRoute) {
        if (!isLoggedIn) {
          const callback = encodeURIComponent(pathname);
          return Response.redirect(
            new URL(`/login?callbackUrl=${callback}`, nextUrl)
          );
        }
        if (userRole !== "ADMIN") {
          return Response.redirect(
            new URL("/unauthorized?required=ADMIN", nextUrl)
          );
        }
        return true;
      }

      // 3. Protect Tutor / Instructor routes (TUTOR or ADMIN required)
      if (isTutorRoute) {
        if (!isLoggedIn) {
          const callback = encodeURIComponent(pathname);
          return Response.redirect(
            new URL(`/login?callbackUrl=${callback}`, nextUrl)
          );
        }
        if (userRole !== "TUTOR" && userRole !== "ADMIN") {
          return Response.redirect(
            new URL("/unauthorized?required=TUTOR", nextUrl)
          );
        }
        return true;
      }

      // 4. Protect general authenticated routes (dashboard, learn, settings, profile)
      if (isDashboardRoute) {
        if (!isLoggedIn) {
          const callback = encodeURIComponent(pathname);
          return Response.redirect(
            new URL(`/login?callbackUrl=${callback}`, nextUrl)
          );
        }
        return true;
      }

      // All other routes are public (e.g. /, /courses, /paths, etc.)
      return true;
    },
  },
  providers: [], // Filled with CredentialsProvider in auth.ts
};
