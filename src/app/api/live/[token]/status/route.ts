import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/live/[token]/status
 * Public — no auth required.
 * Returns session status and (if WAITING) safe assessment metadata.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const session = await prisma.liveSession.findUnique({
      where: { token },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            duration: true,
            subject: true,
            lesson: true,
            questions: true,
            createdByTeacherName: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
            studentId: true,
            joinedAt: true,
            completedAt: true,
            score: true,
            totalQuestions: true,
            timeTakenSeconds: true,
            tabSwitches: true,
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      sessionId: session.id,
      assessmentId: session.assessmentId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      assessment: session.assessment,
      participants: session.participants,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
