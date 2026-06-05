import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Verify that the live session room exists
    const session = await prisma.directorLiveSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { message: "Search query (Employee ID or Email) is required." },
        { status: 400 }
      );
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Look up in the Teacher table
    const match = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: { equals: query.trim(), mode: "insensitive" } },
          { email: normalizedQuery }
        ]
      }
    });

    if (!match) {
      return NextResponse.json({
        success: false,
        message: "No registered teacher found with this Employee ID or Email."
      });
    }

    return NextResponse.json({
      success: true,
      teacher: {
        userId: match.userId,
        userName: match.userName,
        branch: match.branch,
        designation: match.designation,
        email: match.email,
        mobileNo: match.mobileNo,
        qualifications: match.qualifications,
        activated: match.activated
      }
    });
  } catch (error: any) {
    console.error("Error in teacher lookup:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
