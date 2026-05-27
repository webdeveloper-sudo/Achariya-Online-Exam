import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(request: Request) {
  try {
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

    // Fetch recruitment live sessions conducted (all if Admin)
    const sessions = await prisma.recruitmentLiveSession.findMany({
      where: decoded.role === "Admin" ? {} : { recruiterId: decoded.id },
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: {
            title: true,
            position: true,
            recruitmentFor: true,
            questions: true,
          },
        },
        participants: {
          select: {
            score: true,
          },
        },
      },
    });

    const formattedSessions = sessions.map((session: any) => {
      const scores = session.participants
        .map((p: any) => p.score)
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

      return {
        id: session.id,
        token: session.token,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        assessmentId: session.assessmentId,
        assessment: {
          title: session.assessment?.title || "Untitled Assessment",
          position: session.assessment?.position || "N/A",
          recruitmentFor: session.assessment?.recruitmentFor || "N/A",
          totalQuestions,
        },
        stats: {
          participantCount,
          avgScore,
          highScore,
          lowScore,
        },
      };
    });

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error: any) {
    console.error("Error retrieving recruiter live sessions:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
