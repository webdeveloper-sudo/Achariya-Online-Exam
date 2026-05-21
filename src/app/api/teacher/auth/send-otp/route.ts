import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json({ message: "Identifier is required" }, { status: 400 });
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
      return NextResponse.json(
        { message: "Teacher profile or registered email not found." },
        { status: 404 }
      );
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clear any previous OTPs for this email identifier
    await prisma.otp.deleteMany({
      where: { identifier: teacher.email },
    });

    // Save new OTP record
    await prisma.otp.create({
      data: {
        identifier: teacher.email,
        otp,
        contactType: "email",
        expiresAt,
      },
    });

    console.log(`[Email Service] Generated OTP for ${teacher.email}: ${otp}`);

    // Deliver email using nodemailer
    const emailSent = await sendEmail(
      teacher.email,
      "Account Activation OTP - Achariya",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0;">ACHARIYA</h2>
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 0 0;">Educator Portal</p>
        </div>
        
        <p style="font-size: 16px; color: #1f2937; line-height: 1.5; margin: 0 0 16px 0;">Hello <strong>${teacher.userName}</strong>,</p>
        
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
          A master educator profile has been registered for you by the school administrator. Please use the one-time passcode below to verify your identity and finalize your credentials:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; background-color: #f3f4f6; color: #059669; padding: 16px 32px; border-radius: 12px; border: 1px solid #e5e7eb; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This passcode is highly confidential and remains valid for exactly 10 minutes.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;">
        
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
          Achariya Online Examination Assessment Portal<br>
          If you did not request this, please ignore this email or contact security support.
        </p>
      </div>
      `
    );

    if (emailSent) {
      const parts = teacher.email.split("@");
      const masked = parts[0].slice(0, 3) + "***@" + parts[1];
      return NextResponse.json({
        message: `OTP sent successfully to ${masked}`,
      });
    } else {
      // Fallback to dev mode simulation if email dispatch fails or credentials missing
      return NextResponse.json({
        message: `OTP generated (Simulation Mode)`,
        devOtp: otp,
      });
    }
  } catch (error: any) {
    console.error("Error in send OTP endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
