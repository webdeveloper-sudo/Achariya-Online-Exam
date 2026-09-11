import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/live/[token]/tabevent
 * Public — authenticated by participantId.
 * Body: { participantId }
 * Increments tabSwitches counter for the participant.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { participantId } = await request.json() as { participantId?: string };

    if (!participantId) {
      return NextResponse.json({ message: "participantId is required." }, { status: 400 });
    }

    const session = await prisma.liveSession.findUnique({ where: { token } });
    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json({ message: "No active session." }, { status: 404 });
    }

    const participant = await prisma.liveSessionParticipant.findFirst({
      where: { id: participantId, sessionId: session.id },
    });
    if (!participant) {
      return NextResponse.json({ message: "Participant not found." }, { status: 404 });
    }

    await prisma.liveSessionParticipant.update({
      where: { id: participantId },
      data: { tabSwitches: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
