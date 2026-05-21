import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";

/**
 * POST /api/live/[token]/join
 * Public — no auth required.
 * Body: { name, grade, section, studentId }
 * Creates a LiveSessionParticipant and broadcasts student:joined to the teacher.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json() as {
      name?: string;
      grade?: string;
      section?: string;
      studentId?: string;
    };

    const { name, grade, section, studentId } = body;

    // Validate inputs
    if (!name?.trim() || !grade?.trim() || !section?.trim() || !studentId?.trim()) {
      return NextResponse.json(
        { message: "All fields (name, grade, section, studentId) are required." },
        { status: 400 }
      );
    }

    const session = await prisma.liveSession.findUnique({ where: { token } });
    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }
    if (session.status !== "WAITING") {
      return NextResponse.json(
        { message: session.status === "ACTIVE" ? "Session has already started." : "Session has ended." },
        { status: 409 }
      );
    }

    const participant = await prisma.liveSessionParticipant.create({
      data: {
        sessionId: session.id,
        name: name.trim(),
        grade: grade.trim(),
        section: section.trim(),
        studentId: studentId.trim(),
      },
    });

    // Broadcast to teacher and all connected clients
    broadcast(token, {
      type: "student:joined",
      participant: {
        id: participant.id,
        name: participant.name,
        grade: participant.grade,
        section: participant.section,
        studentId: participant.studentId,
        joinedAt: participant.joinedAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
