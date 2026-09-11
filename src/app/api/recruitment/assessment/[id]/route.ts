import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.recruitmentAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Allowed if Admin, or Owner, or it is a public template
    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;
    const isAllowed = isAdmin || isOwner || assessment.isPublic;

    if (!isAllowed) {
      return NextResponse.json({ message: "Access Denied: You do not have permission to view this assessment." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error: any) {
    console.error("Error retrieving recruitment assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.recruitmentAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Access Denied: You cannot modify assessments created by other recruiters." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      isPublic,
      teaching,
      department,
      duration,
      date,
      day,
      position,
      recruitmentFor,
      questions,
    } = body;

    let sanitizedQuestions = assessment.questions;
    if (questions !== undefined) {
      const parsedQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
      if (Array.isArray(parsedQuestions)) {
        const seenIds = new Set<string>();
        sanitizedQuestions = parsedQuestions.map((q: any, idx: number) => {
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
    }

    const updated = await prisma.recruitmentAssessment.update({
      where: { id },
      data: {
        title: title !== undefined ? title : assessment.title,
        isPublic: isPublic !== undefined ? isPublic : assessment.isPublic,
        teaching: teaching !== undefined ? teaching : assessment.teaching,
        department: department !== undefined ? department : assessment.department,
        duration: duration !== undefined ? parseInt(duration, 10) : assessment.duration,
        date: date !== undefined ? date : assessment.date,
        day: day !== undefined ? day : assessment.day,
        position: position !== undefined ? position : assessment.position,
        recruitmentFor: recruitmentFor !== undefined ? recruitmentFor : assessment.recruitmentFor,
        questions: sanitizedQuestions as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recruitment assessment template updated successfully.",
      assessment: updated,
    });
  } catch (error: any) {
    console.error("Error updating recruitment assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.recruitmentAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Access Denied: You cannot delete assessments created by other recruiters." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Find all live sessions for this assessment
      const liveSessions = await tx.recruitmentLiveSession.findMany({
        where: { assessmentId: id },
        select: { id: true },
      });
      const sessionIds = liveSessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        // Delete all participants in these sessions
        await tx.recruitmentLiveSessionParticipant.deleteMany({
          where: {
            sessionId: { in: sessionIds },
          },
        });

        // Delete the live sessions
        await tx.recruitmentLiveSession.deleteMany({
          where: { assessmentId: id },
        });
      }

      // Finally delete the assessment
      await tx.recruitmentAssessment.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Recruitment assessment template deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting recruitment assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
