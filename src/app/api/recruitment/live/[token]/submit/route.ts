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
    const { participantId, answers = {}, tabSwitches = 0 } = body;

    if (!participantId) {
      return NextResponse.json({ message: "participantId is required." }, { status: 400 });
    }

    const session = await prisma.recruitmentLiveSession.findUnique({
      where: { token },
      include: {
        assessment: { select: { questions: true } },
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({ message: "Session is not active." }, { status: 409 });
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return NextResponse.json({ message: "Participant not found in this session." }, { status: 404 });
    }

    if (participant.completedAt) {
      return NextResponse.json({ message: "Already submitted." }, { status: 409 });
    }

    // Score calculation
    const questions = (Array.isArray(session.assessment.questions)
      ? session.assessment.questions
      : JSON.parse(session.assessment.questions as string)
    ) as Array<{ id: string; correctAnswer: string; question: string; options?: string[]; type?: string }>;

    let score = 0;
    for (const q of questions) {
      const pAnswer = answers[q.id];
      const cAnswer = q.correctAnswer;
      if (pAnswer && cAnswer && String(pAnswer).trim().toLowerCase() === String(cAnswer).trim().toLowerCase()) {
        score++;
      }
    }

    const completedAt = new Date();
    const timeTakenSeconds = session.startedAt
      ? Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
      : null;

    // Is the user disqualified at submission time?
    const finalTabSwitches = Math.max(participant.tabSwitches, tabSwitches);
    const terminated = finalTabSwitches > 2 || participant.terminated;

    await prisma.recruitmentLiveSessionParticipant.update({
      where: { id: participantId },
      data: {
        completedAt,
        timeTakenSeconds,
        score,
        totalQuestions: questions.length,
        answers: answers as object,
        tabSwitches: finalTabSwitches,
        terminated,
      },
    });

    // Notify recruitment host that a candidate has submitted
    broadcast(token, { type: "student:submitted", participantId });

    return NextResponse.json({
      success: true,
      score,
      totalQuestions: questions.length,
      timeTakenSeconds,
      terminated,
    });
  } catch (error: any) {
    console.error("Error submitting recruitment session:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
