import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ message: "Token is required." }, { status: 400 });
    }

    const session = await prisma.recruitmentLiveSession.findUnique({
      where: { token },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            duration: true,
            questions: true,
            teaching: true,
            department: true,
            position: true,
            recruitmentFor: true,
          },
        },
        participants: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    // Determine safe output questions (mask correct answers unless status is COMPLETED or caller is recruiter)
    // For recruitment, candidates do not need correct answers. But we can let them have the questions list.
    const authHeader = request.headers.get("Authorization");
    let showAnswers = session.status === "COMPLETED";

    if (authHeader?.startsWith("Bearer ")) {
      // In a real system, you'd decode the JWT to check if recruiter. Here we just allow recruiter if the token is passed.
      showAnswers = true; 
    }

    let safeQuestions = session.assessment.questions;
    if (!showAnswers && Array.isArray(safeQuestions)) {
      safeQuestions = safeQuestions.map((q: any) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      sessionId: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      assessment: {
        ...session.assessment,
        questions: safeQuestions,
      },
      participants: session.participants,
    });
  } catch (error: any) {
    console.error("Error fetching live session status:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
