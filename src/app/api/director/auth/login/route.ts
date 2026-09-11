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

    // Find the director
    const director = await prisma.director.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!director) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, director.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Sign session token
    const token = signToken({
      id: director.id,
      email: director.email,
      role: "Director",
      name: director.name,
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: director.id,
        name: director.name,
        email: director.email,
        role: "Director",
      },
    });
  } catch (error: any) {
    console.error("Error in director login endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
