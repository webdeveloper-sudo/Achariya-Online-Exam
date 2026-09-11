import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { endSessionAndBroadcast } from "../submit/route";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

/**
 * POST /api/live/[token]/end
 * Auth: Bearer teacherToken (session owner)
 * Manually ends a session, forces COMPLETED, broadcasts leaderboard.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
        participants: true,
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }
    if (session.teacherId !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: Not session owner." }, { status: 403 });
    }
    if (session.status === "COMPLETED") {
      return NextResponse.json({ message: "Session already completed." }, { status: 409 });
    }

    const leaderboard = await endSessionAndBroadcast(token, session.id, session.participants);

    return NextResponse.json({ success: true, leaderboard });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: "Internal server error: " + msg }, { status: 500 });
  }
}
