import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { assessmentId } = body as { assessmentId?: string };

    if (!assessmentId || typeof assessmentId !== "string") {
      return NextResponse.json({ message: "assessmentId is required." }, { status: 400 });
    }

    const assessment = await prisma.directorAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json({ message: "Director assessment not found." }, { status: 404 });
    }
    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "You can only host your own assessments." }, { status: 403 });
    }

    const token = randomUUID();

    const session = await prisma.directorLiveSession.create({
      data: {
        token,
        assessmentId,
        directorId: decoded.id,
        status: "WAITING",
      },
    });

    const joinUrl = `${APP_URL}/live/director/${token}`;
    const hostUrl = `${APP_URL}/live/director/${token}/host`;

    return NextResponse.json({
      success: true,
      token,
      sessionId: session.id,
      joinUrl,
      hostUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creating live director session:", msg);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
