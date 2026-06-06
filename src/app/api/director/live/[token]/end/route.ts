import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Director Auth Guard
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    try {
      jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const session = await prisma.directorLiveSession.findUnique({
      where: { token },
      include: {
        assessment: true,
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({ message: "Session is not in ACTIVE status." }, { status: 409 });
    }

    // Force finalize all non-submitted participants
    const questions = Array.isArray(session.assessment.questions)
      ? session.assessment.questions
      : JSON.parse(session.assessment.questions as string || "[]");
    const totalQs = questions.length;

    const activeParticipants = session.participants.filter(p => !p.completedAt);
    
    for (const p of activeParticipants) {
      const answers = (p.answers as Record<string, string>) || {};
      let score = 0;
      
      questions.forEach((q: any) => {
        const correct = String(q.correctAnswer).trim().toLowerCase();
        const answered = String(answers[q.id] || "").trim().toLowerCase();
        if (correct && answered === correct) {
          score++;
        }
      });

      const joinedTime = new Date(p.joinedAt).getTime();
      const elapsed = Math.floor((Date.now() - joinedTime) / 1000);

      await prisma.directorLiveSessionParticipant.update({
        where: { id: p.id },
        data: {
          completedAt: new Date(),
          score,
          totalQuestions: totalQs,
          timeTakenSeconds: elapsed,
        },
      });
    }

    // Update session status to COMPLETED
    await prisma.directorLiveSession.update({
      where: { token },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
      },
    });

    // Retrieve fresh sorted participants for leaderboard
    const freshParticipants = await prisma.directorLiveSessionParticipant.findMany({
      where: { sessionId: session.id },
      orderBy: [
        { score: "desc" },
        { timeTakenSeconds: "asc" }
      ]
    });

    // Format for SSE broadcast
    const leaderboardForSse = freshParticipants.map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name,
      grade: p.designation, // Use designation for grade
      section: p.branch, // Use branch for section
      studentId: p.userId, // Use employee ID for studentId
      score: p.score || 0,
      totalQuestions: p.totalQuestions || totalQs,
      timeTakenSeconds: p.timeTakenSeconds || 0,
      tabSwitches: p.tabSwitches,
    }));

    broadcast(token, {
      type: "session:end",
      leaderboard: leaderboardForSse,
    });

    return NextResponse.json({
      success: true,
      message: "Director session successfully completed.",
      sessionId: session.id,
      leaderboard: freshParticipants,
    });
  } catch (error: any) {
    console.error("Error ending live director session:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
