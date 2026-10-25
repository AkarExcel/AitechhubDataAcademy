import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.AUTH_SECRET || "default-secret-key-replace-in-production";

/**
 * Generates a signed, tamper-proof password reset token valid for 1 hour.
 * Embeds a slice of current password hash so the token is invalidated immediately once used.
 */
export function generateResetToken(user: { id: string; email: string; passwordHash: string }): string {
  const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour
  const hashFingerprint = Buffer.from(user.passwordHash.slice(-12)).toString("base64url");
  const payload = `${user.id}.${expiresAt}.${hashFingerprint}`;

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verifies the token signature, expiration, and ensures it hasn't already been used.
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 4) {
      return { valid: false, error: "Malformed or invalid reset token." };
    }

    const [userId, expiresAtStr, hashFingerprint, signature] = parts;
    const payload = `${userId}.${expiresAtStr}.${hashFingerprint}`;

    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature." };
    }

    // 2. Verify expiration
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: "This password reset link has expired. Please request a new one." };
    }

    // 3. Verify user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      return { valid: false, error: "User account not found or deactivated." };
    }

    // 4. Verify password hasn't been changed since token was issued (one-time use)
    const currentFingerprint = Buffer.from(user.passwordHash.slice(-12)).toString("base64url");
    if (currentFingerprint !== hashFingerprint) {
      return { valid: false, error: "This reset link has already been used. Please request a new one." };
    }

    return { valid: true, user };
  } catch (err) {
    console.error("Token verification error:", err);
    return { valid: false, error: "Failed to verify token." };
  }
}
