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

    // Check if the student is already registered in the CURRENT session to support re-joining
    const currentExisting = await prisma.liveSessionParticipant.findFirst({
      where: {
        sessionId: session.id,
        studentId: studentId.trim(),
      },
    });

    if (currentExisting) {
      return NextResponse.json({
        success: true,
        message: "Welcome back! Re-joining live session.",
        participantId: currentExisting.id,
      });
    }

    // Check if a student with the same Student ID exists GLOBALLY in any past session
    const globalExisting = await prisma.liveSessionParticipant.findFirst({
      where: {
        studentId: studentId.trim(),
      },
      orderBy: { joinedAt: "desc" },
    });

    if (globalExisting) {
      // If they exist globally, but the submitted details don't match, return 409 conflict
      const nameMatch = globalExisting.name.toLowerCase().trim() === name.toLowerCase().trim();
      const gradeMatch = globalExisting.grade.toLowerCase().trim() === grade.toLowerCase().trim();
      const sectionMatch = globalExisting.section.toLowerCase().trim() === section.toLowerCase().trim();

      if (!nameMatch || !gradeMatch || !sectionMatch) {
        return NextResponse.json(
          {
            success: false,
            duplicate: true,
            message: "A student profile with this Student ID already exists. Please use the 'Find Existing Profile' option to retrieve your account.",
            existingProfile: {
              name: globalExisting.name,
              grade: globalExisting.grade,
              section: globalExisting.section,
              studentId: globalExisting.studentId,
            },
          },
          { status: 409 }
        );
      }
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
