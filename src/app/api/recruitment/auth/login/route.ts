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

    // Find the recruiter
    const recruiter = await prisma.recruiter.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, recruiter.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Sign session token
    const token = signToken({
      id: recruiter.id,
      email: recruiter.email,
      role: "Recruiter",
      name: recruiter.name,
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: recruiter.id,
        name: recruiter.name,
        email: recruiter.email,
        role: "Recruiter",
      },
    });
  } catch (error: any) {
    console.error("Error in recruiter login endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
