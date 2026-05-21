import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/live/create
 * Body: { assessmentId: string }
 * Auth: Bearer teacherToken
 * Returns: { token, sessionId, hostUrl, joinUrl }
 */
export async function POST(request: Request) {
  try {
    // Auth guard
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: { id: string; email: string; role: string; name?: string };
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId } = body as { assessmentId?: string };

    if (!assessmentId || typeof assessmentId !== "string") {
      return NextResponse.json({ message: "assessmentId is required." }, { status: 400 });
    }

    // Verify assessment exists and belongs to teacher OR is public
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }
    if (assessment.createdById !== decoded.id && !assessment.isPublic) {
      return NextResponse.json({ message: "You can only host your own assessments or public assessments." }, { status: 403 });
    }

    // Create session with a cryptographically unique token
    const token = randomUUID();

    const session = await prisma.liveSession.create({
      data: {
        token,
        assessmentId,
        teacherId: decoded.id,
        status: "WAITING",
      },
    });

    const joinUrl = `${APP_URL}/live/${token}`;
    const hostUrl = `${APP_URL}/live/${token}/host`;

    return NextResponse.json({
      success: true,
      token,
      sessionId: session.id,
      joinUrl,
      hostUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creating live session:", msg);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
