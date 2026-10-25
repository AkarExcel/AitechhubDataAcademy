import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes, protected via permissions helpers)
     * - _next/static (static build assets)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - images and static media files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
