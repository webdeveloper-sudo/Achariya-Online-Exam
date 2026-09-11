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

    // Fetch all assessments created by this recruiter (or all if Admin)
    const assessments = await prisma.recruitmentAssessment.findMany({
      where: decoded.role === "Admin" ? {} : { createdById: decoded.id },
      select: { id: true },
    });

    const assessmentIds = assessments.map((a) => a.id);

    // Fetch all participants for live sessions matching these assessments
    const participants = await prisma.recruitmentLiveSessionParticipant.findMany({
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

    // Deduplicate by email (case-insensitive) — keep all attempts, group into unique candidates
    const candidateMap = new Map<string, any>();

    for (const p of participants) {
      const key = p.email.toLowerCase().trim();

      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          // Identity fields from the latest attempt
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          qualification: p.qualification,
          experience: p.experience,
          // Assessment history
          attempts: [],
          // Aggregate stats (computed below)
          assessmentCount: 0,
          latestScore: null,
          latestTotalQuestions: null,
          latestPosition: null,
          latestRecruitmentFor: null,
          hasTerminated: false,
          tabSwitches: 0,
          latestCompletedAt: null,
          latestJoinedAt: null,
        });
      }

      const candidate = candidateMap.get(key)!;

      // Add attempt to history
      candidate.attempts.push({
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

      candidate.assessmentCount++;

      // Track the most recent attempt's details (participants are sorted desc by joinedAt)
      if (!candidate.latestJoinedAt || new Date(p.joinedAt) > new Date(candidate.latestJoinedAt)) {
        candidate.latestJoinedAt = p.joinedAt;
        candidate.latestScore = p.score;
        candidate.latestPosition = p.session?.assessment?.position;
        candidate.latestRecruitmentFor = p.session?.assessment?.recruitmentFor;
        candidate.latestCompletedAt = p.completedAt;
        candidate.latestTotalQuestions = p.session?.assessment?.questions
          ? (typeof p.session.assessment.questions === "string"
              ? JSON.parse(p.session.assessment.questions).length
              : (Array.isArray(p.session.assessment.questions) ? p.session.assessment.questions.length : 0))
          : null;

        // Latest attempt name/phone may have been updated
        candidate.name = p.name;
        candidate.phone = p.phone;
        candidate.qualification = p.qualification || candidate.qualification;
        candidate.experience = p.experience || candidate.experience;
      }

      // If any attempt was terminated, flag
      if (p.terminated) candidate.hasTerminated = true;

      // Total tab switches across all attempts
      candidate.tabSwitches += p.tabSwitches ?? 0;
    }

    const uniqueCandidates = Array.from(candidateMap.values());

    return NextResponse.json({
      success: true,
      candidates: uniqueCandidates,
    });
  } catch (error: any) {
    console.error("Error fetching recruitment candidates:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
