import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as typeof req & {
    auth: { user?: { role?: string } } | null;
  };
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // Public paths that never need auth
  const publicPaths = [
    "/",
    "/courses",
    "/paths",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/forgot-password",
    "/verify",
  ];

  const isPublic =
    publicPaths.some((p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/")) ||
    nextUrl.pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  // Require login for all dashboard/learn routes
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Admin routes — require ADMIN role
  if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Tutor routes — require TUTOR or ADMIN role
  if (
    nextUrl.pathname.startsWith("/tutor") &&
    role !== "TUTOR" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
