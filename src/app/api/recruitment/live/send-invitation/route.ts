import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/mail";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    try {
      jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const body = await request.json();
    const { emails, joinUrl, assessmentTitle, position, customSubject, customBody } = body as {
      emails?: string[];
      joinUrl?: string;
      assessmentTitle?: string;
      position?: string;
      customSubject?: string;
      customBody?: string;
    };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ message: "At least one recipient email is required." }, { status: 400 });
    }
    if (!joinUrl) {
      return NextResponse.json({ message: "joinUrl is required." }, { status: 400 });
    }

    // Limit to up to 5 emails as per requirements
    const targetEmails = emails.slice(0, 5);
    const sentResults = [];

    for (const email of targetEmails) {
      const emailTrimmed = email.trim().toLowerCase();
      if (!emailTrimmed) continue;

      const subject = customSubject || `Invitation to Complete Recruitment Assessment: ${assessmentTitle || "Hiring Assessment"}`;
      
      const bodyContent = customBody ? `
        <p style="margin-top: 0; color: #e2e8f0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
          ${customBody}
        </p>
      ` : `
        <p style="margin-top: 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
          Hello Applicant,
        </p>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
          You have been invited to participate in a live hiring assessment for the position of <strong>${position || "Candidate"}</strong>.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 0;">
          Assessment Title: <strong>${assessmentTitle || "General Recruitment Evaluation"}</strong>
        </p>
      `;

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background: #0f172a; color: #f8fafc; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #6366f1; font-weight: 700; margin: 0; font-size: 24px; letter-spacing: -0.025em;">ACHARIYA Online Portal</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Recruitment & Candidate Assessments</p>
          </div>
          
          <div style="background: #1e293b; padding: 25px; border-radius: 8px; border-left: 4px solid #6366f1; margin-bottom: 25px;">
            ${bodyContent}
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Please click the button below to join the waiting room. Make sure you are in a quiet room, have a stable internet connection, and are ready to enter <strong>Fullscreen Mode</strong>. Exiting fullscreen or switching tabs more than twice will result in <strong>automatic disqualification</strong>.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" target="_blank" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; font-weight: 600; border-radius: 6px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: all 0.2s ease;">
              Start Live Assessment
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #6366f1; word-break: break-all;">${joinUrl}</span>
          </p>
          
          <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 10px;">
            &copy; 2026 ACHARIYA Group of Institutions. All rights reserved.
          </p>
        </div>
      `;

      const success = await sendEmail(emailTrimmed, subject, html);
      sentResults.push({ email: emailTrimmed, success });
    }

    return NextResponse.json({
      success: true,
      message: `Invitations processed for ${sentResults.length} recipient(s).`,
      results: sentResults,
    });
  } catch (error: any) {
    console.error("Error in recruitment live invitation sending:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
