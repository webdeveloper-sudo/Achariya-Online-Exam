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

    // Verify role is Admin
    if (decoded.role !== "Admin") {
      return NextResponse.json({ message: "Access Denied: Admin authorization required." }, { status: 403 });
    }

    // Fetch all live sessions along with their assessment and participants
    const sessions = await prisma.liveSession.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: {
            title: true,
            subject: true,
            lesson: true,
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

    // Fetch all teachers to map the hosts
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        userName: true,
        email: true,
        branch: true,
      },
    });

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // Map sessions to include computed stats and host details
    const formattedSessions = sessions.map((session) => {
      const host = teacherMap.get(session.teacherId) || {
        userName: "System / Unknown",
        email: "unknown@achariya.org",
        branch: "Main Campus",
      };

      const scores = session.participants
        .map((p) => p.score)
        .filter((s): s is number => s !== null);

      const participantCount = session.participants.length;
      const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
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
        assessment: {
          title: session.assessment?.title || "Untitled Assessment",
          subject: session.assessment?.subject || "N/A",
          lesson: session.assessment?.lesson || "N/A",
          totalQuestions,
        },
        host,
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
    console.error("Error retrieving admin live sessions:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
