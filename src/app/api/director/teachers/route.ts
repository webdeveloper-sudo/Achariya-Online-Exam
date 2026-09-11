import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(request: Request) {
  try {
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

    // Fetch all assessments created by this director (or all if Admin)
    const assessments = await prisma.directorAssessment.findMany({
      where: decoded.role === "Admin" ? {} : { createdById: decoded.id },
      select: { id: true },
    });

    const assessmentIds = assessments.map((a) => a.id);

    // Fetch all participants for live sessions matching these assessments
    const participants = await prisma.directorLiveSessionParticipant.findMany({
      where: {
        session: {
          assessmentId: { in: assessmentIds },
        },
      },
      include: {
        session: {
          include: {
            assessment: {
              select: {
                title: true,
                position: true,
                recruitmentFor: true,
                teaching: true,
                department: true,
                questions: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Deduplicate by email (case-insensitive) — keep all attempts, group into unique teachers
    const teacherMap = new Map<string, any>();

    for (const p of participants) {
      const key = p.email.toLowerCase().trim();

      if (!teacherMap.has(key)) {
        teacherMap.set(key, {
          // Identity fields from the latest attempt
          id: p.id,
          userId: p.userId,
          name: p.name,
          email: p.email,
          phone: p.phone,
          qualification: p.qualification,
          branch: p.branch,
          designation: p.designation,
          // Assessment history
          attempts: [],
          // Aggregate stats
          assessmentCount: 0,
          latestScore: null,
          latestTotalQuestions: null,
          latestPosition: null,
          latestRecruitmentFor: null,
          hasTerminated: false,
          tabSwitches: 0,
          latestCompletedAt: null,
          latestJoinedAt: null,
          activated: false, // will update below
        });
      }

      const teacherData = teacherMap.get(key)!;

      // Add attempt to history
      teacherData.attempts.push({
        id: p.id,
        sessionToken: p.session?.token,
        assessmentTitle: p.session?.assessment?.title,
        position: p.session?.assessment?.position,
        recruitmentFor: p.session?.assessment?.recruitmentFor,
        score: p.score,
        totalQuestions: p.session?.assessment?.questions
          ? (typeof p.session.assessment.questions === "string"
              ? JSON.parse(p.session.assessment.questions).length
              : (Array.isArray(p.session.assessment.questions) ? p.session.assessment.questions.length : 0))
          : null,
        terminated: p.terminated,
        tabSwitches: p.tabSwitches,
        completedAt: p.completedAt,
        joinedAt: p.joinedAt,
        answers: p.answers,
      });

      teacherData.assessmentCount++;

      // Track the most recent attempt's details
      if (!teacherData.latestJoinedAt || new Date(p.joinedAt) > new Date(teacherData.latestJoinedAt)) {
        teacherData.latestJoinedAt = p.joinedAt;
        teacherData.latestScore = p.score;
        teacherData.latestPosition = p.session?.assessment?.position;
        teacherData.latestRecruitmentFor = p.session?.assessment?.recruitmentFor;
        teacherData.latestCompletedAt = p.completedAt;
        teacherData.latestTotalQuestions = p.session?.assessment?.questions
          ? (typeof p.session.assessment.questions === "string"
              ? JSON.parse(p.session.assessment.questions).length
              : (Array.isArray(p.session.assessment.questions) ? p.session.assessment.questions.length : 0))
          : null;

        // Latest attempt name/phone may have been updated
        teacherData.name = p.name;
        teacherData.userId = p.userId;
        teacherData.phone = p.phone;
        teacherData.qualification = p.qualification || teacherData.qualification;
        teacherData.branch = p.branch || teacherData.branch;
        teacherData.designation = p.designation || teacherData.designation;
      }

      // If any attempt was terminated, flag
      if (p.terminated) teacherData.hasTerminated = true;

      // Total tab switches across all attempts
      teacherData.tabSwitches += p.tabSwitches ?? 0;
    }

    // Lookup activation status of each teacher from the Teacher table
    const emails = Array.from(teacherMap.keys());
    const registeredTeachers = await prisma.teacher.findMany({
      where: {
        email: { in: emails, mode: "insensitive" }
      },
      select: {
        email: true,
        activated: true
      }
    });

    const activationMap = new Map(registeredTeachers.map((t) => [t.email.toLowerCase().trim(), t.activated]));

    for (const [email, data] of teacherMap.entries()) {
      data.activated = activationMap.get(email) ?? false;
    }

    const uniqueTeachers = Array.from(teacherMap.values());

    return NextResponse.json({
      success: true,
      teachers: uniqueTeachers,
    });
  } catch (error: any) {
    console.error("Error fetching director teachers:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
