import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

// GET single assessment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Access control: if not public and not created by this teacher, block
    if (!assessment.isPublic && assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: This is a private assessment." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      assessment
    });
  } catch (error: any) {
    console.error("Error retrieving assessment details:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// PUT update single assessment (Edit Mode)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Edit permission check: only creator can modify
    const body = await request.json();
    const { title, duration, subject, lesson, isPublic, questions } = body;

    let sanitizedQuestions = assessment.questions;
    if (questions && Array.isArray(questions)) {
      const seenIds = new Set<string>();
      sanitizedQuestions = questions.map((q: any, idx: number) => {
        let qId = q.id !== undefined && q.id !== null ? String(q.id).trim() : "";
        if (!qId || seenIds.has(qId)) {
          qId = `q-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        }
        seenIds.add(qId);
        let ca = (q.correctAnswer || "").trim();
        if (!ca) {
          ca =
            q.options && q.options.length > 0
              ? q.options[0]
              : q.type === "true_false"
                ? "True"
                : "Option A";
        }
        return { ...q, id: qId, correctAnswer: ca };
      });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        title: title ? title.trim() : assessment.title,
        duration: duration !== undefined ? parseInt(duration.toString(), 10) : assessment.duration,
        subject: subject ? subject.trim() : assessment.subject,
        lesson: lesson ? lesson.trim() : assessment.lesson,
        isPublic: isPublic !== undefined ? !!isPublic : assessment.isPublic,
        questions: sanitizedQuestions as any
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully!",
      assessment: updated
    });
  } catch (error: any) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE single assessment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Delete permission check: only creator can remove
    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: You cannot delete another teacher's assessment." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Find all live sessions for this assessment
      const liveSessions = await tx.liveSession.findMany({
        where: { assessmentId: id },
        select: { id: true },
      });
      const sessionIds = liveSessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        // Delete all participants in these sessions
        await tx.liveSessionParticipant.deleteMany({
          where: {
            sessionId: { in: sessionIds },
          },
        });

        // Delete the live sessions
        await tx.liveSession.deleteMany({
          where: { assessmentId: id },
        });
      }

      // Finally delete the assessment
      await tx.assessment.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully!"
    });
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
