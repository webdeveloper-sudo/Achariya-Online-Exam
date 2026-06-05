import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";
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

    const session = await prisma.directorLiveSession.findUnique({
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

    const evaluationPromises = questions.map(async (q) => {
      const pAnswer = answers[q.id];
      const cAnswer = q.correctAnswer;
      if (!pAnswer || !cAnswer) return false;

      const isShortAnswer = q.type === "short_answer" || (!q.options && q.type !== "true_false");
      if (isShortAnswer) {
        return await evaluateShortAnswerWithAI(
          q.question || `Short answer prompt for question ${q.id}`,
          cAnswer,
          String(pAnswer)
        );
      } else {
        return String(pAnswer).trim().toLowerCase() === String(cAnswer).trim().toLowerCase();
      }
    });

    const results = await Promise.all(evaluationPromises);
    const score = results.filter(Boolean).length;

    const completedAt = new Date();
    const timeTakenSeconds = session.startedAt
      ? Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
      : null;

    // Is the user disqualified at submission time?
    const finalTabSwitches = Math.max(participant.tabSwitches, tabSwitches);
    const terminated = finalTabSwitches > 2 || participant.terminated;

    await prisma.directorLiveSessionParticipant.update({
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

    // Notify director host that a teacher has submitted
    broadcast(token, { type: "student:submitted", participantId });

    return NextResponse.json({
      success: true,
      score,
      totalQuestions: questions.length,
      timeTakenSeconds,
      terminated,
    });
  } catch (error: any) {
    console.error("Error submitting director session:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
