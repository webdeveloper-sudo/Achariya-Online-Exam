import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

/**
 * POST /api/live/[token]/start
 * Auth: Bearer teacherToken (must be session owner)
 * Transitions session WAITING → ACTIVE, records startedAt, broadcasts session:start
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Auth guard
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied." }, { status: 401 });
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json({ message: "Invalid token." }, { status: 401 });
    }

    const session = await prisma.liveSession.findUnique({
      where: { token },
      include: {
        assessment: { select: { duration: true } },
        participants: { select: { id: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }
    if (session.teacherId !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: Not session owner." }, { status: 403 });
    }
    if (session.status !== "WAITING") {
      return NextResponse.json({ message: "Session is not in WAITING status." }, { status: 409 });
    }
    if (session.participants.length === 0) {
      return NextResponse.json({ message: "At least one student must be in the waiting room." }, { status: 400 });
    }

    const startedAt = new Date();
    await prisma.liveSession.update({
      where: { token },
      data: { status: "ACTIVE", startedAt },
    });

    broadcast(token, {
      type: "session:start",
      duration: session.assessment.duration,
      startedAt: startedAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      startedAt: startedAt.toISOString(),
      duration: session.assessment.duration,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
