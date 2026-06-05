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
