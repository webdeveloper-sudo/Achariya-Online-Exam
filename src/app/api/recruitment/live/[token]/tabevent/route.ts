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

    const session = await prisma.recruitmentLiveSession.findUnique({
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

    const updatedParticipant = await prisma.recruitmentLiveSessionParticipant.update({
      where: { id: participantId },
      data: {
        tabSwitches: { increment: 1 },
      },
    });

    // Check if limit exceeded (> 2 focus violations)
    if (updatedParticipant.tabSwitches > 2) {
      await prisma.recruitmentLiveSessionParticipant.update({
        where: { id: participantId },
        data: {
          terminated: true,
          completedAt: new Date(),
        },
      });

      // Broadcast an event using the sse-store (using student:submitted type so host updates roster)
      broadcast(token, { type: "student:submitted", participantId });
    } else {
      // Just broadcast a submission/update event so that host updates their count
      broadcast(token, { type: "student:submitted", participantId });
    }

    return NextResponse.json({
      success: true,
      tabSwitches: updatedParticipant.tabSwitches,
      terminated: updatedParticipant.tabSwitches > 2,
    });
  } catch (error: any) {
    console.error("Error in recruitment live tabevent:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
