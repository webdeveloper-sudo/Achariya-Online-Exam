import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, otp, password } = body;

    if (!identifier || !otp || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { userId: identifier.trim() },
        ],
      },
    });

    if (!teacher || !teacher.email) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    // Verify OTP record one last time
    const otpRecord = await prisma.otp.findFirst({
      where: {
        identifier: teacher.email,
        otp: otp.trim(),
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update teacher details
    const activatedTeacher = await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        password: passwordHash,
        activated: true,
        activatedAt: new Date(),
      },
    });

    // Clean up used OTPs
    await prisma.otp.deleteMany({
      where: { identifier: teacher.email },
    });

    // Sign session token
    const token = signToken({
      id: activatedTeacher.id,
      email: activatedTeacher.email,
      role: "Teacher",
      name: activatedTeacher.userName,
    });

    return NextResponse.json({
      message: "Account activated successfully!",
      token,
      user: {
        id: activatedTeacher.id,
        name: activatedTeacher.userName,
        email: activatedTeacher.email,
        role: "Teacher",
      },
    });
  } catch (error: any) {
    console.error("Error in complete activation endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
