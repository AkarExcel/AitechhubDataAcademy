import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Please check your details." },
        { status: 400 }
      );
    }

    const { id, firstName, lastName, email } = parsed.data;

    // Check if user already exists in Prisma database
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(id ? [{ id }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Account already exists.", userId: existing.id },
        { status: 200 }
      );
    }

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...(id ? { id } : {}),
          email,
          passwordHash: "SUPABASE_AUTH",
          role: "STUDENT",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register sync error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
