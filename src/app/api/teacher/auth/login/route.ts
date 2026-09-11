import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the teacher
    const teacher = await prisma.teacher.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check activation
    if (!teacher.activated || !teacher.password) {
      return NextResponse.json(
        {
          message: "Account not activated. Please activate your account first.",
          code: "ACCOUNT_NOT_ACTIVATED",
        },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Sign session token
    const token = signToken({
      id: teacher.id,
      email: teacher.email,
      role: "Teacher",
      name: teacher.userName,
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: teacher.id,
        name: teacher.userName,
        email: teacher.email,
        role: "Teacher",
      },
    });
  } catch (error: any) {
    console.error("Error in teacher login endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
