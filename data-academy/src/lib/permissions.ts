import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type Role = "STUDENT" | "TUTOR" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
}

/**
 * Platform Capabilities & Role-based Permissions Map
 */
export const PERMISSIONS = {
  // Learner capabilities
  VIEW_DASHBOARD: ["STUDENT", "TUTOR", "ADMIN"] as Role[],
  ENROLL_COURSES: ["STUDENT", "TUTOR", "ADMIN"] as Role[],
  SUBMIT_ASSIGNMENTS: ["STUDENT", "TUTOR", "ADMIN"] as Role[],
  ACCESS_LEARNING_LABS: ["STUDENT", "TUTOR", "ADMIN"] as Role[],

  // Tutor capabilities
  CREATE_COURSES: ["TUTOR", "ADMIN"] as Role[],
  EDIT_OWN_COURSES: ["TUTOR", "ADMIN"] as Role[],
  GRADE_SUBMISSIONS: ["TUTOR", "ADMIN"] as Role[],
  VIEW_STUDENT_ANALYTICS: ["TUTOR", "ADMIN"] as Role[],

  // Admin capabilities
  MANAGE_ALL_COURSES: ["ADMIN"] as Role[],
  MANAGE_USERS: ["ADMIN"] as Role[],
  ASSIGN_ROLES: ["ADMIN"] as Role[],
  VIEW_AUDIT_LOGS: ["ADMIN"] as Role[],
  MANAGE_PLATFORM_SETTINGS: ["ADMIN"] as Role[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Checks whether a given role has a specific capability
 */
export function canUser(role: string | undefined | null, permission: PermissionKey): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[permission];
  return (allowed as readonly string[]).includes(role);
}

/**
 * Pure helper to verify if a role matches an allowed role or list of roles
 */
export function hasRole(
  userRole: string | undefined | null,
  allowedRoles: Role | Role[]
): boolean {
  if (!userRole) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole as Role);
}

/**
 * Returns current authenticated session user, or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) return null;

    // Find user in database
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: authUser.id }, { email: authUser.email }],
      },
      include: { profile: true },
    });

    // Auto-provision if user authenticated via Supabase but doesn't exist in Prisma yet
    if (!dbUser) {
      const meta = authUser.user_metadata || {};
      const firstName =
        meta.firstName ||
        meta.first_name ||
        authUser.email.split("@")[0] ||
        "Student";
      const lastName = meta.lastName || meta.last_name || "";
      const role = (meta.role as Role) || "STUDENT";

      try {
        dbUser = await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            passwordHash: "SUPABASE_AUTH",
            role: role,
            profile: {
              create: {
                firstName,
                lastName,
              },
            },
          },
          include: { profile: true },
        });
      } catch {
        dbUser = await prisma.user.findFirst({
          where: { email: authUser.email },
          include: { profile: true },
        });
      }
    }

    if (!dbUser) return null;

    // Sync database role to Supabase metadata if not present
    if (authUser.user_metadata?.role !== dbUser.role) {
      supabase.auth.updateUser({
        data: { role: dbUser.role },
      }).catch(() => {});
    }

    const name = dbUser.profile
      ? `${dbUser.profile.firstName} ${dbUser.profile.lastName}`.trim()
      : authUser.user_metadata?.name || dbUser.email;

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: name || "User",
      role: dbUser.role as Role,
      image: dbUser.profile?.avatar || null,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string"
    ) {
      throw error;
    }
    console.error("getCurrentUser error:", error);
    return null;
  }
}

/**
 * Server-side guard: Guarantees user is logged in.
 * Redirects to /login if unauthenticated.
 */
export async function requireUser(callbackUrl?: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
    redirect(target);
  }
  return user;
}

/**
 * Server-side guard: Guarantees user is logged in AND has an approved role.
 * Redirects to /login if unauthenticated, or to /unauthorized if role insufficient.
 */
export async function requireRole(
  allowedRoles: Role | Role[],
  options?: { redirectUrl?: string }
): Promise<AuthenticatedUser> {
  const user = await requireUser();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!allowed.includes(user.role)) {
    const fallback =
      options?.redirectUrl ||
      `/unauthorized?required=${encodeURIComponent(allowed.join(","))}`;
    redirect(fallback);
  }

  return user;
}

/**
 * Convenience helper: Requires ADMIN role
 */
export async function requireAdmin(options?: { redirectUrl?: string }): Promise<AuthenticatedUser> {
  return requireRole("ADMIN", options);
}

/**
 * Convenience helper: Requires TUTOR or ADMIN role
 */
export async function requireTutor(options?: { redirectUrl?: string }): Promise<AuthenticatedUser> {
  return requireRole(["TUTOR", "ADMIN"], options);
}

/**
 * API Route Handler Guard:
 * Validates request authorization and returns either an error NextResponse or the authorized user.
 */
export async function validateApiAuth(allowedRoles?: Role | Role[]): Promise<
  | { authorized: true; user: AuthenticatedUser; errorResponse?: never }
  | { authorized: false; user?: never; errorResponse: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Please log in to access this endpoint." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(user.role)) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            error: "Forbidden: You lack sufficient permissions for this operation.",
            requiredRoles: roles,
            currentRole: user.role,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, user };
}
