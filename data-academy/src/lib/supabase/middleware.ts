import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const userRole = (user?.user_metadata?.role as string) || "STUDENT";
  const pathname = request.nextUrl.pathname;

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

  // 1. Redirect logged-in users away from /login and /register
  if (isAuthRoute) {
    if (isLoggedIn) {
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (userRole === "TUTOR") {
        return NextResponse.redirect(new URL("/tutor", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 2. Protect Admin routes (authentication check; role is verified by AdminLayout via Prisma)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const callback = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callback}`, request.url)
      );
    }
    return supabaseResponse;
  }

  // 3. Protect Tutor routes (authentication check; role is verified by TutorLayout via Prisma)
  if (isTutorRoute) {
    if (!isLoggedIn) {
      const callback = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callback}`, request.url)
      );
    }
    return supabaseResponse;
  }

  // 4. Protect general authenticated routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      const callback = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callback}`, request.url)
      );
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

