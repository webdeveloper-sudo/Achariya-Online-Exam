import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    if (!email) {
      return NextResponse.json({ message: "Teacher email is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing or malformed token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const decodedEmail = decodeURIComponent(email).toLowerCase().trim();

    // Fetch all participant attempts matching the email address
    const attempts = await prisma.directorLiveSessionParticipant.findMany({
      where: { email: decodedEmail },
      include: {
        session: {
          include: {
            assessment: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No live evaluation records found for this teacher.",
      }, { status: 404 });
    }

    // Lookup activation status of this teacher from the Teacher table
    const dbTeacher = await prisma.teacher.findFirst({
      where: { email: { equals: decodedEmail, mode: "insensitive" } }
    });

    // Retrieve the most recent registration to establish teacher profile
    const latestAttempt = attempts[0];
    const teacherProfile = {
      userId: dbTeacher?.userId || latestAttempt.userId,
      name: latestAttempt.name,
      email: latestAttempt.email,
      phone: latestAttempt.phone,
      qualification: latestAttempt.qualification,
      branch: latestAttempt.branch,
      designation: latestAttempt.designation,
      joinedAt: latestAttempt.joinedAt,
      activated: dbTeacher?.activated ?? false,
    };

    const formattedAttempts = attempts.map((a: any) => {
      let totalQuestions = 0;
      if (a.session?.assessment?.questions) {
        try {
          const qs = typeof a.session.assessment.questions === "string"
            ? JSON.parse(a.session.assessment.questions)
            : a.session.assessment.questions;
          totalQuestions = Array.isArray(qs) ? qs.length : 0;
        } catch {
          totalQuestions = 0;
        }
      }

      return {
        id: a.id,
        sessionId: a.sessionId,
        joinedAt: a.joinedAt,
        completedAt: a.completedAt,
        timeTakenSeconds: a.timeTakenSeconds,
        score: a.score,
        totalQuestions: totalQuestions || a.totalQuestions || 0,
        answers: a.answers,
        tabSwitches: a.tabSwitches,
        terminated: a.terminated,
        sessionToken: a.session?.token || "N/A",
        assessment: {
          id: a.session?.assessment?.id,
          title: a.session?.assessment?.title || "Untitled Assessment",
          position: a.session?.assessment?.position || "N/A",
          recruitmentFor: a.session?.assessment?.recruitmentFor || "N/A",
          teaching: a.session?.assessment?.teaching || "N/A",
          department: a.session?.assessment?.department || "N/A",
          questions: a.session?.assessment?.questions,
        },
      };
    });

    return NextResponse.json({
      success: true,
      profile: teacherProfile,
      attempts: formattedAttempts,
    });
  } catch (error: any) {
    console.error("Error fetching detailed teacher timeline:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
