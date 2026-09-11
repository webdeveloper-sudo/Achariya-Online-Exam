import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing or malformed token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    // Fetch the director live session
    const session = await prisma.directorLiveSession.findUnique({
      where: { id: sessionId },
      include: {
        assessment: true,
        participants: {
          orderBy: {
            score: "desc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    // Auth Guard: Only Admin OR the Director who conducted the session can view details
    const isAdmin = decoded.role === "Admin";
    const isHost = decoded.id === session.directorId;

    if (!isAdmin && !isHost) {
      return NextResponse.json({ message: "Access Denied: You do not have permissions to view this session." }, { status: 403 });
    }

    // Fetch Host Director profile
    const hostDirector = await prisma.director.findUnique({
      where: { id: session.directorId },
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    const host = hostDirector || {
      name: "System / Unknown",
      email: "unknown@achariya.org",
      role: "Director",
    };

    // Determine activation status of each participant from Teacher table
    const teacherUserIds = session.participants.map(p => p.userId);
    const teachers = await prisma.teacher.findMany({
      where: {
        userId: { in: teacherUserIds }
      },
      select: {
        userId: true,
        activated: true
      }
    });
    const teacherActivationMap = new Map(teachers.map(t => [t.userId, t.activated]));

    const participantsWithActivation = session.participants.map(p => ({
      ...p,
      activated: teacherActivationMap.get(p.userId) ?? false
    }));

    const scores = session.participants
      .map((p: { score: number | null }) => p.score)
      .filter((s: number | null): s is number => s !== null);

    const participantCount = session.participants.length;
    const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)) : 0;
    const highScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowScore = scores.length > 0 ? Math.min(...scores) : 0;

    let totalQuestions = 0;
    if (session.assessment?.questions) {
      try {
        const qs = typeof session.assessment.questions === "string"
          ? JSON.parse(session.assessment.questions)
          : session.assessment.questions;
        totalQuestions = Array.isArray(qs) ? qs.length : 0;
      } catch {
        totalQuestions = 0;
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        token: session.token,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        assessment: {
          id: session.assessment?.id,
          title: session.assessment?.title || "Untitled Assessment",
          position: session.assessment?.position || "N/A",
          recruitmentFor: session.assessment?.recruitmentFor || "N/A",
          totalQuestions,
          questions: session.assessment?.questions,
        },
        host,
        participants: participantsWithActivation,
        stats: {
          participantCount,
          avgScore,
          highScore,
          lowScore,
        },
      },
    });
  } catch (error: any) {
    console.error("Error retrieving detailed session report:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing or malformed token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ message: "Participant ID is required." }, { status: 400 });
    }

    // Fetch the session and check auth
    const session = await prisma.directorLiveSession.findUnique({
      where: { id: sessionId },
      include: {
        assessment: true,
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    const isAdmin = decoded.role === "Admin";
    const isHost = decoded.id === session.directorId;

    if (!isAdmin && !isHost) {
      return NextResponse.json({ message: "Access Denied." }, { status: 403 });
    }

    // Fetch the participant
    const participant = await prisma.directorLiveSessionParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.sessionId !== sessionId) {
      return NextResponse.json({ message: "Participant not found." }, { status: 404 });
    }

    // Parse questions and answers
    let assessmentQuestions = [];
    if (session.assessment?.questions) {
      try {
        assessmentQuestions = typeof session.assessment.questions === "string"
          ? JSON.parse(session.assessment.questions)
          : session.assessment.questions;
      } catch {
        assessmentQuestions = [];
      }
    }

    let studentAnswers: any = {};
    if (participant.answers) {
      try {
        studentAnswers = typeof participant.answers === "string"
          ? JSON.parse(participant.answers)
          : participant.answers;
      } catch {
        studentAnswers = {};
      }
    }

    const totalQuestions = Array.isArray(assessmentQuestions) ? assessmentQuestions.length : 0;
    const scorePercentage = totalQuestions > 0 && participant.score !== null ? ((participant.score / totalQuestions) * 100).toFixed(0) : "0";

    // Build Email body
    const emailSubject = `Assessment Report: ${session.assessment?.title || "Session Results"}`;

    // Format Duration seconds helper
    const formatTime = (sec: number | null) => {
      if (sec === null || sec === undefined) return "N/A";
      const mins = Math.floor(sec / 60);
      const remainder = sec % 60;
      return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
    };

    let questionsHtml = "";
    if (Array.isArray(assessmentQuestions)) {
      assessmentQuestions.forEach((q: any, qIdx: number) => {
        const studentAns = studentAnswers[q.id] || "No Answer";
        const isCorrect = studentAns === q.correctAnswer;
        questionsHtml += `
          <div style="padding: 15px; border: 1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}; background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'}; margin-bottom: 12px; font-family: sans-serif;">
            <p style="margin: 0; font-weight: bold; color: #1e293b; font-size: 14px;">Q${qIdx + 1}: ${q.question}</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">
              Your Selection: <span style="font-weight: bold; color: ${isCorrect ? '#059669' : '#dc2626'};">${studentAns}</span>
            </p>
            ${!isCorrect ? `
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #059669;">
              ✔ Expected Solution: <span style="font-weight: bold;">${q.correctAnswer}</span>
            </p>
            ` : ""}
            ${q.explanation ? `
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #4b5563; font-style: italic;">
              <strong>Explanation:</strong> ${q.explanation}
            </p>
            ` : ""}
          </div>
        `;
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.5;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Achariya Educator Platform</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Detailed Assessment Report</p>
        </div>
        
        <div style="padding: 25px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Dear <strong>${participant.name}</strong>,</p>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">Thank you for participating in the assessment session. Below is your detailed performance analysis.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b; width: 40%;">Assessment Title</td>
              <td style="padding: 10px; font-weight: bold; color: #0f172a;">${session.assessment?.title || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Institution / Branch</td>
              <td style="padding: 10px; color: #0f172a;">${participant.branch || "N/A"}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Designation</td>
              <td style="padding: 10px; color: #0f172a;">${participant.designation || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Duration Taken</td>
              <td style="padding: 10px; color: #0f172a; font-family: monospace;">${formatTime(participant.timeTakenSeconds)}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Score Obtained</td>
              <td style="padding: 10px; font-weight: bold; color: ${participant.terminated ? '#ef4444' : '#059669'}; font-size: 15px;">
                ${participant.terminated ? "Disqualified" : `${participant.score} / ${totalQuestions} (${scorePercentage}%)`}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Anti-Cheat Status</td>
              <td style="padding: 10px; font-weight: bold; color: ${participant.terminated ? '#ef4444' : (participant.tabSwitches > 0 ? '#d97706' : '#059669')};">
                ${participant.terminated ? "Disqualified" : (participant.tabSwitches > 0 ? `${participant.tabSwitches} Tab Switch Warning(s)` : "Verified Secured")}
              </td>
            </tr>
          </table>

          <h3 style="margin: 0 0 15px 0; font-size: 15px; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">Response Audit Summary</h3>
          ${questionsHtml}

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
            This is an automated report from Achariya Educator Platform. Please do not reply directly to this email.
          </div>
        </div>
      </div>
    `;

    // Send email using our centrally managed service
    const { sendEmail } = await import("@/lib/mail");
    const mailSent = await sendEmail(participant.email, emailSubject, emailHtml);

    if (mailSent) {
      return NextResponse.json({ success: true, message: "Report shared successfully via email." });
    } else {
      return NextResponse.json({ success: false, message: "Failed to send email. Please check SMTP configuration." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error sharing report via email:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
