import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Recruiter Auth Guard
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    try {
      jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const session = await prisma.recruitmentLiveSession.findUnique({
      where: { token },
      include: { participants: true },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    if (session.status !== "WAITING") {
      return NextResponse.json({ message: "Session is not in WAITING status." }, { status: 409 });
    }

    if (session.participants.length === 0) {
      return NextResponse.json(
        { message: "At least one candidate must be in the waiting room." },
        { status: 400 }
      );
    }

    const updated = await prisma.recruitmentLiveSession.update({
      where: { token },
      data: {
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recruitment assessment session initiated.",
      startedAt: updated.startedAt,
    });
  } catch (error: any) {
    console.error("Error starting live recruitment session:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
