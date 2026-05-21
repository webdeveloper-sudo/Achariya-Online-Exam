import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

/**
 * GET /api/live/sessions/[assessmentId]
 * Auth: Bearer teacherToken
 * Returns all LiveSession records for an assessment (for the "Conducted Sessions" panel).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied." }, { status: 401 });
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json({ message: "Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }
    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied." }, { status: 403 });
    }

    const sessions = await prisma.liveSession.findMany({
      where: { assessmentId },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            studentId: true,
            score: true,
            totalQuestions: true,
            timeTakenSeconds: true,
            tabSwitches: true,
            completedAt: true,
            joinedAt: true,
          },
          orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
        },
      },
    });

    // Compute summary stats
    const sessionsWithStats = sessions.map((s) => {
      const completed = s.participants.filter((p) => p.completedAt !== null);
      const scores = completed.map((p) => p.score ?? 0);
      const topScore = scores.length > 0 ? Math.max(...scores) : null;
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;

      return {
        id: s.id,
        token: s.token,
        status: s.status,
        createdAt: s.createdAt,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        participantCount: s.participants.length,
        completedCount: completed.length,
        topScore,
        avgScore,
        participants: s.participants.map((p, i) => ({
          rank: i + 1,
          ...p,
        })),
      };
    });

    return NextResponse.json({ success: true, sessions: sessionsWithStats });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
