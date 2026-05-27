import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast, LeaderboardEntry } from "@/lib/sse-store";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function evaluateShortAnswerWithAI(
  question: string,
  correctAnswer: string,
  studentAnswer: string
): Promise<boolean> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest"
    ];

    const prompt = `
You are an expert exam evaluator. You are grading a short answer question.
Compare the student's answer to the expected correct answer/context.
The student's answer does NOT need to match the correct answer word-for-word, but it must be conceptually correct, accurate, and answer the question properly.

Question: "${question}"
Expected Correct Answer/Context: "${correctAnswer}"
Student's Answer: "${studentAnswer}"

Respond ONLY with a JSON object:
{
  "isCorrect": true or false
}
`;

    let textResponse = "";
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          textResponse = text;
          break;
        }
      } catch (err) {
        // Fallback to next model
      }
    }

    if (!textResponse) {
      return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }

    const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    return !!parsed.isCorrect;
  } catch (err) {
    console.error("Gemini short answer evaluation error:", err);
    return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
}

/**
 * POST /api/live/[token]/submit
 * Public — authenticated by participantId stored in localStorage.
 * Body: { participantId, answers: Record<questionId, answer>, tabSwitches? }
 * Calculates score, saves to DB, and broadcasts leaderboard if all submitted.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json() as {
      participantId?: string;
      answers?: Record<string, string>;
      tabSwitches?: number;
    };

    const { participantId, answers = {}, tabSwitches = 0 } = body;

    if (!participantId) {
      return NextResponse.json({ message: "participantId is required." }, { status: 400 });
    }

    const session = await prisma.liveSession.findUnique({
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

    const participant = session.participants.find((p: any) => p.id === participantId);
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
    ) as Array<{ id: string; correctAnswer: string; question?: string; options?: string[]; type?: string }>;

    const evaluationPromises = questions.map(async (q) => {
      const pAnswer = answers[q.id];
      if (!pAnswer) return false;

      const isShortAnswer = q.type === "short_answer" || (!q.options && q.type !== "true_false");
      if (isShortAnswer) {
        return await evaluateShortAnswerWithAI(
          q.question || `Short answer prompt for question ${q.id}`,
          q.correctAnswer,
          String(pAnswer)
        );
      } else {
        return pAnswer === q.correctAnswer;
      }
    });

    const results = await Promise.all(evaluationPromises);
    const score = results.filter(Boolean).length;

    const completedAt = new Date();
    const timeTakenSeconds = session.startedAt
      ? Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
      : null;

    await prisma.liveSessionParticipant.update({
      where: { id: participantId },
      data: {
        completedAt,
        timeTakenSeconds,
        score,
        totalQuestions: questions.length,
        answers: answers as object,
        tabSwitches,
      },
    });

    broadcast(token, { type: "student:submitted", participantId });

    // Check if all participants have submitted
    const allParticipants = await prisma.liveSessionParticipant.findMany({
      where: { sessionId: session.id },
    });

    const allDone = allParticipants.every((p: any) => p.completedAt !== null);

    if (allDone) {
      await endSessionAndBroadcast(token, session.id, allParticipants);
    }

    return NextResponse.json({
      success: true,
      score,
      totalQuestions: questions.length,
      timeTakenSeconds,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}

// Helper reused also by /end route
export async function endSessionAndBroadcast(
  token: string,
  sessionId: string,
  participants: Array<{
    id: string;
    name: string;
    grade: string;
    section: string;
    studentId: string;
    score: number | null;
    totalQuestions: number | null;
    timeTakenSeconds: number | null;
    tabSwitches: number;
  }>
) {
  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const leaderboard = buildLeaderboard(participants);
  broadcast(token, { type: "session:end", leaderboard });
  return leaderboard;
}

export function buildLeaderboard(
  participants: Array<{
    id: string;
    name: string;
    grade: string;
    section: string;
    studentId: string;
    score: number | null;
    totalQuestions: number | null;
    timeTakenSeconds: number | null;
    tabSwitches: number;
  }>
): LeaderboardEntry[] {
  const sorted = [...participants].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
  });

  return sorted.map((p: any, i: number) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    grade: p.grade,
    section: p.section,
    studentId: p.studentId,
    score: p.score ?? 0,
    totalQuestions: p.totalQuestions ?? 0,
    timeTakenSeconds: p.timeTakenSeconds ?? 0,
    tabSwitches: p.tabSwitches,
  }));
}
