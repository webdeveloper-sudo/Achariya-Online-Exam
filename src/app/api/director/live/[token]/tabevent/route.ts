import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ message: "participantId is required." }, { status: 400 });
    }

    const session = await prisma.directorLiveSession.findUnique({
      where: { token },
      include: {
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return NextResponse.json({ message: "Participant not found." }, { status: 404 });
    }

    if (participant.completedAt || participant.terminated) {
      return NextResponse.json({ message: "Participant session is already completed or terminated." }, { status: 409 });
    }

    const updatedParticipant = await prisma.directorLiveSessionParticipant.update({
      where: { id: participantId },
      data: {
        tabSwitches: { increment: 1 },
      },
    });

    // Terminate if limit exceeded (> 2 focus violations)
    if (updatedParticipant.tabSwitches > 2) {
      await prisma.directorLiveSessionParticipant.update({
        where: { id: participantId },
        data: {
          terminated: true,
          completedAt: new Date(),
        },
      });

      broadcast(token, { type: "student:submitted", participantId });
    } else {
      broadcast(token, { type: "student:submitted", participantId });
    }

    return NextResponse.json({
      success: true,
      tabSwitches: updatedParticipant.tabSwitches,
      terminated: updatedParticipant.tabSwitches > 2,
    });
  } catch (error: any) {
    console.error("Error in director live tabevent:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
