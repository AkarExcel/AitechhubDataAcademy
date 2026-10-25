import { auth } from "@/lib/auth";
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
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "User",
    role: (session.user.role as Role) || "STUDENT",
    image: session.user.image,
  };
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
