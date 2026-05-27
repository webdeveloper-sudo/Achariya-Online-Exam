import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Verify that the live session room exists
    const session = await prisma.liveSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { message: "Student ID query is required." },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // Look up globally in past participant records by Student ID, returning the most recent first
    const match = await prisma.liveSessionParticipant.findFirst({
      where: {
        studentId: trimmedQuery,
      },
      orderBy: {
        joinedAt: "desc"
      }
    });

    if (!match) {
      return NextResponse.json({
        success: false,
        message: "No profile found with this Student ID."
      });
    }

    return NextResponse.json({
      success: true,
      student: {
        name: match.name,
        grade: match.grade,
        section: match.section,
        studentId: match.studentId
      }
    });
  } catch (error: any) {
    console.error("Error in student live lookup:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
