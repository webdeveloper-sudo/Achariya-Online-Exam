import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, otp } = body;

    if (!identifier || !otp) {
      return NextResponse.json(
        { message: "Identifier and OTP are required" },
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

    // Check OTP record in the database
    const otpRecord = await prisma.otp.findFirst({
      where: {
        identifier: teacher.email,
        otp: otp.trim(),
        expiresAt: { gt: new Date() }, // OTP must be valid (not expired)
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "OTP verified successfully" });
  } catch (error: any) {
    console.error("Error in verify OTP endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
