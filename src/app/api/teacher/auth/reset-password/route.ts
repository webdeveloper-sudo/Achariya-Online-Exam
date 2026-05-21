import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    // Verify OTP record
    const otpRecord = await prisma.otp.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Save updated password
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        password: passwordHash,
      },
    });

    // Clean up OTPs
    await prisma.otp.deleteMany({
      where: { identifier: email.toLowerCase().trim() },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error in reset password endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
