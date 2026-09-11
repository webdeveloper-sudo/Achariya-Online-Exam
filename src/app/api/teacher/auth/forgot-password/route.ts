import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.otp.deleteMany({
      where: { identifier: email.toLowerCase().trim() },
    });

    await prisma.otp.create({
      data: {
        identifier: email.toLowerCase().trim(),
        otp,
        contactType: "email",
        expiresAt,
      },
    });

    console.log(`[DEV ONLY] Reset Password OTP for ${email} is: ${otp}`);

    return NextResponse.json({
      message: "Reset OTP generated successfully",
      devOtp: otp,
    });
  } catch (error: any) {
    console.error("Error in forgot password endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
